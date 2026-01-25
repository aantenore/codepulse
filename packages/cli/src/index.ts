#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';

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

            // Output to stdout as per instructions
            console.log(modified);

        } catch (error) {
            console.error('[CodePulse] CLI Error:', error);
            process.exit(1);
        }
    });

program.parse();
