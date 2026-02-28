#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { generate } from './commands/generate';
import { run } from './commands/run';

const program = new Command();

program
    .name('codepulse')
    .description('Live Documentation Engine — static/dynamic reconciliation and living docs')
    .version('0.0.1');

program
    .command('run')
    .description('Instrument all Java files in a directory (in-place)')
    .requiredOption('--target <path>', 'Directory containing .java files to instrument')
    .action(async (options: { target: string }) => {
        try {
            await run(options.target);
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program
    .command('inject')
    .argument('<file>', 'File path to instrument')
    .action(async (file: string) => {
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
            const content = fs.readFileSync(fullPath, 'utf-8');
            const modified = await instrumenter.inject(content, fullPath);
            fs.writeFileSync(fullPath, modified);
            console.log(`[Success] Instrumented ${path.basename(fullPath)}`);
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program
    .command('generate')
    .description('Generate Living Dashboard')
    .requiredOption('--source <path>', 'Path to source code')
    .requiredOption('--traces <path>', 'Path to trace-dump.json')
    .option('--output <path>', 'Output file', 'report.html')
    .option('--ai <provider>', 'AI provider: mock | openai | google', 'mock')
    .action(async (options) => {
        try {
            await generate(options);
        } catch (err) {
            console.error('[CodePulse]', err);
            process.exit(1);
        }
    });

program.parse();
