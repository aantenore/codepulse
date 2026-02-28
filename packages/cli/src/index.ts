#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { generate } from './commands/generate';
import { generateInteractive } from './commands/generate-interactive';
import { run } from './commands/run';

const program = new Command();

program
    .name('codepulse')
    .description('Live Documentation Engine — static/dynamic reconciliation and living docs')
    .version('0.0.1');

program
    .command('run')
    .description('Instrument all Java files in a directory (in-place or sidecar)')
    .requiredOption('--target <path>', 'Directory containing .java files to instrument')
    .option('--sidecar', 'Write each instrumented file to <name>.instrumented.java instead of overwriting')
    .action(async (options: { target: string; sidecar?: boolean }) => {
        try {
            await run(options.target, { sidecar: options.sidecar });
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program
    .command('inject')
    .argument('<file>', 'File path to instrument')
    .option('--sidecar', 'Write instrumented code to a separate file (default: <file>.instrumented.java)')
    .option('--sidecar-output <path>', 'Path for sidecar output when --sidecar is set')
    .action(async (file: string, opts: { sidecar?: boolean; sidecarOutput?: string }) => {
        try {
            const fullPath = path.resolve(file);
            if (!fs.existsSync(fullPath)) {
                console.error(`Error: File ${fullPath} does not exist`);
                process.exit(1);
            }
            if (!file.endsWith('.java')) {
                console.error('Error: Only .java files are supported for injection.');
                process.exit(1);
            }
            const instrumenter = new JavaInstrumenter();
            const options = opts.sidecar
                ? { mode: 'sidecar' as const, sidecarOutputPath: opts.sidecarOutput ?? fullPath.replace(/\.java$/, '.instrumented.java') }
                : undefined;
            const content = fs.readFileSync(fullPath, 'utf-8');
            const modified = await instrumenter.inject(content, fullPath, options);
            const outPath = options?.sidecarOutputPath ?? fullPath;
            fs.writeFileSync(outPath, modified);
            console.log(`[Success] Instrumented ${path.basename(fullPath)} → ${path.basename(outPath)}`);
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program
    .command('generate')
    .description('Generate Living Dashboard')
    .option('--source <path>', 'Path to source code')
    .option('--traces <path>', 'Path to trace-dump.json')
    .option('--output <path>', 'Output file', 'report.html')
    .option('--ai <provider>', 'AI provider: mock | openai | google', 'mock')
    .option('--interactive', 'Prompt for source, traces, output, and AI provider')
    .action(async (options: { source?: string; traces?: string; output?: string; ai?: string; interactive?: boolean }) => {
        try {
            if (options.interactive) {
                await generateInteractive();
            } else {
                if (!options.source || !options.traces) {
                    console.error('Error: --source and --traces are required unless --interactive is set.');
                    process.exit(1);
                }
                await generate({ source: options.source, traces: options.traces, output: options.output ?? 'report.html', ai: options.ai });
            }
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program.parse();
