import inquirer from 'inquirer';
import { loadConfig } from '../config';
import { generate } from './generate';

export async function generateInteractive(): Promise<void> {
    const config = loadConfig();
    const answers = await inquirer.prompt([
        { type: 'input', name: 'source', message: 'Source code path:', default: config?.defaultSource ?? './playground' },
        { type: 'input', name: 'traces', message: 'Trace file path:', default: config?.defaultTraces ?? 'temp/traces/trace-dump.json' },
        { type: 'input', name: 'output', message: 'Output file:', default: config?.defaultOutput ?? 'report.html' },
        { type: 'list', name: 'ai', message: 'AI provider:', choices: ['mock', 'openai', 'google'], default: 0 },
    ]);
    await generate({
        source: answers.source,
        traces: answers.traces,
        output: answers.output,
        ai: answers.ai,
    });
}
