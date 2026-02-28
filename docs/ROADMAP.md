# CodePulse — Roadmap & technical debt

This document tracks planned improvements and known technical debt. See [ARCHITECTURE.md](ARCHITECTURE.md) and [PATTERNS_AND_PRACTICES.md](PATTERNS_AND_PRACTICES.md) for current design.

---

## Immediate / setup

- [x] **Dependencies**: Run `pnpm install` in root to verify workspace linking.
- [x] **Tree-sitter bindings**: Documented in [SETUP.md](SETUP.md). If `tree-sitter-java` fails, consider WASM fallback or pre-built binaries (future).

---

## Plugin-Java refinements

- [x] **Try/finally robustness**: Whole method body wrapped in try/finally; abstract/empty-body methods skipped.
- [x] **Import conflicts**: When user code declares `Span` or `Tracer`, injected code uses FQN `io.opentelemetry.api.trace.Span` / `Tracer`.
- [x] **Edge cases**: Abstract methods (no body) and empty blocks skipped; interfaces/constructors/static initializers left for future.

---

## Core

- [x] **Orchestrator**: Documented in [ARCHITECTURE.md](ARCHITECTURE.md); pipeline is CLI `generate`.
- [x] **Persistence / sidecar**: `InjectionOptions.mode: 'sidecar'` and `sidecarOutputPath`; CLI `inject --sidecar` and `run --sidecar` write to separate files.

---

## CLI

- [x] **Configuration**: `codepulse.config.json` supported (skipDirs, defaultSource, defaultTraces, defaultOutput). See `codepulse.config.example.json`.
- [x] **Interactive mode**: `codepulse generate --interactive` prompts for source, traces, output, and AI provider (inquirer).

---

## Testing & CI

- [x] **Unit tests**: `parseTraceFile`, `validateGenerateOptions` (CLI); `AdvancedFlowReconciler` (core). Run `pnpm run build && pnpm run test`.
- [x] **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`) runs install, build, lint, test on push/PR.

---

## Future

- **Tree-sitter WASM fallback**: For environments where native bindings do not compile.
- **Constructors / static initializers**: Decide whether to trace; implement if needed.
- **Threshold checks in CI**: Fail or warn when zombie count or risk score exceeds a configured threshold; publish dashboard as artifact.
