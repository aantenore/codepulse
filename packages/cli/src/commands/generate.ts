import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AdvancedFlowReconciler, TraceSpan, CodeGraph, CodeNode, AiAnalysisResult, ProjectParser, MockAiProvider } from '@codepulse/core';
import { JavaParser } from '@codepulse/plugin-java';
import { generateHtml } from '../html-template';
import { TechDocGenerator } from '../generators/markdown-flow';
import { ProviderManager } from '../providers/ProviderManager';

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
    console.log(`[CodePulse] Parsing Source Code at: ${options.source}`);
    const projectParser = new ProjectParser();
    projectParser.registerParser('.java', new JavaParser());

    // Scan source
    const staticGraph = await projectParser.parse(options.source);
    console.log(`[CodePulse] Static Graph: ${staticGraph.nodes.length} nodes found.`);

    if (!fs.existsSync(options.traces)) { console.error(`Trace file missing: ${options.traces}`); process.exit(1); }
    const traceContent = fs.readFileSync(options.traces, 'utf-8');
    let spans: any[] = [];
    try {
        // Handle line-delimited JSON or single JSON object
        const lines = traceContent.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            const raw = JSON.parse(line);

            // Flatten OTLP structure: resourceSpans -> scopeSpans -> spans
            if (raw.resourceSpans) {
                raw.resourceSpans.forEach((rs: any) => {
                    const resourceAttr = rs.resource?.attributes || [];
                    rs.scopeSpans?.forEach((ss: any) => {
                        ss.spans?.forEach((s: any) => {
                            // Inject resource attributes into span for easier matching
                            s.attributes = [...(s.attributes || []), ...resourceAttr];
                            spans.push(s);
                        });
                    });
                });
            } else if (Array.isArray(raw)) {
                spans.push(...raw);
            } else {
                spans.push(raw);
            }
        }
    } catch (e) {
        console.error(`[Error] Failed to parse trace file: ${(e as Error).message}`);
    }

    // Reconcile
    const reconciler = new AdvancedFlowReconciler();
    const result = reconciler.reconcile(staticGraph, spans);

    // 2. AI Analysis
    const provider = ProviderManager.getProvider(options.ai);
    let aiResult: AiAnalysisResult | undefined;

    try {
        console.log(`[AI] Running assessment with ${provider.name}...`);
        aiResult = await provider.analyze(result);
    } catch (e) {
        console.warn(`[AI] ${provider.name} failed, falling back to Mock assessment.`, (e as Error).message);
        aiResult = await new MockAiProvider().analyze(result);
    }

    // 3. Output
    let outPath = options.output;
    if (outPath.endsWith('.md')) outPath = 'report.html';

    // Generate HTML Dashboard
    const html = generateHtml(result, aiResult);
    fs.writeFileSync(outPath, html);

    // Generate Markdown Tech Doc
    const mdContent = await TechDocGenerator.generate(result, provider);
    const mdPath = path.join(path.dirname(outPath), 'FLOW_ARCHITECTURE.md');
    fs.writeFileSync(mdPath, mdContent);

    console.log(`[Success] Dashboard generated at: ${outPath}`);
    console.log(`[Success] Tech Docs generated at: ${mdPath}`);
    console.log(`Open it directly in your browser.`);
}
