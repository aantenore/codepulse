# CodePulse — Roadmap & technical debt

This document tracks planned improvements and known technical debt. See [ARCHITECTURE.md](ARCHITECTURE.md) and [PATTERNS_AND_PRACTICES.md](PATTERNS_AND_PRACTICES.md) for current design.

---

## Immediate / setup

- [ ] **Dependencies**: Run `pnpm install` in root to verify workspace linking.
- [ ] **Tree-sitter bindings**: Ensure `tree-sitter` and `tree-sitter-java` native bindings compile on the host. If `tree-sitter-java` fails, consider WASM fallback or pre-built binaries.

---

## Plugin-Java refinements

- [ ] **Try/finally robustness**: Ensure `finally { span.end() }` handles complex control flow (e.g. multiple returns, existing try/catch blocks).
- [ ] **Import conflicts**: Handle cases where `Span` or `Tracer` collide with existing class names (e.g. use fully qualified names when collision is detected).
- [ ] **Edge cases**: Abstract methods (no body), interfaces, constructors (trace or not?), static initializers.

---

## Core

- [ ] **Orchestrator**: The main pipeline is in the CLI; core exposes `ProjectParser`, reconcilers, and providers. Any “orchestrator” that builds `CodeGraph` from multiple parsers is already implied by CLI `generate`; document or extract if needed.
- [ ] **Persistence / sidecar**: Implement “sidecar” mode from `InjectionOptions` (e.g. mapping to separate output files instead of in-place edit).

---

## CLI

- [ ] **Configuration**: Add `codepulse.config.json` (or similar) for excludes, includes, and granular trace settings.
- [ ] **Interactive mode**: Optional interactive CLI (e.g. with `inquirer` or `prompts`) for guided flows.

---

## Testing & CI

- [ ] **Unit tests**: Add tests for reconciliation logic, trace parsing, and option validation. Currently `pnpm run test` runs a placeholder in each package.
- [ ] **CI**: Run build and lint in CI; optionally run tests and publish dashboard as artifact when threshold checks exist.
