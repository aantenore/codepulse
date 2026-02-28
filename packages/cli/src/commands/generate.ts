import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AdvancedFlowReconciler, TraceSpan, AiAnalysisResult, ProjectParser, MockAiProvider } from '@codepulse/core';
import { JavaParser } from '@codepulse/plugin-java';
import { generateHtml } from '../html-template';
import { TechDocGenerator } from '../generators/markdown-flow';
import { ProviderManager } from '../providers/ProviderManager';
import { loadConfig } from '../config';

/** Ensure nano time fields are strings (OTLP JSON may provide numbers). */
export function normalizeSpanTimes(span: Record<string, unknown>): void {
    if (typeof span.startTimeUnixNano !== 'string') span.startTimeUnixNano = String(span.startTimeUnixNano ?? '0');
    if (typeof span.endTimeUnixNano !== 'string') span.endTimeUnixNano = String(span.endTimeUnixNano ?? '0');
}

/** Normalize OTLP or raw span JSON into a flat list of span-like objects for the reconciler. */
export function parseTraceFile(content: string): TraceSpan[] {
    const spans: TraceSpan[] = [];
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
        let raw: unknown;
        try {
            raw = JSON.parse(line);
        } catch {
            continue;
        }
        const obj = raw as Record<string, unknown>;
        if (obj.resourceSpans && Array.isArray(obj.resourceSpans)) {
            for (const rs of obj.resourceSpans as Array<{ resource?: { attributes?: unknown[] }; scopeSpans?: Array<{ spans?: unknown[] }> }>) {
                const resourceAttr = rs.resource?.attributes ?? [];
                for (const ss of rs.scopeSpans ?? []) {
                    for (const s of ss.spans ?? []) {
                        const span = s as Record<string, unknown>;
                        span.attributes = [...((span.attributes as unknown[]) ?? []), ...resourceAttr];
                        normalizeSpanTimes(span);
                        spans.push(span as TraceSpan);
                    }
                }
            }
        } else if (Array.isArray(raw)) {
            for (const item of raw as Record<string, unknown>[]) {
                normalizeSpanTimes(item);
                spans.push(item as TraceSpan);
            }
        } else {
            normalizeSpanTimes(obj);
            spans.push(obj as TraceSpan);
        }
    }
    return spans;
}

export interface GenerateOptions {
    source: string;
    traces: string;
    output: string;
    ai?: string;
}

export function validateGenerateOptions(options: GenerateOptions): { source: string; traces: string; output: string } {
    const source = path.resolve(options.source);
    const traces = path.resolve(options.traces);
    if (!fs.existsSync(source)) {
        throw new Error(`Source path does not exist: ${source}`);
    }
    const sourceStat = fs.statSync(source);
    if (!sourceStat.isDirectory()) {
        throw new Error(`Source path must be a directory: ${source}`);
    }
    if (!fs.existsSync(traces)) {
        throw new Error(`Trace file does not exist: ${traces}`);
    }
    const outPath = path.resolve(options.output);
    return { source, traces, output: outPath };
}

export async function generate(options: GenerateOptions): Promise<void> {
    dotenv.config();

    const { source, traces, output } = validateGenerateOptions(options);

    console.log(`[CodePulse] Generating Dashboard...`);

    const config = loadConfig();
    const projectParser = new ProjectParser();
    if (config?.skipDirs?.length) projectParser.setSkipDirs(config.skipDirs);
    projectParser.registerParser('.java', new JavaParser());

    console.log(`[CodePulse] Parsing Source Code at: ${source}`);
    const staticGraph = await projectParser.parse(source);
    console.log(`[CodePulse] Static Graph: ${staticGraph.nodes.length} nodes found.`);

    const traceContent = fs.readFileSync(traces, 'utf-8');
    const spans = parseTraceFile(traceContent);
    console.log(`[CodePulse] Loaded ${spans.length} trace spans.`);

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
    const outPathFinal = output.endsWith('.md') ? output.replace(/\.md$/, '.html') : output;

    const html = generateHtml(result, aiResult);
    fs.writeFileSync(outPathFinal, html);

    const mdContent = await TechDocGenerator.generate(result, provider);
    const mdPath = path.join(path.dirname(outPathFinal), 'FLOW_ARCHITECTURE.md');
    fs.writeFileSync(mdPath, mdContent);

    console.log(`[Success] Dashboard generated at: ${outPathFinal}`);
    console.log(`[Success] Tech Docs generated at: ${mdPath}`);
    console.log(`Open it directly in your browser.`);
}
