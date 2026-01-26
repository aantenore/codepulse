import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, AiAnalysisResult } from '@codepulse/core/src/ai/IAiProvider';
import { ReconciledGraph } from '@codepulse/core/src/reconciler/types';

export class GoogleAiProvider implements IAiProvider {
    name = 'google';
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY environment variable is not set. Please add it to your .env file.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async analyze(graph: ReconciledGraph): Promise<AiAnalysisResult> {
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
        } catch (error) {
            console.error('Gemini Analysis Failed:', error);
            return {
                summary: "Gemini Analysis Failed due to an error.",
                risks: [`Error: ${error instanceof Error ? error.message : String(error)}`],
                score: 0
            };
        }
    }
}
