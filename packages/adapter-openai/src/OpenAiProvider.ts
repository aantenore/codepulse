import { IAiProvider, AiAnalysisResult, ReconciledGraph } from '@codepulse/core';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export class OpenAiProvider implements IAiProvider {
    name = 'openai';
    private modelName: string;
    private openai: any;

    constructor() {
        this.modelName = process.env.AI_MODEL_OPENAI || 'gpt-4o';
        const apiKey = process.env.OPENAI_API_KEY;
        this.openai = createOpenAI({
            apiKey: apiKey
        });
        console.log(`[AI] OpenAI Provider (Vercel SDK) initialized. Model: ${this.modelName}`);
    }

    async analyze(graph: ReconciledGraph): Promise<AiAnalysisResult> {
        const prompt = `
        You are a Senior Software Architect reviewing a project's architecture based on runtime analysis.
        Please analyze the following system metrics and graph data:

        System Summary:
        ${JSON.stringify(graph.summary, null, 2)}

        Nodes Detail:
        ${JSON.stringify(graph.nodes.slice(0, 50), null, 2)}
        (Truncated to first 50 nodes for brevity)
        
        Return ONLY valid JSON with this structure (no markdown blocks):
        { 
          "summary": "A brief executive summary of the architecture and health.", 
          "risks": ["Risk 1", "Risk 2"], 
          "score": number (0-100)
        }
        `;

        try {
            const { text } = await generateText({
                model: this.openai(this.modelName),
                prompt: prompt
            });

            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            return {
                summary: analysis.summary || "Analysis failed to produce summary",
                risks: analysis.risks || [],
                score: analysis.score || 0
            };
        } catch (error: any) {
            console.error('[AI] OpenAI Analysis Failed:', error);
            throw error;
        }
    }

    async chat(msg: string): Promise<string> {
        try {
            const { text } = await generateText({
                model: this.openai(this.modelName),
                prompt: msg
            });
            return text;
        } catch (error: any) {
            console.error('[AI] OpenAI Chat Failed:', error);
            throw error;
        }
    }
}
