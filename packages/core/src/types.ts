import { z } from 'zod';

// --- Domain Models ---

export const CodeNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['class', 'interface', 'method', 'function', 'class_property', 'unknown']),
    startLine: z.number(),
    endLine: z.number(),
    metadata: z.record(z.any()).optional(),
});

export type CodeNode = z.infer<typeof CodeNodeSchema>;

export const CodeEdgeSchema = z.object({
    sourceId: z.string(),
    targetId: z.string(),
    type: z.enum(['calls', 'defines', 'imports', 'implements', 'extends']),
});

export type CodeEdge = z.infer<typeof CodeEdgeSchema>;

export interface CodeGraph {
    nodes: CodeNode[];
    edges: CodeEdge[];
}

// --- Interfaces ---

/**
 * Universal interface for parsing source code into a normalized graph.
 */
export interface ICodeParser {
    /**
     * Parses a file content and returns a language-agnostic CodeGraph.
     * @param fileContent The raw string content of the file.
     * @param filePath The path to the file (for ID generation).
     */
    parse(fileContent: string, filePath: string): Promise<CodeGraph>;
}

export interface InjectionOptions {
    mode: 'intrusive' | 'sidecar';
    traceNameInfo?: {
        className?: string;
        methodName?: string;
    };
}

/**
 * Interface for injecting observability code.
 */
export interface IInstrumenter {
    /**
     * Analyzing AST and injecting implementation.
     * Returns the modified source code.
     * 
     * @param fileContent Raw source code
     * @param filePath Path to the file (used for context/logging)
     * @param options Configuration for injection
     */
    inject(fileContent: string, filePath: string, options?: InjectionOptions): Promise<string>;
}
