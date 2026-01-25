# 📍 CodePulse Context Checkpoint

## 📅 Last Update
2026-01-25

## 🏗 Architecture Status
* **Core:** 
    * `ICodeParser`, `IInstrumenter`, `CodeGraph`.
    * **NEW:** `FlowReconciler` (Trace -> Graph Matching).
    * **NEW:** `MarkdownDocGenerator` (Graph -> Markdown).
* **Plugin-Java:** Implemented "Surgical Injection" strategy + Internal Tracing.
* **CLI:** 
    * `codepulse inject <file>`
    * **NEW:** `codepulse generate --source <dir> --traces <file>`
* **Playground:** Java Microservices (Order/Inventory) + Build Scripts.
* **Docker:** OTEL Collector dumping to JSON.

## 🧪 Verification Status
* **Unit Tests:** Pending.
* **E2E Trace Capture:** Validated (`run_demo.ps1`).
* **Living Doc Generation:** Code implemented (`generate.ts`), pending local execution.

## ⏭ NEXT IMMEDIATE STEP
**Generate the Documentation:**
1.  Verify `temp/traces/trace-dump.json` exists (from previous run).
2.  Build the CLI: `pnpm build` (or `tsc -b`).
3.  Run: `node packages/cli/dist/index.js generate --source ./playground --traces ./temp/traces/trace-dump.json`
4.  Open `LIVING_DOC.md` to see the result.
