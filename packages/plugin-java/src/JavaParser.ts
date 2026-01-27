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

        const classQuery = new Parser.Query(Java, `
            (class_declaration name: (identifier) @className) @class
        `);
        const methodQuery = new Parser.Query(Java, `
            (method_declaration name: (identifier) @methodName body: (block) @body) @method
        `);

        // 1. Nodes (Methods) - We focus on Methods for the Flow
        // We could also do Classes, but CodePulse seems to focus on Method-level flow (OrderController.create)

        const methodMatches = methodQuery.matches(rootNode);

        for (const match of methodMatches) {
            const methodNode = match.captures.find(c => c.name === 'method')?.node;
            const methodName = match.captures.find(c => c.name === 'methodName')?.node.text;
            const bodyNode = match.captures.find(c => c.name === 'body')?.node;

            if (!methodNode || !methodName || !bodyNode) continue;

            // Find Class Name
            let parent = methodNode.parent;
            let className = 'Unknown';
            while (parent) {
                if (parent.type === 'class_declaration') {
                    const nameNode = parent.childForFieldName('name');
                    if (nameNode) className = nameNode.text;
                    break;
                }
                parent = parent.parent;
            }

            const id = `${className}.${methodName}`;
            nodes.push({
                id,
                name: id,
                type: 'method',
                startLine: methodNode.startPosition.row + 1,
                endLine: methodNode.endPosition.row + 1
            });

            // 2. Edges (Outgoing Calls)
            // Look for restTemplate.postForObject / getForObject
            // Or simple method calls if we want internal flow
            // For Micro-Commerce, we look for HTTP calls to other services

            // Heuristic: URL strings in calls
            // "http://payment-service:8084/pay"

            // We scan the body for strings that look like URLs
            // This is a robust heuristic for the demo

            const stringQuery = new Parser.Query(Java, `(string_literal) @str`);
            const stringMatches = stringQuery.matches(bodyNode);

            for (const sMatch of stringMatches) {
                const strNode = sMatch.captures[0].node;
                const text = strNode.text.replace(/"/g, ''); // strip quotes

                // Detection logic: Generic URL Extraction
                // Pattern: http://[hostname]:[port]/[endpoint]
                // We map [hostname] to the Target Node ID.
                // We map [endpoint] to the Target Method Name (heuristic).

                const urlRegex = /http:\/\/([a-zA-Z0-9-]+)(:\d+)?(\/[a-zA-Z0-9-\/]+)?/;
                const match = text.match(urlRegex);

                if (match) {
                    const hostname = match[1]; // e.g., "auth-service"
                    const path = match[3] || ""; // e.g., "/login" or "/api/order"

                    // Generic Mapping:
                    // Hostname "foo-service" -> Node "foo-service"
                    // We don't assume "FooController" anymore unless we have a map.
                    // But for the graph to look good, we can canonicalize "repo-foo" or "foo-service".

                    const targetNodeId = hostname;

                    // Target Method: Last part of path, or 'root'
                    // e.g., /login -> login
                    // e.g., /api/order -> order
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
