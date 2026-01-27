# CodePulse Strategic Roadmap

CodePulse is building the bridge between **Runtime Observability** and **Static Code Analysis**. Our mission is to make distributed systems transparent.

## Phase 1: Polyglot Static Analysis (Current Status: ✅ Stable)
We currently utilize **Tree-sitter** for high-speed, robust parsing of source code without requiring a build environment.
*   **Technology:** Tree-sitter + Custom S-Expression Queries (`.scm`).
*   **Benefit:** Extremely fast, dependency-free, works on broken code.
*   **Limitation:** "Shallow" understanding (regex-like matching of nodes).

## Phase 2: Deep Semantics & LSP (Status: 🚧 Planned)
To understand complex dependency injections (e.g., Spring Beans, Angular Providers), we will integrate the **Language Server Protocol (LSP)**.
*   **Goal:** Resolve types and references that cross files.
*   **Implementation:** Create `packages/adapter-lsp` to communicate with standard language servers (Eclipse JDT.ls, TSServer).

## Phase 3: Hybrid AI Parsing (Status: 🔮 Vision)
Using LLMs to "fill the gaps" where static analysis fails.
*   **Concept:** When the parser encounters an unknown framework pattern (e.g., a custom internal annotation), it asks the AI: *"What does `@MyCustomRoute` imply for traffic flow?"*.
*   **Automated Query Generation:** The AI will write Tree-sitter queries on the fly to support new languages automatically.

## Phase 4: The "Living" Architecture
Real-time bi-directional sync.
*   **Feature:** Editing the Mermaid diagram in the dashboard -> Generates a PR to change the code.
*   **Feature:** Live traffic overlay -> Highlights code in the IDE (VS Code Extension).
