# Context Checkpoint

## Status
Fixing Visualization & Timing

## Changelog
- **Fixed HTML rendering**: Injected Mermaid.js CDN and initialization code into `html-template.ts`.
- **Improved Demo Reliability**: Increased `run_demo.ps1` wait time (60s+) and implemented a multi-request traffic burst.
- **Generic Purging**: Removed all hardcoded demo service names from the core and CLI packages.
