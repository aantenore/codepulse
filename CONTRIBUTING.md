# Contributing to CodePulse

We're excited that you're interested in contributing to CodePulse! This project aims to bridge the gap between static code and runtime dynamics.

## 🏗 Project Structure

CodePulse is a TypeScript monorepo managed with **pnpm** and **Turborepo**.

- `packages/core`: Core domain models, interfaces, and the reconciliation engine.
- `packages/cli`: The command-line interface for generating reports.
- `packages/plugin-java`: Language plugin for parsing Java source code using Tree-Sitter.
- `packages/adapter-*`: AI provider implementations (Google Gemini, OpenAI).
- `playground`: A multi-service Spring Boot environment for local testing.
- `docs/ARCHITECTURE.md`: High-level data flow and extension points.
- `docs/ROADMAP.md`: Planned work and technical debt (good source for first issues).

## 🚀 Getting Started

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-org/codepulse.git
   cd codepulse
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Build All Packages**:
   ```bash
   pnpm run build
   ```

4. **Run tests** (placeholder per-package until unit tests are added):
   ```bash
   pnpm run test
   ```
   See [docs/ROADMAP.md](docs/ROADMAP.md) for planned testing work.

## 🛠 Adding a New AI Provider

1. Create a new package `packages/adapter-yourprovider`.
2. Implement the `IAiProvider` interface from `@codepulse/core`.
3. Register the provider in `packages/cli/src/providers/ProviderManager.ts`.

## 🔍 Adding a New Language Plugin

We use a **Plugin Architecture** based on **Tree-sitter**. This allows us to support any language with speed and precision.

### Step 1: Create the Plugin Package
Duplicate `packages/plugin-java` to `packages/plugin-[lang]`.
```bash
cp -r packages/plugin-java packages/plugin-python
```

### Step 2: Define Tree-sitter Queries
Create a `.scm` file in `packages/plugin-[lang]/queries/`. We use S-Expressions to identify code structures.
*Example (python.scm):*
```scheme
(function_definition
  name: (identifier) @method.name
  body: (block) @method.body)
```

### Step 3: Implement the Parser Interface
Implement `ICodeParser` in your `src/[Lang]Parser.ts`. The interface takes **file content and path** (not a list of files); the CLI walks the tree and calls `parse` per file.
```typescript
import { ICodeParser, CodeGraph } from '@codepulse/core';

export class PythonParser implements ICodeParser {
    async parse(fileContent: string, filePath: string): Promise<CodeGraph> {
        // Use tree-sitter-python to parse fileContent
        // Return { nodes, edges } for this file
    }
}
```

### Step 4: Register in CLI
Add your new parser to `packages/cli/src/commands/generate.ts`:
```typescript
projectParser.registerParser('.py', new PythonParser());
```

## 📜 Development Guidelines

- **TypeScript**: All new code must be in TypeScript.
- **Interfaces**: Depend on interfaces in `core` rather than concrete implementations for extensibility.
- **Validation**: Validate inputs at boundaries (CLI or public API); throw clear errors or exit with code 1. See [docs/PATTERNS_AND_PRACTICES.md](docs/PATTERNS_AND_PRACTICES.md).
- **Security**: Escape any user or AI-generated content when embedding in HTML (e.g. dashboard) to prevent XSS.
- **Paths**: Use `path.resolve()` for paths passed to core; use `DEFAULT_SKIP_DIRS` from core when walking directories so behavior matches the rest of the repo.
- **Testing**: Add unit tests for new logic in the `__tests__` or `src/tests` directory of your package.
- **Documentation**: Update the README and, if relevant, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) or [docs/PATTERNS_AND_PRACTICES.md](docs/PATTERNS_AND_PRACTICES.md) when you add features or change behavior.

## 🐞 Reporting Issues

Please use GitHub Issues to report bugs or suggest features. Provide as much context as possible, including OTel trace formats and language versions.

---

MIT © [CodePulse Team]
