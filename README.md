# VOICE Pulse

VOICE Pulse is an Expo civic education app for Missouri students. The workspace includes the app implementation and the original MVP planning documents.

## Status
- Expo app implementation: `voice-pulse/`
- Product and architecture planning: `docs/` and `project-structure/`
- App validation and runtime checks should be run from `voice-pulse/`

## Product summary
VOICE Pulse is an Android Expo app for Missouri students that moves from a local issue in O’Fallon / St. Charles County to civic understanding, verified officials, and an editable advocacy draft.

## Key points
- Android-first Expo app
- Seeded local issues plus live RSS feed if available
- Civic companion with explicit AI grounding labels
- Verified officials directory with no auto-send
- Editable advocacy draft saved locally
- AI runs only on the server through OpenRouter free Nemotron route
- Demo path is cached to survive provider or quota issues

## Project blueprint
See the detailed plan in [docs/voice-pulse-mvp-plan.md](docs/voice-pulse-mvp-plan.md).

## Proposed module layout
See [project-structure/README.md](project-structure/README.md) for the intended 10-day architecture and module boundaries.

## Important note
Roster files in the workspace root are local working data and are excluded from version control. Keep API credentials in server-side environment variables; do not commit secrets.
