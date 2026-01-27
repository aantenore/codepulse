import { ICodeParser, CodeGraph } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectParser {
    private parsers: Record<string, ICodeParser> = {};

    registerParser(extension: string, parser: ICodeParser) {
        this.parsers[extension] = parser;
    }

    async parse(rootPath: string): Promise<CodeGraph> {
        const graph: CodeGraph = { nodes: [], edges: [] };

        const walk = async (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'target') {
                        await walk(fullPath);
                    }
                } else {
                    const ext = path.extname(file);
                    const parser = this.parsers[ext];
                    if (parser) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            const fileGraph = await parser.parse(content, fullPath);
                            graph.nodes.push(...fileGraph.nodes);
                            graph.edges.push(...fileGraph.edges);
                        } catch (e) {
                            console.error(`Failed to parse ${file}`, e);
                        }
                    }
                }
            }
        };

        await walk(rootPath);
        return graph;
    }
}
