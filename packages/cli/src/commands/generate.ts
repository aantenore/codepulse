import * as fs from 'fs';
import * as path from 'path';
import { AdvancedFlowReconciler, TraceSpan, CodeGraph, CodeNode } from '@codepulse/core';
import { generateHtml } from '../html-template';

// Mock Parser for MVP (Reuse logic)
function mockParse(sourcePath: string): CodeGraph {
    const nodes: CodeNode[] = [
        {
            id: 'OrderController.create',
            name: 'OrderController.create',
            type: 'method',
            startLine: 10,
            endLine: 20,
            metadata: { className: 'OrderController' }
        },
        {
            // A node that exists in code but is NEVER called (Zombie Test)
            id: 'OrderController.legacyMethod',
            name: 'OrderController.legacyMethod',
            type: 'method',
            startLine: 50,
            endLine: 60,
            metadata: { className: 'OrderController' }
        },
        {
            id: 'InventoryController.check',
            name: 'InventoryController.check',
            type: 'method',
            startLine: 15,
            endLine: 25,
            metadata: { className: 'InventoryController' }
        }
    ];
    return { nodes, edges: [] };
}

export async function generate(options: { source: string; traces: string; output: string }) {
    console.log(`[CodePulse] Generating Dashboard...`);

    // 1. Static Analysis
    const staticGraph = mockParse(options.source);
    console.log(`[Analysis] Found ${staticGraph.nodes.length} static nodes.`);

    // 2. Load Traces
    if (!fs.existsSync(options.traces)) {
        console.error(`Error: Trace file not found at ${options.traces}`);
        process.exit(1);
    }

    const traceContent = fs.readFileSync(options.traces, 'utf-8');
    let spans: TraceSpan[] = [];

    // Quick Parser Logic (Same as before)
    try {
        const raw = JSON.parse(traceContent);
        if (raw.resourceSpans) {
            raw.resourceSpans.forEach((rs: any) => {
                rs.scopeSpans.forEach((ss: any) => {
                    ss.spans.forEach((s: any) => spans.push(s));
                });
            });
        } else if (Array.isArray(raw)) {
            spans = raw;
        }
    } catch (e) {
        const lines = traceContent.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const obj = JSON.parse(line);
                    if (obj.resourceSpans) {
                        obj.resourceSpans.forEach((rs: any) => {
                            rs.scopeSpans.forEach((ss: any) => {
                                ss.spans.forEach((s: any) => spans.push(s));
                            });
                        });
                    }
                } catch (err) { }
            }
        });
    }
    console.log(`[Traces] Loaded ${spans.length} spans.`);

    // 3. Reconcile
    const reconciler = new AdvancedFlowReconciler();
    const result = reconciler.reconcile(staticGraph, spans);

    // 4. Generate HTML
    // Default to 'report.html' if output is LIVING_DOC.md aimed at markdown
    let outPath = options.output;
    if (outPath.endsWith('.md')) outPath = 'report.html';

    const html = generateHtml(result);
    fs.writeFileSync(outPath, html);

    console.log(`[Success] Dashboard generated at: ${outPath}`);
    console.log(`Open it directly in your browser: start ${outPath}`);
}
