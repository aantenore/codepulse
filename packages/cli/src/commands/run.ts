import * as fs from 'fs';
import * as path from 'path';
import { JavaInstrumenter } from '@codepulse/plugin-java';
import { DEFAULT_SKIP_DIRS } from '@codepulse/core';

// Basic verification that we can invoke the core logic
export async function run(targetPath: string) {
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

    const instrumenter = new JavaInstrumenter();

    const walk = async (dir: string): Promise<void> => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!DEFAULT_SKIP_DIRS.includes(file)) {
                    await walk(fullPath);
                }
            } else if (file.endsWith('.java')) {
                console.log(`Processing: ${file}`);
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const modified = await instrumenter.inject(content, fullPath);
                    fs.writeFileSync(fullPath, modified);
                    console.log(`[Success] Instrumented ${file}`);
                } catch (err) {
                    console.error(`[Error] Failed to instrument ${file}:`, err);
                }
            }
        }
    };

    await walk(resolved);
}
