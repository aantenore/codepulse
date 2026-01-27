# Context Checkpoint

## Status
Stable - Noise Suppressed

## Changelog
- **Fixed HTML rendering**: Injected Mermaid.js CDN and initialization code into `html-template.ts`.
- **Improved Demo Reliability**: Increased `run_demo.ps1` wait time (60s+), implemented a multi-request traffic burst, and explicitly disabled OTLP Logs/Metrics export in `docker-compose.yml` to resolve 404 errors.
- **Generic Purging**: Removed all hardcoded demo service names from the core and CLI packages.

## Next Steps
- Run `run_demo.ps1` to verify clean logs and capture fresh traces.
- Final report generation and Mermaid rendering verification.
