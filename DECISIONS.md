# DECISIONS.md

## 001. Monorepo Structure
**Context:** We need a strictly typed, modular system to handle multiple languages in the future, starting with Java.
**Decision:** Use `Turborepo` with `pnpm` workspaces.
**Reasoning:** Efficient caching, strict dependency management, and industry standard for TS monorepos.

## 002. AST Parsing
**Context:** Need robust parsing for Java that runs in Node.js.
**Decision:** `tree-sitter` + `tree-sitter-java`.
**Reasoning:** Fast, incremental, robust against syntax errors, and language-agnostic API design fits the `ICodeParser` goal.

## 003. Instrumentation Strategy
**Context:** Need to inject OpenTelemetry code into existing Java files without breaking formatting or requiring a full AST-to-Code printer (which is complex and often lossy).
**Strategy:** "Surgical String Replacement".
**Details:**
1. Parse AST to locate method boundaries and injection points.
2. Calculate byte offsets.
3. Treat source as a string buffer and inject code snippets at offsets.
4. Auto-import by checking existing imports in AST and appending if missing.
**Trade-offs:** Risk of syntax errors if offsets are slightly off, but significantly easier than maintaining a pretty-printer for every language.

## 004. Instrumentation Modes
**Context:** User might not want to touch source files directly (Intrusive) or might prefer a separate configuration approach (Sidecar).
**Decision:** The `IInstrumenter` interface will accept options to determine the output target (overwrite vs new file/metadata), but the core logic `inject(file, ast)` will focus on generating the *new content string*. The persistence layer handles *where* that string goes.
