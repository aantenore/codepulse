# TODO: CodePulse Next Steps

## Immediate Technical Debt
- [ ] **Dependencies**: Run `pnpm install` in root to verify workspace linking.
- [ ] **Tree Sitter Bindings**: Ensure `tree-sitter` and `tree-sitter-java` native bindings compile on the host machine.
    - If `tree-sitter-java` fails, consider WASM fallback or pre-built binaries.

## Plugin-Java Refinement
- [ ] **Try/Finally Robustness**: Ensure `finally { span.end() }` handles complex control flow (multiple returns are fine, but what about existing try/catch blocks?).
- [ ] **Import Conflicts**: Handle cases where `Span` or `Tracer` simple names collide with existing classes (use fully qualified names if collision detected).
- [ ] **Edge Cases**:
    - Abstract methods (no body).
    - Interfaces.
    - Constructors (should we trace them?).
    - Static Initializers.

## Core
- [ ] **Orchestrator**: Implement the `CodeGraph` builder in `ICodeParser`. Currently we only have the `IInstrumenter` implementation.
- [ ] **Persistence**: Implement the "Sidecar" mode logic (mapping `InjectionOptions` to file output).

## CLI
- [ ] **Configuration**: Add `codepulse.config.json` support to specify excludes, includes, and granular trace settings.
- [ ] **Interactive Mode**: Add a generic interactive CLI using `inquirer` or `prompts`.
