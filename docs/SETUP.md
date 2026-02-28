# CodePulse — Setup & dependencies

## Workspace linking

From the repo root:

```bash
pnpm install
pnpm run build
```

This installs dependencies and links workspace packages (`@codepulse/core`, `@codepulse/plugin-java`, etc.). If a package fails to build, ensure Node.js 18+ and that all `package.json` scripts (e.g. `tsc`) succeed in that package.

## Tree-sitter native bindings

The **plugin-java** package uses `tree-sitter` and `tree-sitter-java`, which rely on native bindings (Node-gyp). On first install or when switching Node versions:

- **Windows**: Ensure [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (or equivalent) are installed so `node-gyp` can compile native addons.
- **macOS/Linux**: Usually works out of the box; if not, install `build-essential` (Linux) or Xcode Command Line Tools (macOS).

If `tree-sitter-java` fails to build, you can:

1. Use a Node version with prebuilt binaries (LTS is recommended).
2. As a future improvement, the project could add a WASM-based or pre-built binary fallback for environments where native compilation is not possible.

Once `pnpm run build` completes in `packages/plugin-java`, the Java parser and instrumenter are ready to use.
