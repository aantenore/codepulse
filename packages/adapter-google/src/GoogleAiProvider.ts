import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, AiAnalysisResult } from '@codepulse/core/src/ai/IAiProvider';
import { ReconciledGraph } from '@codepulse/core/src/reconciler/types';

export class GoogleAiProvider implements IAiProvider {
    name = 'google';
    private genAI?: GoogleGenerativeAI;
    private model?: any;
    private modelName: string;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn('GOOGLE_API_KEY environment variable is not set. Google AI features will fail.');
        }
        let modelName = process.env.AI_MODEL_GOOGLE || 'gemini-1.5-flash';
        // FIX: Remove 'models/' prefix to avoid 404s (SDK adds it)
        if (modelName.startsWith('models/')) {
            modelName = modelName.replace('models/', '');
        }
        this.modelName = modelName;
        console.log(`[AI] Using Google Gemini model: ${this.modelName}`);

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        }
    }

    async analyze(graph: ReconciledGraph): Promise<AiAnalysisResult> {
        if (!this.model) {
            return {
                summary: "Google AI Provider not configured (missing API Key).",
                risks: ["Configuration Error: Missing GOOGLE_API_KEY"],
                score: 0
            };
        }

        const prompt = `
You are a Senior Software Architect reviewing a project's architecture based on runtime analysis.
Please analyze the following system metrics and graph data:

System Summary:
- Total Nodes: ${graph.summary.totalNodes}
- Verified (Active): ${graph.summary.verified}
- Potentially Dead (Zombies): ${graph.summary.zombies}
- Discovered Dependencies: ${graph.summary.discovered}

Nodes Detail:
${JSON.stringify(graph.nodes.slice(0, 50), null, 2)}
(Truncated to first 50 nodes for brevity)

Please provide a JSON response with the following structure (do not use markdown code blocks, just raw JSON):
{
  "summary": "A brief executive summary of the architecture and health.",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "score": number (0-100)
}
`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potentially markdown formatted JSON
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const analysis = JSON.parse(cleanText);

            return {
                summary: analysis.summary || "Analysis failed to produce summary",
                risks: analysis.risks || [],
                score: analysis.score || 0
            };
        } catch (error: any) {
            console.error('Gemini Analysis Failed. Details:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                model: this.modelName
            });
            throw error;
        }
    }

    async chat(prompt: string): Promise<string> {
        if (!this.model) return "Google AI Provider not configured.";
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (e) {
            console.error("Google Chat Failed", e);
            throw e;
        }
    }
}
