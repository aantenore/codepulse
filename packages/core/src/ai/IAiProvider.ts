import { ReconciledGraph } from '../reconciler/types';

export interface AiAnalysisResult {
    summary: string;
    risks: string[];
    score: number;
}

export interface IAiProvider {
    name: string;
    analyze(graph: ReconciledGraph): Promise<AiAnalysisResult>;
}

export class MockAiProvider implements IAiProvider {
    name = 'mock';
    async analyze(graph: ReconciledGraph): Promise<AiAnalysisResult> {
        return {
            summary: `(Mock Analysis) The system consists of ${graph.summary.totalNodes} nodes. Flow appears standard but contains ${graph.summary.zombies} potentially dead paths that should be deprecated.`,
            risks: [
                `${graph.summary.zombies} Zombie methods detected (Unused code).`,
                `Dependencies verified: ${graph.summary.discovered}.`,
                "Mock Risk: Hardcoded credential pattern (simulation)."
            ],
            score: 85
        };
    }
}
