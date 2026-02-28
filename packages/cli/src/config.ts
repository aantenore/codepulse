import * as fs from 'fs';
import * as path from 'path';

export interface CodePulseConfig {
    /** Directories to skip when walking source (default: node_modules, .git, dist, target, build). */
    skipDirs?: string[];
    /** Default source path for generate (optional). */
    defaultSource?: string;
    /** Default traces path for generate (optional). */
    defaultTraces?: string;
    /** Default output path for generate (optional). */
    defaultOutput?: string;
}

const CONFIG_FILENAME = 'codepulse.config.json';

/**
 * Load codepulse.config.json from cwd or a given dir. Returns undefined if not found or invalid.
 */
export function loadConfig(fromDir?: string): CodePulseConfig | undefined {
    const dir = fromDir ?? process.cwd();
    const configPath = path.join(dir, CONFIG_FILENAME);
    if (!fs.existsSync(configPath)) return undefined;
    try {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
            skipDirs: Array.isArray(raw.skipDirs) ? raw.skipDirs : undefined,
            defaultSource: typeof raw.defaultSource === 'string' ? raw.defaultSource : undefined,
            defaultTraces: typeof raw.defaultTraces === 'string' ? raw.defaultTraces : undefined,
            defaultOutput: typeof raw.defaultOutput === 'string' ? raw.defaultOutput : undefined,
        };
    } catch {
        return undefined;
    }
}
