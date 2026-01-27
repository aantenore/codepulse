import { IAiProvider, AiAnalysisResult, ReconciledGraph } from '@codepulse/core';
import OpenAI from 'openai';

export class OpenAiProvider implements IAiProvider {
    name = 'openai';
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
        this.model = process.env.AI_MODEL_OPENAI || 'gpt-4o';
        console.log(`[AI] Using OpenAI model: ${this.model}`);
    }

    async analyze(graph: ReconciledGraph): Promise<AiAnalysisResult> {
        const systemPrompt = `You are a Principal Software Architect specializing in Microservices and Distributed Tracing. 
    Analyze the provided "CodePulse Reconciled Graph" JSON.
    
    Current State:
    - Total Nodes: ${graph.summary.totalNodes}
    - Zombies (Unused Code): ${graph.summary.zombies}
    - Verified (Alive): ${graph.summary.verified}
    - Discovered (Hidden Dependencies): ${graph.summary.discovered}

    Task:
    Provide a health assessment of the system.
    1. Summarize the flow and coverage.
    2. Identify specific risks (e.g., high dependency coupling, dead code, error rates).
    3. Assign a 0-100 "Health Score" based on code coverage and architectural cleanliness.

    Output JSON ONLY:
    {
      "summary": "...",
      "risks": ["risk1", "risk2"],
      "score": 85
    }`;

        // Minimize graph for token limit (strip heavy metadata if needed)
        // For now, send full graph as it's small in playground.
        const userPrompt = JSON.stringify(graph.nodes.map(n => ({
            name: n.name,
            status: n.status,
            deps: n.telemetry.discoveredDependencies,
            errors: n.telemetry.errors
        })));

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" }
        } as any);

        const content = response.choices[0].message.content || '{}';
        try {
            const parsed = JSON.parse(content);
            return {
                summary: parsed.summary || "Analysis failed to parse.",
                risks: parsed.risks || [],
                score: parsed.score || 0
            };
        } catch (e) {
            return {
                summary: "Error parsing AI response.",
                risks: ["Analysis Parse Error"],
                score: 0
            };
        }
    }
    async chat(prompt: string): Promise<string> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
            });
            return response.choices[0].message.content || '';
        } catch (e) {
            console.error("OpenAI Chat Failed", e);
            return "Error generating content.";
        }
    }
}
