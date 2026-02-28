import { ICodeParser, CodeGraph } from '../types';
import { DEFAULT_SKIP_DIRS } from '../constants';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectParser {
    private parsers: Record<string, ICodeParser> = {};
    private skipDirs: ReadonlySet<string> = new Set(DEFAULT_SKIP_DIRS);

    registerParser(extension: string, parser: ICodeParser): this {
        this.parsers[extension] = parser;
        return this;
    }

    /** Override directories to skip when walking (default: node_modules, .git, dist, target, build). */
    setSkipDirs(dirs: readonly string[]): this {
        this.skipDirs = new Set(dirs);
        return this;
    }

    async parse(rootPath: string): Promise<CodeGraph> {
        const graph: CodeGraph = { nodes: [], edges: [] };
        const resolvedRoot = path.resolve(rootPath);

        const walk = async (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!this.skipDirs.has(file)) {
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

        await walk(resolvedRoot);
        return graph;
    }
}
