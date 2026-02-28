import { IInstrumenter, InjectionOptions } from '@codepulse/core';
import Parser from 'tree-sitter';
// @ts-ignore - Valid in runtime if package exists
import Java from 'tree-sitter-java';

export class JavaInstrumenter implements IInstrumenter {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Java);
    }

    async inject(fileContent: string, filePath: string, options?: InjectionOptions): Promise<string> {
        try {
            const tree = this.parser.parse(fileContent);
            const edits: { start: number; end: number; text: string }[] = [];
            const rootNode = tree.rootNode;

            // --- 1. Import Injection ---
            const importQuery = new Parser.Query(Java, `(import_declaration) @import`);
            const importMatches = importQuery.matches(rootNode);

            let lastImportEnd = 0;
            let hasOtelImport = false;

            if (importMatches.length > 0) {
                const lastImport = importMatches[importMatches.length - 1].captures[0].node;
                lastImportEnd = lastImport.endIndex;

                hasOtelImport = importMatches.some(m =>
                    m.captures[0].node.text.includes('io.opentelemetry.api.trace')
                );
            } else {
                const packageQuery = new Parser.Query(Java, `(package_declaration) @package`);
                const packageMatches = packageQuery.matches(rootNode);
                if (packageMatches.length > 0) {
                    lastImportEnd = packageMatches[0].captures[0].node.endIndex;
                }
            }

            // Detect name collision: user-defined Span or Tracer (use FQN in injected code if so)
            const hasSpanCollision = /\bSpan\s+[\w]+\s*[=;)]|\bclass\s+Span\b|\binterface\s+Span\b/.test(fileContent);
            const hasTracerCollision = /\bTracer\s+[\w]+\s*[=;)]|\bclass\s+Tracer\b|\binterface\s+Tracer\b/.test(fileContent);
            const useFqn = hasSpanCollision || hasTracerCollision;

            if (!hasOtelImport) {
                edits.push({
                    start: lastImportEnd,
                    end: lastImportEnd,
                    text: `\n// [CodePulse] Auto-Import\nimport io.opentelemetry.api.trace.Span;\nimport io.opentelemetry.api.trace.Tracer;\nimport io.opentelemetry.api.common.AttributeKey;\nimport io.opentelemetry.api.common.Attributes;\nimport org.springframework.beans.factory.annotation.Autowired;`
                });
            }

            // --- 2. Field Injection (Tracer) ---
            const classQuery = new Parser.Query(Java, `
          (class_declaration 
            name: (identifier) @className
            body: (class_body) @body
          ) @class
        `);

            const classMatches = classQuery.matches(rootNode);

            for (const match of classMatches) {
                const bodyNode = match.captures.find(c => c.name === 'body')?.node;

                if (bodyNode) {
                    const openBrace = bodyNode.child(0);
                    if (openBrace && openBrace.type === '{') {
                        const tracerType = useFqn ? 'io.opentelemetry.api.trace.Tracer' : 'Tracer';
                        if (!bodyNode.text.includes('Tracer tracer') && !bodyNode.text.includes('trace.Tracer tracer')) {
                            edits.push({
                                start: openBrace.endIndex,
                                end: openBrace.endIndex,
                                text: `\n    // [CodePulse] Injection\n    @Autowired private ${tracerType} tracer;\n`
                            });
                        }
                    }
                }
            }

            // --- 3. Method Injection (Span Start & Try/Finally) ---
            const methodQuery = new Parser.Query(Java, `
          (method_declaration
            modifiers: (modifiers (marker_annotation) @annotation)?
            name: (identifier) @methodName
            body: (block) @methodBody
          ) @method
        `);

            const methodMatches = methodQuery.matches(rootNode);

            for (const match of methodMatches) {
                const methodBody = match.captures.find(c => c.name === 'methodBody')?.node;
                const methodName = match.captures.find(c => c.name === 'methodName')?.node.text;

                // Resolve Parent Class Name
                let parent = methodBody?.parent;
                let pClassName = "UnknownClass";
                while (parent) {
                    if (parent.type === 'class_declaration') {
                        const nameNode = parent.childForFieldName('name');
                        if (nameNode) pClassName = nameNode.text;
                        break;
                    }
                    parent = parent.parent;
                }

                if (methodBody) {
                    const openBrace = methodBody.child(0); // '{'
                    const closeBrace = methodBody.child(methodBody.childCount - 1); // '}'
                    // Skip abstract/native methods (no block or empty block)
                    if (!openBrace || !closeBrace || openBrace.type !== '{' || closeBrace.type !== '}') continue;
                    if (methodBody.childCount <= 2) continue; // only { } — no body

                    if (openBrace && closeBrace && openBrace.type === '{' && closeBrace.type === '}') {
                        const startPos = openBrace.endIndex;
                        const endPos = closeBrace.startIndex; // Position before '}'

                        if (methodBody.text.includes('tracer.spanBuilder')) {
                            continue;
                        }

                        const spanType = useFqn ? 'io.opentelemetry.api.trace.Span' : 'Span';
                        const traceStart = `\n        // [CodePulse] Trace Start\n        ${spanType} span = tracer.spanBuilder("${pClassName}.${methodName}").startSpan();\n        try (var scope = span.makeCurrent()) {\n`;
                        const traceEnd = `\n        } finally {\n            span.end();\n        }\n`;

                        edits.push({
                            start: startPos,
                            end: startPos,
                            text: traceStart
                        });

                        edits.push({
                            start: endPos,
                            end: endPos,
                            text: traceEnd
                        });

                        // --- 4. Internal Call Tracing (Within Method) ---
                        // Look for specific calls inside this method body
                        // DB Targets: save, findById, executeQuery
                        // HTTP Targets: postForObject, send

                        // We traverse the children of the method body to find invocations
                        // Using a recursive walker or a sub-query on the methodBody node
                        // Note: tree-sitter Query.matches() works on the whole tree usually, 
                        // but we can filter by range or just run a new query on the node (if supported) 
                        // or traverse manually. Walking is safer given we have the node.

                        const internalCalls: { type: 'db' | 'http', name: string, node: Parser.SyntaxNode }[] = [];

                        const findCalls = (node: Parser.SyntaxNode) => {
                            if (node.type === 'method_invocation') {
                                const nameNode = node.childForFieldName('name');
                                if (nameNode) {
                                    const name = nameNode.text;
                                    if (['save', 'findById', 'executeQuery'].includes(name)) {
                                        internalCalls.push({ type: 'db', name, node });
                                    } else if (['postForObject', 'send', 'getForEntity'].includes(name)) {
                                        internalCalls.push({ type: 'http', name, node });
                                    }
                                }
                            }
                            for (let i = 0; i < node.childCount; i++) {
                                const child = node.child(i);
                                if (child) findCalls(child);
                            }
                        };

                        findCalls(methodBody);

                        for (const call of internalCalls) {
                            // Find the statement containing this call to insert before it
                            let statement = call.node;
                            while (statement.parent && statement.parent.type !== 'block' && statement.parent?.type !== 'method_declaration') {
                                statement = statement.parent;
                            }

                            // Only inject if it's within our method body block
                            if (statement.parent?.id === methodBody.id) {
                                const indent = "            "; // Approximate indentation
                                let injection = "";
                                if (call.type === 'db') {
                                    injection = `\n${indent}span.addEvent("db_call", Attributes.of(AttributeKey.stringKey("db.statement"), "${call.name}"));`;
                                } else {
                                    injection = `\n${indent}span.addEvent("external_api_call", Attributes.of(AttributeKey.stringKey("api.operation"), "${call.name}"));`;
                                }

                                // Check if we already injected this (rough check)
                                // To avoid duplicates if we run multiple times (though we check spanBuilder above)

                                edits.push({
                                    start: statement.startIndex,
                                    end: statement.startIndex,
                                    text: injection
                                });
                            }
                        }
                    }
                }
            }

            // --- Apply Edits ---
            {
                edits.sort((a, b) => b.start - a.start);
                let modified = fileContent;
                for (const edit of edits) {
                    modified = modified.slice(0, edit.start) + edit.text + modified.slice(edit.end);
                }
                return modified;
            }
        } catch (e) {
            console.error(`[CodePulse] Error instrumenting ${filePath}:`, e);
            return fileContent;
        }
    }
}
