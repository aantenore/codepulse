# ⚡ CodePulse

> **The Living Documentation Engine.**  
> Bridge the gap between Static Analysis and Runtime Tracing to eliminate "Zombie Code" and visualize your true architecture.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-v1.1.0-green.svg)

---

## 🛑 The Problem: Documentation Drift

In modern microservices, **Static Analysis** lies (it shows code that might not be used) and **Distributed Tracing** is overwhelming (it shows data but no context).

Developers are left with:
*   🧟 **Zombie Code:** APIs that exist in Git but haven't received traffic in months.
*   👻 **Hidden Dependencies:** Database calls or external requests that aren't documented but appear at runtime.
*   📉 **Coverage Gaps:** No idea if the "Critical Path" is actually being exercised.

## 💡 The CodePulse Solution

CodePulse reconciles your **Source Code (AST)** with your **OpenTelemetry Traces** to generate a "Living Dashboard" that empowers architects and developers.

```mermaid
graph TD
    A[Java Source Code] -->|Tree-Sitter| B(Static Graph);
    C[Runtime Traffic] -->|OpenTelemetry| D(Dynamic Traces);
    B --> E{Flow Reconciler};
    D --> E;
    E -->|merged data| F[Reconciled Graph];
    F -->|Analysis| G[🤖 AI Architect];
    F -->|Visualization| H[HTML Dashboard];
```

## ✨ Key Features

### 🔍 Static-Dynamic Reconciliation
CodePulse uses **Tree-Sitter** to parse your Java classes and matches them against **OpenTelemetry** spans. We support matching via:
*   Exact Class/Method names.
*   Spring Boot HTTP Routes (`@GetMapping`, `@PostMapping`).
*   Service-level flattening for complex OTLP exports.

### 🕵️ Zombie Detection
CodePulse highlights methods that:
*   ✅ **Verified:** Are running in your system right now.
*   🕸️ **Zombie:** Exist in your codebase but have **zero** execution traces.
*   🔴 **Error:** Captured exceptions or failed HTTP status codes.
*   🔵 **Discovered:** Dependencies found at runtime that weren't in your static graph.

### 🧠 AI Architect (Multi-Provider)
Intelligent analysis of your system health:
*   **Google Gemini** (Recommended): Uses Gemini 1.5 Flash for high-speed architectural assessment.
*   **OpenAI**: Support for GPT-4o.
*   **Executive Summary**: Risk scores, tight coupling warnings, and dead code metrics.

---

## 🚀 Quick Start (The Demo)

Experience CodePulse locally in under 5 minutes using our **Micro-Commerce** playground.

### Prerequisites
*   Node.js 18+ & pnpm
*   Docker Desktop
*   Java JDK 21

For dependency and Tree-sitter setup details, see [docs/SETUP.md](docs/SETUP.md).

### 1. Setup & Build
```bash
pnpm install
pnpm run build
```

### 2. Run the Demo
```powershell
./run_demo.ps1
```
If ports 8080–8085 or 9090 are already in use, use alternate ports: `$env:CODEPULSE_ALT_PORTS = "1"; ./run_demo.ps1` (gateway will be on 9080, etc.). See `docker-compose.alt-ports.yml`.

This automated script will:
1. Build 6 microservices (Gateway, Auth, Order, Payment, Shipping, Product).
2. Start the infrastructure via Docker Compose (Collector + Services).
3. Wait for health checks to pass.
4. Simulate 10 batches of realistic traffic.
5. Capture and dump OTel traces to `temp/traces/trace-dump.json`.

### 3. Generate the Dashboard
From the repo root (after `pnpm build`):
```bash
# Using Mock AI (no API key needed)
pnpm run codepulse -- generate --source ./playground --traces temp/traces/trace-dump.json --output report.html --ai mock

# Using Google Gemini (set GOOGLE_API_KEY in .env)
pnpm run codepulse -- generate --source ./playground --traces temp/traces/trace-dump.json --output report.html --ai google
```

### 4. View Results
Open `report.html` in your browser. You'll see an interactive Mermaid graph where you can:
*   Click nodes to see **executions** and **average duration**.
*   See **discovered dependencies** (DB calls, external APIs).
*   Identify the exact point of failure in failing flows.

---

## 📋 CLI Reference

| Command | Description |
|--------|-------------|
| `codepulse run --target <dir>` | Instrument all `.java` files in a directory (in-place). Use `--sidecar` to write to `<file>.instrumented.java`. Respects `codepulse.config.json` skipDirs. |
| `codepulse inject <file>` | Instrument a single `.java` file. Use `--sidecar` or `--sidecar-output <path>` to write to a separate file. |
| `codepulse generate --source <path> --traces <path> [--output report.html] [--ai mock\|openai\|google]` | Parse source, merge with trace file, run AI analysis, and emit HTML dashboard + `FLOW_ARCHITECTURE.md`. Use `--interactive` to be prompted for inputs. |

**Examples (from repo root after `pnpm build`):**
```bash
pnpm run codepulse -- run --target ./src/main/java
pnpm run codepulse -- inject ./src/main/java/app/MyController.java
pnpm run codepulse -- generate --source . --traces traces.json --output report.html --ai google
```

Copy `.env.example` to `.env` and set `GOOGLE_API_KEY` or `OPENAI_API_KEY` when using real AI providers. Optionally add a `codepulse.config.json` in the project root (see `codepulse.config.example.json`) for `skipDirs`, `defaultSource`, `defaultTraces`, and `defaultOutput`.

---

## Why CodePulse?

Traditional docs go stale; traces alone are noisy. CodePulse **fuses** the two: you see which code is actually used, which is dead, and which dependencies only appear at runtime. The result is a single dashboard and markdown that stay aligned with production behavior—useful for refactors, onboarding, and deprecation decisions.

For a deeper technical overview, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For patterns and conventions (validation, security, error handling), see [docs/PATTERNS_AND_PRACTICES.md](docs/PATTERNS_AND_PRACTICES.md).

---

## 🤝 Contributing & Architecture

Check out our [Contributing Guide](CONTRIBUTING.md) to learn how to add language plugins or AI adapters.

*   **Monorepo:** Managed with Turborepo & pnpm.
*   **Core:** Inversion of Control for Parsers and AI Providers.
*   **Plugins:** `plugin-java` for AST analysis.
*   **Adapters:** `adapter-google`, `adapter-openai`.

## 🔮 Possible improvements & roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for technical debt and planned work. Summary:

*   **More languages:** Python, Go, or TypeScript plugins (Tree-Sitter or TS compiler API).
*   **Live trace ingestion:** Connect to an OTLP collector or Jaeger API instead of only reading a trace-dump file.
*   **CI integration:** Fail or warn when zombie count or risk score exceeds a threshold; publish the dashboard as a job artifact. (Basic CI workflow runs build, lint, test.)
*   **Unify reconcilers:** Merge the legacy `FlowReconciler` and `MarkdownDocGenerator` with the advanced pipeline or document as deprecated.
*   **Testing:** Unit tests for trace parsing, option validation, and reconciler summary exist in `packages/cli` and `packages/core`; run `pnpm run build && pnpm run test`.

## 📄 License

MIT © [CodePulse Team]
