# Contributing Extensions to CodePulse

CodePulse is designed to be a modular, plugin-based architecture. This guide explains how to extend its capabilities by adding new **Language Plugins** (for static analysis) and **AI Adapters** (for different LLMs).

## 1. Architecture Overview

CodePulse consists of three main layers:
1.  **Core (`@codepulse/core`)**: Defines the unified data model (`CodeGraph`, `CodeNode`, `TraceSpan`) and interfaces (`IParser`, `IAiProvider`).
2.  **Plugins (Static Analysis)**: Responsible for parsing source code into a `CodeGraph`. Use `tree-sitter` for robust AST parsing.
3.  **Adapters (AI & Export)**: Connect to external services (OpenAI, Gemini) to analyze the reconciled graph.

## 2. Creating a Language Plugin

To support a new language (e.g., Python, Go, Rust), you need to implement the `IParser` and `IInstrumenter` interfaces.

### Step 1: Interface
Implement `IParser`:
```typescript
import { IParser, CodeGraph } from '@codepulse/core';

export class PythonParser implements IParser {
    async parse(content: string, filePath: string): Promise<CodeGraph> {
        // Use tree-sitter-python to parse 'content'
        // Map AST nodes to CodeNodes (classes, methods)
        return { nodes: [], edges: [] };
    }
}
```

### Step 2: Tree-Sitter
We rely on `tree-sitter` for accurate parsing.
1.  Install the grammar: `pnpm add tree-sitter-python`
2.  Create queries to identify:
    *   **Definitions**: Function/Class declarations.
    *   **Calls**: Function invocations (to build edges).

## 3. Creating an AI Provider

To add support for a new LLM (e.g., Anthropic Claude, Local Llama), implement `IAiProvider`.

### Step 1: Interface
```typescript
import { IAiProvider, AiAnalysisResult } from '@codepulse/core';

export class ClaudeAiProvider implements IAiProvider {
    name = "Claude 3 Opus";

    async analyze(graph: any): Promise<AiAnalysisResult> {
        // Construct a prompt with the graph data
        // specific to the provider's API
        return {
            summary: "...",
            risks: [],
            score: 0
        };
    }

    async chat(prompt: string): Promise<string> {
        // Send raw prompt to the LLM
        return "Markdown response...";
    }
}
```

### Step 2: Configuration
Ensure your provider checks for necessary Environment Variables (e.g., `ANTHROPIC_API_KEY`) and fails gracefully if missing.

## 4. Integration
1.  Register your plugin/adapter in the CLI configuration.
2.  Add unit tests in the `tests/` folder of your package.
