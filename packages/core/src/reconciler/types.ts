import { CodeNode, CodeEdge } from '../types';

export type NodeStatus = 'verified' | 'potentially_dead' | 'discovered' | 'error';

export interface ReconciledNode extends CodeNode {
    status: NodeStatus;
    telemetry: {
        executionCount: number;
        avgDurationMs: number;
        lastSeen?: string;
        discoveredDependencies: string[];
        errors: number;
    };
}

export interface ReconciledGraph {
    nodes: ReconciledNode[];
    edges: CodeEdge[];
    summary: {
        totalNodes: number;
        verified: number;
        zombies: number;
        discovered: number;
    };
}
