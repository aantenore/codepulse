# Contributing to CodePulse

We're excited that you're interested in contributing to CodePulse! This project aims to bridge the gap between static code and runtime dynamics.

## 🏗 Project Structure

CodePulse is a TypeScript monorepo managed with **pnpm** and **Turborepo**.

- `packages/core`: Core domain models, interfaces, and the reconciliation engine.
- `packages/cli`: The command-line interface for generating reports.
- `packages/plugin-java`: Language plugin for parsing Java source code using Tree-Sitter.
- `packages/adapter-*`: AI provider implementations (Google Gemini, OpenAI).
- `playground`: A multi-service Spring Boot environment for local testing.

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

4. **Run Tests**:
   ```bash
   pnpm run test
   ```

## 🛠 Adding a New AI Provider

1. Create a new package `packages/adapter-yourprovider`.
2. Implement the `IAiProvider` interface from `@codepulse/core`.
3. Register the provider in `packages/cli/src/providers/ProviderManager.ts`.

## 🔍 Adding a New Language Plugin

1. Create a new package `packages/plugin-yourlanguage`.
2. Implement the `ICodeParser` interface from `@codepulse/core`.
3. Use Tree-Sitter or a custom parser to extract methods and dependencies.
4. Register the plugin in the `ProjectParser` initialization (usually in `generate.ts`).

## 📜 Development Guidelines

- **TypeScript**: All new code must be in TypeScript.
- **Interfaces**: Depend on interfaces in `core` rather than concrete implementations for extensibility.
- **Testing**: Add unit tests for new logic in the `__tests__` or `src/tests` directory of your package.
- **Documentation**: Update the README if you add new features or commands.

## 🐞 Reporting Issues

Please use GitHub Issues to report bugs or suggest features. Provide as much context as possible, including OTel trace formats and language versions.

---

MIT © [CodePulse Team]
