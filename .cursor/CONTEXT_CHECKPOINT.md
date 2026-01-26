# 📍 CodePulse Context Checkpoint

## 📅 Last Update
2026-01-26

## 🚀 Status: v1.0.0 RELEASE CANDIDATE (Configurable Models)
**Current State:** Maintenance Mode
The user has successfully implemented the MVP, added Google Gemini support, and made AI models configurable.

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
