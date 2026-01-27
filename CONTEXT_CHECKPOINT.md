# Context Checkpoint

## Status
Fixed Generator - Ports Standardized

## Changelog
- **Fixed HTML rendering**: Injected Mermaid.js CDN and initialization code into `html-template.ts`.
- **Improved Demo Reliability**: Increased `run_demo.ps1` wait time to 90s and refined health checks.
- **OTel Silence**: Disabled OTLP Logs/Metrics export to fix 404 errors.
- **Infrastructure Cleanup**: Removed `setup_microcommerce.ps1`; playground is now managed statically in the repo with port 8080 standardized for all services.

## Next Steps
- Verify stable inter-service communication and final trace capture.
