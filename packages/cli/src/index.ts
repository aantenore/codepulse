#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { generate } from './commands/generate';

const program = new Command();

program
    .name('codepulse')
    .description('Live Documentation Engine')
    .version('0.0.1');

program
    .command('inject')
    .argument('<file>', 'File path to instrument')
    .action(async (file: string) => { /* Reuse logic */ });

program
    .command('generate')
    .description('Generate Living Dashboard')
    .requiredOption('--source <path>', 'Path to source code')
    .requiredOption('--traces <path>', 'Path to trace-dump.json')
    .option('--output <path>', 'Output file', 'report.html')
    .option('--ai <provider>', 'AI Provider (mock, openai)', 'mock')
    .action((options) => {
        generate(options);
    });

program.parse();
