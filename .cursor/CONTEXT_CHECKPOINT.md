# Context Checkpoint
**Version:** 1.4.0
**Status:** Stable Release (UI & Resilience Verified)

## Recent Changes
- **UI Polish:**
    - Sidebar uses `position: fixed` for robust scrolling.
    - Graph auto-centers on load (500ms delay).
    - Report title updated to `v1.4`.
- **Resilience Pattern:**
    - `Legacy -> Shipping` edge visualized via injected "Caller" event.
    - Verified trace recovery via logs (`Restored Connection: true`).
- **Verification:**
    - Full clean run (`run_demo.ps1`) passed.
    - Artifacts committed (`chore: final cleanup`).

## Next Steps
- Project Complete. Ready for handoff.

