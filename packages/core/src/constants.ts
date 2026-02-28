/** Directory names skipped when walking the filesystem (parsing or instrumentation). */
export const DEFAULT_SKIP_DIRS = [
    'node_modules',
    '.git',
    'dist',
    'target',
    'build',
] as const;
