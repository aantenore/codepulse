# CodePulse Context Checkpoint

## Session Summary
**Date:** 2026-01-25
**Goal:** Scaffolding the CodePulse MVP (Monorepo Node.js Host, Java Target).

## Architecture State
We have established a Turborepo Monorepo with the following structure:
*   **`packages/core`**: Contains the kernel interfaces (`ICodeParser`, `IInstrumenter`) and Zod schemas (`CodeGraph`).
*   **`packages/plugin-java`**: Contains the logic for parsing and instrumenting Java files.
    *   **Logic**: Uses `tree-sitter-java` (Node bindings).
    *   **Strategy**: "Surgical String Replacement" (Calculates byte offsets to inject code without pretty-printing).
*   **`packages/cli`**: The entry point (`codepulse inject <file>`) utilizing `commander`.

## Current Logic (JavaInstrumenter)
The `JavaInstrumenter.ts` file implements a robust injection strategy:
1.  **Auto-Import**: Scans AST for existing imports; injects `io.opentelemetry...` if missing.
2.  **Field Injection**: Scans Class bodies; injects `@Autowired private Tracer tracer;`.
3.  **Method Tracing**: Scans Method bodies; wraps content in `spanBuilder(...).startSpan()` and `try/finally`.
4.  **Internal Tracing**:
    *   **DB Calls**: Detects `.save`, `.findById` (AST/Regex) -> Injects `span.addEvent("db_call")`.
    *   **External API**: Detects `.postForObject`, `.send` -> Injects `span.addEvent("external_api_call")`.

## Playground Status
Directory: `./playground`
*   **`repo-order-service`**: Contains `OrderController.java` (Complex flow: HTTP -> External -> DB).
*   **`repo-inventory-service`**: Contains `InventoryController.java` (Simple flow).

**How to Run**:
```bash
node packages/cli/dist/index.js inject ./playground/repo-order-service/src/main/java/com/prada/order/OrderController.java
```

## Next Up
*   **Dockerization**: Implement the OpenTelemetry Collector container to actually look at the traces.
*   **Pipeline**: Connect the "Run" command to a real build pipeline.
