import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { DEFAULT_SKIP_DIRS } from '@codepulse/core';
import { loadConfig } from '../config';

export interface RunOptions {
    sidecar?: boolean;
}

export async function run(targetPath: string, options: RunOptions = {}): Promise<void> {
    console.log(`[CodePulse] Targeting: ${targetPath}`);

    if (!targetPath) {
        console.error("Error: --target is required");
        process.exit(1);
    }

    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) {
        console.error(`Error: Path ${resolved} does not exist`);
        process.exit(1);
    }
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
        console.error("Error: --target must be a directory. Use 'codepulse inject <file>' for a single file.");
        process.exit(1);
    }

    const config = loadConfig();
    const skipDirs = new Set(config?.skipDirs ?? DEFAULT_SKIP_DIRS);
    const instrumenter = new JavaInstrumenter();
    const sidecar = options.sidecar ?? false;

    const walk = async (dir: string): Promise<void> => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const fileStat = fs.statSync(fullPath);
            if (fileStat.isDirectory()) {
                if (!skipDirs.has(file)) {
                    await walk(fullPath);
                }
            } else if (file.endsWith('.java')) {
                console.log(`Processing: ${file}`);
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const injectOptions = sidecar
                        ? { mode: 'sidecar' as const, sidecarOutputPath: fullPath.replace(/\.java$/, '.instrumented.java') }
                        : undefined;
                    const modified = await instrumenter.inject(content, fullPath, injectOptions);
                    const outPath = injectOptions?.sidecarOutputPath ?? fullPath;
                    fs.writeFileSync(outPath, modified);
                    console.log(`[Success] Instrumented ${file}${sidecar ? ` → ${path.basename(outPath)}` : ''}`);
                } catch (err) {
                    console.error(`[Error] Failed to instrument ${file}:`, err);
                }
            }
        }
    };

    await walk(resolved);
}
