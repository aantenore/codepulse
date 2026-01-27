import { ICodeParser, CodeGraph, CodeNode, CodeEdge } from '@codepulse/core';
import Parser from 'tree-sitter';
// @ts-ignore
import Java from 'tree-sitter-java';

export class JavaParser implements ICodeParser {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Java);
    }

    async parse(fileContent: string, filePath: string): Promise<CodeGraph> {
        const tree = this.parser.parse(fileContent);
        const nodes: CodeNode[] = [];
        const edges: CodeEdge[] = [];
        const rootNode = tree.rootNode;

        // Global Annotation Scan (Fail-safe)
        const annoRegex = /@(GetMapping|PostMapping|RequestMapping)\s*\(\s*"([^"]+)"\s*\)/g;
        const lineMetadata: Record<number, { method: string, route: string }> = {};
        const lines = fileContent.split('\n');

        let classBasePath = "";
        const classRMRegex = /@RequestMapping\s*\(\s*"([^"]+)"\s*\)\s*public\s+class/i;
        const crMatch = fileContent.match(classRMRegex);
        if (crMatch) classBasePath = crMatch[1];

        lines.forEach((line, i) => {
            let match;
            const rowRegex = /@(GetMapping|PostMapping|RequestMapping)\s*\(\s*"([^"]+)"\s*\)/g;
            while ((match = rowRegex.exec(line)) !== null) {
                const fullRoute = (classBasePath + (match[2].startsWith('/') ? match[2] : '/' + match[2])).replace(/\/+/g, '/');
                lineMetadata[i + 1] = {
                    method: match[1].replace('Mapping', '').toUpperCase(),
                    route: fullRoute
                };
            }
        });

        const methodQuery = new Parser.Query(Java, `
            (method_declaration name: (identifier) @methodName body: (block) @body) @method
        `);

        // 1. Get Class Name
        const classQuery = new Parser.Query(Java, `(class_declaration name: (identifier) @className) @class`);
        const classMatches = classQuery.matches(rootNode);
        let classIdentifier = "Unknown";
        for (const match of classMatches) {
            const nameNode = match.captures.find(c => c.name === 'className')?.node;
            if (nameNode) classIdentifier = nameNode.text;
        }

        // 2. Nodes (Methods)
        const methodMatches = methodQuery.matches(rootNode);

        for (const match of methodMatches) {
            const methodNode = match.captures.find(c => c.name === 'method')?.node;
            const methodName = match.captures.find(c => c.name === 'methodName')?.node.text;
            const bodyNode = match.captures.find(c => c.name === 'body')?.node;

            if (!methodNode || !methodName || !bodyNode) continue;

            const startLine = methodNode.startPosition.row + 1;
            // Check current or previous line for metadata
            const metadata = lineMetadata[startLine] || lineMetadata[startLine - 1] || {};

            const id = `${classIdentifier}.${methodName}`;
            nodes.push({
                id,
                name: id,
                type: 'method',
                startLine,
                endLine: methodNode.endPosition.row + 1,
                metadata: {
                    httpMethod: metadata.method,
                    route: metadata.route,
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
}
