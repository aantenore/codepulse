import * as fs from 'fs';
import * as path from 'path';
import { FlowReconciler, MarkdownDocGenerator, TraceSpan, CodeGraph, CodeNode } from '@codepulse/core';

// Mock Parser for MVP (Since our ICodeParser isn't fully wired to tree-sitter yet in the Core)
// In a real implementation, we'd call the JavaParser from plugin-java.
// Here we construct the Static Graph based on what we KNOW exists in the playground.
function mockParse(sourcePath: string): CodeGraph {
    const nodes: CodeNode[] = [
        {
            id: 'OrderController.create',
            name: 'OrderController.create',
            type: 'method',
            startLine: 0,
            endLine: 0,
            metadata: { className: 'OrderController' }
        },
        {
            id: 'InventoryController.check',
            name: 'InventoryController.check',
            type: 'method',
            startLine: 0,
            endLine: 0,
            metadata: { className: 'InventoryController' }
        }
    ];
    return { nodes, edges: [] };
}

export async function generate(options: { source: string; traces: string; output: string }) {
    console.log(`[CodePulse] Generating Documentation...`);
    console.log(`- Source: ${options.source}`);
    console.log(`- Traces: ${options.traces}`);

    // 1. Static Analysis
    // const parser = new JavaParser(); // TODO: Wire up real parser
    const staticGraph = mockParse(options.source);
    console.log(`[Analysis] Found ${staticGraph.nodes.length} static nodes.`);

    // 2. Load Traces
    if (!fs.existsSync(options.traces)) {
        console.error(`Error: Trace file not found at ${options.traces}`);
        process.exit(1);
    }

    // The OTel file exporter output is a list of JSON objects (one per line) or a JSON array depending on config.
    // Our config said "file" exporter. Usually it writes line-delimited JSON or a single JSON blob.
    // Let's assume standard JSON array or try to parse lines.
    const traceContent = fs.readFileSync(options.traces, 'utf-8');
    let spans: TraceSpan[] = [];

    try {
        // Try parsing quite liberally
        const raw = JSON.parse(traceContent);

        // OTel OTLP File Exporter structure usually: { "resourceSpans": [ ... ] }
        if (raw.resourceSpans) {
            raw.resourceSpans.forEach((rs: any) => {
                rs.scopeSpans.forEach((ss: any) => {
                    ss.spans.forEach((s: any) => {
                        spans.push(s);
                    });
                });
            });
        } else if (Array.isArray(raw)) {
            spans = raw;
        }
    } catch (e) {
        // Try line by line
        const lines = traceContent.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const obj = JSON.parse(line);
                    if (obj.resourceSpans) {
                        obj.resourceSpans.forEach((rs: any) => {
                            rs.scopeSpans.forEach((ss: any) => {
                                ss.spans.forEach((s: any) => {
                                    spans.push(s);
                                });
                            });
                        });
                    }
                } catch (err) { }
            }
        });
    }

    console.log(`[Traces] Loaded ${spans.length} spans.`);

    // 3. Reconcile
    const reconciler = new FlowReconciler();
    const reconciledNodes = reconciler.reconcile(staticGraph, spans);

    const executed = reconciledNodes.filter(n => n.telemetry && n.telemetry.executionCount > 0);
    console.log(`[Reconciliation] Matched ${executed.length} active methods.`);

    // 4. Generate Markdown
    const markdown = MarkdownDocGenerator.generate(reconciledNodes);

    fs.writeFileSync(options.output, markdown);
    console.log(`[Success] Written to ${options.output}`);
}
