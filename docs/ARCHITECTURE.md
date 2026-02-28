# CodePulse — Architecture Overview

## Purpose

CodePulse is a **Living Documentation Engine** that reconciles **static code structure** (from your AST) with **runtime traces** (OpenTelemetry) to:

- Detect **zombie code** (methods that never appear in traces)
- Discover **hidden dependencies** (DB/API calls seen only at runtime)
- Produce **always up-to-date** architecture docs and an interactive dashboard

## High-Level Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Source (e.g.   │     │  Trace dump     │     │  Flow Reconciler   │
│  Java + AST)    │────▶│  (OTLP JSON)    │────▶│  (Advanced)         │
└─────────────────┘     └──────────────────┘     └─────────┬─────────┘
         │                            │                     │
         │  ProjectParser             │  parseTraceFile     │
         │  + JavaParser              │                     ▼
         ▼                            │            ┌─────────────────────┐
┌─────────────────┐                   │            │  ReconciledGraph    │
│  CodeGraph      │───────────────────┘            │  (nodes + summary)  │
│  (nodes/edges)  │                                └─────────┬───────────┘
└─────────────────┘                                          │
                                                              ├──▶ AI Provider (analyze) ──▶ HTML + Markdown
                                                              └──▶ generateHtml / TechDocGenerator
```

## Packages

| Package | Role |
|--------|------|
| **core** | `CodeGraph`, `ReconciledGraph`, `FlowReconciler`, `AdvancedFlowReconciler`, `IAiProvider`, `ICodeParser`, `IInstrumenter`, `ProjectParser`. No I/O; pure domain + reconciliation. |
| **plugin-java** | `JavaParser` (Tree-Sitter → `CodeGraph`), `JavaInstrumenter` (injects OpenTelemetry spans into Java source). |
| **adapter-openai** / **adapter-google** | Implement `IAiProvider` (analyze + chat) using Vercel AI SDK. |
| **cli** | Commands: `run` (instrument dir), `inject` (instrument file), `generate` (parse + reconcile + AI → dashboard). |

## Data Shapes

- **CodeGraph**: `{ nodes: CodeNode[], edges: CodeEdge[] }`. Nodes have `id`, `name`, `type`, `startLine`, `endLine`, `metadata` (e.g. `route`, `httpMethod`).
- **TraceSpan**: OTLP-like span (name, start/end time nano, attributes, events). Defined in `core/src/trace.ts` and exported from core.
- **ReconciledGraph**: `CodeGraph`-like with nodes extended by `status` (`verified` | `potentially_dead` | `discovered` | `error`) and `telemetry` (executionCount, avgDurationMs, discoveredDependencies, etc.), plus a `summary` object.
- **DEFAULT_SKIP_DIRS** (from `core/constants`): Directories skipped when walking the filesystem (`node_modules`, `.git`, `dist`, `target`, `build`). Used by ProjectParser and the CLI `run` command.

## Orchestrator

The **orchestrator** (who builds `CodeGraph` from multiple parsers and runs reconciliation) is the **CLI `generate` command**: it constructs a `ProjectParser`, registers parsers per extension, calls `parse(rootPath)`, then runs `AdvancedFlowReconciler` and AI. Core does not define a separate orchestrator type; the pipeline is explicit in `packages/cli/src/commands/generate.ts`. To reuse it programmatically, call `generate(options)` from the CLI module or duplicate the flow in your script.

## Extension Points

- **New language**: Implement `ICodeParser` + optional `IInstrumenter`, add a `plugin-*` package, register parser in CLI `generate`.
- **New AI provider**: Implement `IAiProvider`, register in `ProviderManager`.

## Patterns and conventions

- **Validation**: Inputs are validated at CLI boundaries (paths exist, types correct); invalid input throws or exits with code 1. See [PATTERNS_AND_PRACTICES.md](PATTERNS_AND_PRACTICES.md).
- **Paths**: Resolved with `path.resolve()`; filesystem walks skip a shared list of dirs (`DEFAULT_SKIP_DIRS` from core).
- **Types**: `TraceSpan` and domain types live in core; single source of truth, re-exported from the package index.
- **Security**: HTML output escapes AI/user content to prevent XSS; JSON in script tags is sanitized.

## Notes

- There are two reconcilers: `FlowReconciler` (simpler, legacy) and `AdvancedFlowReconciler` (route-aware, status, discovered nodes). The CLI uses `AdvancedFlowReconciler`.
- `MarkdownDocGenerator` (core) uses the legacy `ReconciledNode` from `FlowReconciler`; the CLI uses `TechDocGenerator` with `ReconciledGraph` from `AdvancedFlowReconciler`.

For planned work and technical debt, see [ROADMAP.md](ROADMAP.md).
