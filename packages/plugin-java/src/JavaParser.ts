import { ICodeParser, CodeGraph, CodeNode, CodeEdge } from '@codepulse/core';
import Parser from 'tree-sitter';
// @ts-ignore
import Java from 'tree-sitter-java';
import * as fs from 'fs';
import * as path from 'path';

export class JavaParser implements ICodeParser {
    private parser: Parser;
    private query: Parser.Query;

    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Java);

        const queryPath = path.join(__dirname, '../queries/java.scm');
        // Fallback for dev/prod paths
        const scmPath = fs.existsSync(queryPath)
            ? queryPath
            : path.join(__dirname, '../../queries/java.scm');

        const scmContent = fs.readFileSync(scmPath, 'utf8');
        this.query = new Parser.Query(Java, scmContent);
    }

    async parse(fileContent: string, filePath: string): Promise<CodeGraph> {
        const tree = this.parser.parse(fileContent);
        const nodes: CodeNode[] = [];
        const edges: CodeEdge[] = [];
        const rootNode = tree.rootNode;

        // Execute unified query
        const matches = this.query.matches(rootNode);

        // Separate matches by capture name
        const classMatches = matches.filter(m => m.captures.some(c => c.name === 'class'));
        const methodMatches = matches.filter(m => m.captures.some(c => c.name === 'method'));

        // 1. Get Class Name and Class-level Route
        let classIdentifier = "Unknown";
        let classBasePath = "";

        for (const match of classMatches) {
            const classNode = match.captures[0].node;
            const nameNode = classNode.childForFieldName('name');
            if (nameNode) classIdentifier = nameNode.text;

            const annotations = this.getAnnotations(classNode);
            const rm = annotations.find(a => a.name === 'RequestMapping');
            if (rm && rm.value) {
                classBasePath = rm.value.startsWith('/') ? rm.value : '/' + rm.value;
            }
        }

        // 2. Nodes (Methods)
        const methodMatches = methodQuery.matches(rootNode);

        for (const match of methodMatches) {
            const methodNode = match.captures[0].node;
            const nameNode = methodNode.childForFieldName('name');
            const bodyNode = methodNode.childForFieldName('body');

            if (!nameNode || !bodyNode) continue;
            const methodName = nameNode.text;

            const annotations = this.getAnnotations(methodNode);
            let httpMethod: string | undefined;
            let route: string | undefined;

            const am = annotations.find(a => ['GetMapping', 'PostMapping', 'RequestMapping'].includes(a.name));
            if (am) {
                httpMethod = am.name === 'GetMapping' ? 'GET' : (am.name === 'PostMapping' ? 'POST' : undefined);
                const val = am.value || "";
                route = (classBasePath + (val.startsWith('/') ? val : '/' + val)).replace(/\/+/g, '/');
                if (route.endsWith('/') && route.length > 1) route = route.slice(0, -1);
            }

            const id = `${classIdentifier}.${methodName}`;
            nodes.push({
                id,
                name: id,
                type: 'method',
                startLine: methodNode.startPosition.row + 1,
                endLine: methodNode.endPosition.row + 1,
                metadata: {
                    httpMethod,
                    route,
                    className: classIdentifier,
                    methodName
                }
            });

            // 3. Edges (Outgoing Calls)
            const stringQuery = new Parser.Query(Java, `(string_literal) @str`);
            const stringMatches = stringQuery.matches(bodyNode);

            for (const sMatch of stringMatches) {
                const strNode = sMatch.captures[0].node;
                const text = strNode.text.replace(/"/g, '');
                const urlRegex = /http:\/\/([a-zA-Z0-9-]+)(:\d+)?(\/[a-zA-Z0-9-\/]+)?/;
                const uMatch = text.match(urlRegex);

                if (uMatch) {
                    const hostname = uMatch[1];
                    const path = uMatch[3] || "";
                    const targetNodeId = hostname;
                    const pathParts = path.split('/').filter(p => p.length > 0);
                    const targetMethod = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'root';

                    edges.push({
                        sourceId: id,
                        targetId: `${targetNodeId}.${targetMethod}`,
                        type: 'calls'
                    });
                }
            }
        }

        return { nodes, edges };
    }

    private getAnnotations(node: Parser.SyntaxNode): { name: string, value?: string }[] {
        const results: { name: string, value?: string }[] = [];
        const modifiers = node.childForFieldName('modifiers') || node.children.find(c => c.type === 'modifiers');

        if (modifiers) {
            modifiers.children.forEach(child => {
                if (child.type === 'annotation') {
                    const nameNode = child.childForFieldName('name');
                    if (nameNode) {
                        let value: string | undefined;
                        const argsNode = child.childForFieldName('arguments');
                        if (argsNode) {
                            const stringNodes = argsNode.descendantsOfType('string_literal');
                            if (stringNodes.length > 0) {
                                value = stringNodes[0].text.replace(/"/g, '');
                            }
                        }
                        results.push({ name: nameNode.text, value });
                    }
                }
            });
        }
        return results;
    }
}
