import { ReconciledGraph } from '../reconciler/types';

export interface AiAnalysisResult {
    summary: string;
    risks: string[];
    score: number;
}

export interface IAiProvider {
    name: string;
    analyze(graph: ReconciledGraph): Promise<AiAnalysisResult>;
    chat(prompt: string): Promise<string>;
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

    async chat(prompt: string): Promise<string> {
        return "(Mock Chat) This is a simulated AI response. The system appears resilient but requires load testing on the Payment Service due to potential latency issues.";
    }
}
