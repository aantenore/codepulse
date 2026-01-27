# Context Checkpoint

## Status
Fixing Visualization & Timing

## Changelog
- **Fixed HTML rendering**: Injected Mermaid.js CDN and initialization code into `html-template.ts`.
- **Improved Demo Reliability**: Increased `run_demo.ps1` wait time (60s+), implemented a multi-request traffic burst, and fixed OTel log export 404 errors by adding missing pipelines and disabling noisy exporters.
- **Generic Purging**: Removed all hardcoded demo service names from the core and CLI packages.
