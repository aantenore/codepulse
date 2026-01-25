# 📍 CodePulse Context Checkpoint

## 📅 Last Update
2026-01-26

## 🏗 Architecture Status (Current)
*   **Core (`packages/core`):**
    *   `ICodeParser` / `IInstrumenter`: Kernel interfaces.
    *   **Logic Engine:** `AdvancedFlowReconciler` merging Static AST + Dynamic Traces.
    *   **Capabilities:** Detects **Verified** (Alive), **Zombie** (Dead Code), and **Discovered** (Hidden Logic) nodes.
*   **Plugin-Java (`packages/plugin-java`):**
    *   **Strategy:** "Surgical Injection" (Regex/AST) preserving original formatting.
    *   **Features:** Automagic `try/finally` wrapping and `span.addEvent` for DB/API calls.
*   **CLI (`packages/cli`):**
    *   `codepulse inject`: Instruments code.
    *   `codepulse generate`: **NEW** Produces `report.html` Dashboard with Mermaid.js.
*   **Infrastructure:**
    *   **Docker:** OTEL Collector (`otel/opentelemetry-collector-contrib`) configured to dump JSON.
    *   **Playground:** `OrderService` + `InventoryService` (Spring Boot) validating E2E flow.

## 🌟 "Wow" Features
1.  **Zombie Code Detection:** Identifies methods that exist in Git but never ran in Production.
2.  **Hidden Dependency Discovery:** Finds runtime calls (DB/HTTP) that Static Analysis missed.
3.  **Visual Dashboard:** Replaces text logs with an interactive Mermaid.js Flow Graph.

## 📖 The Playbook (How to Resume)
To pick up exactly where we left off:

1.  **Start Infrastructure:**
    ```bash
    docker-compose up -d
    ```
2.  **Run Playground Traffic:**
    ```powershell
    .\run_demo.ps1
    ```
3.  **Generate Dashboard:**
    ```bash
    # Ensure build is fresh
    npm run build
    
    # Run Generation
    node packages/cli/dist/index.js generate --source ./playground --traces ./temp/traces/trace-dump.json --output report.html
    ```
4.  **View Results:** Open `report.html` in your browser.

## ⏭ NEXT LOGICAL STEP (Roadmap)
**Enhance the "AI Consultant" Executive Summary:**
*   **Current:** Top of `report.html` has basic stats.
*   **Goal:** Implement `IAiProvider` in `packages/core`.
*   **Task:** Connect `ReconciledGraph` JSON to an LLM (e.g., OpenAI API).
*   **Outcome:** The dashboard should display high-level semantic insights like:
    > "Warning: OrderService is tightly coupled to InventoryService (100% dependency rate). 3 Methods appear to be dead code."
