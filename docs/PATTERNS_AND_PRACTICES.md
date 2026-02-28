# CodePulse — Patterns and Best Practices

This document describes the patterns and conventions used in the codebase so new code stays consistent and maintainable.

---

## 1. Validation at boundaries

- **CLI commands** validate inputs before calling core logic (e.g. paths exist, source is a directory). Validation throws `Error` with a clear message; the CLI catches and exits with code 1.
- **Generate**: `validateGenerateOptions()` resolves paths and checks that `source` exists and is a directory, and that `traces` exists. Invalid options throw; no silent fallbacks.
- **Run / Inject**: Path and file-extension checks happen in the CLI layer; invalid input leads to `process.exit(1)`.

## 2. Path handling

- Use **resolved paths** for logging and file access: `path.resolve(source)`, `path.resolve(traces)`, etc.
- **ProjectParser** and **run** walk the filesystem using a shared **skip list** (`DEFAULT_SKIP_DIRS` from `@codepulse/core`): `node_modules`, `.git`, `dist`, `target`, `build`. ProjectParser allows overriding via `setSkipDirs()` for tests or custom usage.

## 3. Types and single source of truth

- **TraceSpan** is defined once in `packages/core/src/trace.ts` and re-exported from the core index. Reconcilers and CLI import it from `@codepulse/core` (or from `./trace` inside core).
- **Domain models** (CodeNode, CodeEdge, CodeGraph, ReconciledGraph) live in core; Zod schemas in `types.ts` are used where validation is needed.
- Prefer **export type** for type-only exports to keep runtime barrel exports small.

## 4. Error handling

- **Orchestration (CLI)**: Commands wrap logic in try/catch; on failure they log and call `process.exit(1)` so the process exits with a non-zero code.
- **Core / libraries**: Prefer **throwing** (e.g. validation errors). Callers decide whether to log, exit, or recover.
- **Per-item failures** (e.g. one file fails to parse): Log and continue where it makes sense (e.g. ProjectParser), so a single bad file does not abort the whole run.
- **AI provider failure** in `generate`: Catch, warn, and fall back to MockAiProvider so the report still gets generated.

## 5. Security

- **HTML output**: Any content that can contain user or AI-generated text (e.g. AI summary, risks) is **escaped** before interpolation in the dashboard HTML (`escapeHtml()` in `html-template.ts`) to prevent XSS.
- **JSON in script tags**: Graph JSON is embedded with `</` escaped to avoid breaking out of the script context.

## 6. Fluent / chainable APIs where useful

- **ProjectParser**: `registerParser()` and `setSkipDirs()` return `this` so callers can chain (e.g. `parser.registerParser('.java', p).setSkipDirs([...])`).

## 7. Configuration and environment

- **Environment variables** (API keys, model names) are read via `process.env`; dotenv is loaded at CLI entry (e.g. in `generate`). See `.env.example` for supported variables.
- **ProviderManager** resolves the provider by name and falls back to Mock when the requested provider is missing or misconfigured (e.g. missing API key).

## 8. Logging

- Logging is done with **console** (log, warn, error) with a consistent prefix `[CodePulse]` or `[AI]` for clarity. A dedicated logger abstraction can be introduced later if needed (e.g. for tests or log levels).

## 9. Async and I/O

- **Async functions** are used for all I/O and provider calls; CLI actions are `async` and `await` the main workflow so errors are caught by the same try/catch.
- **File writing**: Sync writes (`fs.writeFileSync`) are used after content is ready; for large outputs an async API could be added later if needed.

---

For architecture and data shapes, see [ARCHITECTURE.md](ARCHITECTURE.md). For contributing and adding plugins, see [CONTRIBUTING.md](../CONTRIBUTING.md).
