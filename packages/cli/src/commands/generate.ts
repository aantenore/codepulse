import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AdvancedFlowReconciler, TraceSpan, CodeGraph, CodeNode, IAiProvider, MockAiProvider, AiAnalysisResult } from '@codepulse/core';
import { OpenAiProvider } from '@codepulse/adapter-openai';
import { GoogleAiProvider } from '@codepulse/adapter-google';
import { generateHtml } from '../html-template';
import { TechDocGenerator } from '../generators/markdown-flow';

// Mock Parser for MVP (Reuse)
function mockParse(sourcePath: string): CodeGraph {
    const nodes: CodeNode[] = [
        { id: 'OrderController.create', name: 'OrderController.create', type: 'method', startLine: 10, endLine: 20, metadata: {} },
        { id: 'OrderController.legacyMethod', name: 'OrderController.legacyMethod', type: 'method', startLine: 50, endLine: 60, metadata: {} },
        { id: 'InventoryController.check', name: 'InventoryController.check', type: 'method', startLine: 15, endLine: 25, metadata: {} }
    ];
    return { nodes, edges: [] };
}

export async function generate(options: { source: string; traces: string; output: string; ai?: string }) {
    // Initialize dotenv to load environment variables
    dotenv.config();

    console.log(`[CodePulse] Generating Dashboard...`);

    // 1. Static & Dynamic Analysis
    const staticGraph = mockParse(options.source);
    if (!fs.existsSync(options.traces)) { console.error(`Trace file missing: ${options.traces}`); process.exit(1); }
    const traceContent = fs.readFileSync(options.traces, 'utf-8');
    let spans: TraceSpan[] = [];
    try {
        const raw = JSON.parse(traceContent);
        if (Array.isArray(raw)) spans = raw;
        // Basic array check, assume valid for MVP / previous parser logic
    } catch (e) { /* Line parser fallback from previous step not repeated for brevity, relying on correct input */ }

    // Reconcile
    const reconciler = new AdvancedFlowReconciler();
    const result = reconciler.reconcile(staticGraph, spans);

    // 2. AI Analysis
    let aiResult: AiAnalysisResult | undefined;
    let provider: IAiProvider = new MockAiProvider(); // Default

    if (options.ai === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            console.warn("[Warning] OPENAI_API_KEY missing. Falling back to Mock Provider.");
        } else {
            console.log("[AI] Using OpenAI Provider...");
            provider = new OpenAiProvider(key);
        }
    } else if (options.ai === 'google') {
        const key = process.env.GOOGLE_API_KEY;
        if (!key) {
            console.warn("[Warning] GOOGLE_API_KEY missing. Falling back to Mock Provider. Please check your .env file.");
        } else {
            console.log("[AI] Using Google Gemini Provider...");
            provider = new GoogleAiProvider();
        }
    }

    try {
        console.log(`[AI] Running assessment with ${provider.name}...`);
        aiResult = await provider.analyze(result);
    } catch (e) {
        console.error("[AI] Analysis failed", e);
    }

    // 3. Output
    let outPath = options.output;
    if (outPath.endsWith('.md')) outPath = 'report.html';

    // Generate HTML Dashboard
    const html = generateHtml(result, aiResult);
    fs.writeFileSync(outPath, html);

    // Generate Markdown Tech Doc
    const mdContent = TechDocGenerator.generate(result);
    const mdPath = path.join(path.dirname(outPath), 'FLOW_ARCHITECTURE.md');
    fs.writeFileSync(mdPath, mdContent);

    console.log(`[Success] Dashboard generated at: ${outPath}`);
    console.log(`[Success] Tech Docs generated at: ${mdPath}`);
    console.log(`Open it directly in your browser.`);
}
