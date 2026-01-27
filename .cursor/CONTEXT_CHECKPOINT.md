# 📍 CodePulse Context Checkpoint

## 📅 Last Update
2026-01-27

## Current Status
- **Phase:** Release v1.1.0 (Chaos & Clean)
- **Status:** Stable
- **Note:** Repo is clean of binaries/artifacts.
- **State:**
  - `playground` services containerized via Docker Compose.
  - `run_demo.ps1` automates Build -> Docker -> Traffic.
  - `.gitignore` strictly enforced.

## Next Steps
- [ ] Refine OTel networking for Docker Windows/WSL2 if needed.
- [ ] Implement robust error handling for AI provider limits.

## 🏗 Architecture Status
*   **Core:** `AdvancedFlowReconciler` + `IAiProvider` + `TechDocGenerator`.
*   **Plugin:** Java Surgical Injection.
*   **CLI:** `generate` command with HTML/Mermaid + Markdown Docs output.
*   **AI:**
    *   **OpenAI Adapter:** Configurable via `AI_MODEL_OPENAI` (default: `gpt-4o`).
    *   **Google Adapter:** Configurable via `AI_MODEL_GOOGLE` (default: `gemini-1.5-flash`).
*   **Infra:** Dockerized OTEL Collector + E2E Playground.

## 🌟 Capabilities V1.0
1.  **Hybrid Analysis:** Combines Static (Source) and Dynamic (OTEL) data.
2.  **Zombie Code Detection:** Flags unused methods.
3.  **Semantic AI Reports:** Health Scores & Risk Assessment (Model Agnostic).
4.  **Visual Dashboard:** Interactive Graph UI + `FLOW_ARCHITECTURE.md`.
5.  **Strict Workflow:** Git commits enforced for every task.

## 📖 The Playbook
To resume development or run a demo:

1.  **Check Configuration:** Ensure `.env` is set with your desired models (`AI_MODEL_OPENAI` / `AI_MODEL_GOOGLE`).
2.  **Start Infrastructure:** `docker-compose up -d`
3.  **Run Traffic:** `.\run_demo.ps1`
4.  **Generate Report:**
    ```bash
    node packages/cli/dist/index.js generate \
        --source ./playground \
        --traces ./temp/traces/trace-dump.json \
        --output report.html \
        --ai google # or openai
    ```

## ⏭ NEXT IMMEDIATE STEP
**Explore CI/CD integration (GitHub Actions) to run CodePulse on every PR.**

## ✅ Verification Log
*   **Env Config:** Verified `AI_MODEL_GOOGLE` / `OPENAI` are read correctly.
*   **Build:** Core and Adapters compiled successfully.
*   **E2E:** Manual end-to-end flow verified via script (using Google Gemini Flash).
*   **Roadmap:** Future V2: Implement 'AI Routing' to use different models for different analysis stages.
