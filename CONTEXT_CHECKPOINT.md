# Context Checkpoint

## Status
Stable - Noise Suppressed

## Changelog
- **Fixed HTML rendering**: Injected Mermaid.js CDN and initialization code into `html-template.ts`.
- **Improved Demo Reliability**: Increased `run_demo.ps1` wait time to 90s and refined health checks to ensure downstream service readiness.
- **OTel Silence**: Disabled OTLP Logs/Metrics export to fix 404 errors across all services.
- **Generic Purging**: Removed all hardcoded demo service names from the core and CLI packages.

## Next Steps
- Verify clean logs and final trace capture.
