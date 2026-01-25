#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { generate } from './commands/generate';
import { run } from './commands/run'; // Restore if needed, or inline

const program = new Command();

program
    .name('codepulse')
    .description('Live Documentation Engine')
    .version('0.0.1');

program
    .command('inject')
    .argument('<file>', 'File path to instrument')
    .description('Inject OpenTelemetry tracing into a Java file')
    .action(async (file: string) => {
        try {
            const absolutePath = path.resolve(process.cwd(), file);
            if (!fs.existsSync(absolutePath)) {
                console.error(`Error: File not found at ${absolutePath}`);
                process.exit(1);
            }

            const content = fs.readFileSync(absolutePath, 'utf-8');
            const instrumenter = new JavaInstrumenter();

            console.error(`[CodePulse] Instrumenting: ${file}...`);
            const modified = await instrumenter.inject(content, absolutePath);

            console.log(modified);

        } catch (error) {
            console.error('[CodePulse] CLI Error:', error);
            process.exit(1);
        }
    });

program
    .command('generate')
    .description('Generate Living Documentation from Code and Traces')
    .requiredOption('--source <path>', 'Path to source code')
    .requiredOption('--traces <path>', 'Path to trace-dump.json')
    .option('--output <path>', 'Output markdown file', 'LIVING_DOC.md')
    .action((options) => {
        generate(options);
    });

program.parse();
