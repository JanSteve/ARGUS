# ARGUS — Project Status

## Current Phase

**Phase 0: Architecture & Planning**

The project is in the planning stage. No application code has been written yet.

## Completed Work

- [x] Project vision and scope defined
- [x] Requirements documented
- [x] Architecture evaluated and documented
- [x] Technology stack evaluated
- [x] Development workflow defined
- [x] Roadmap created
- [x] Git repository initialized

## Current Work

- [ ] Finalize technology stack decision
- [ ] Review planning documents for contradictions
- [ ] Create Phase 1 implementation plan
- [ ] Get stakeholder approval on architecture

## Upcoming Work

- Phase 1: Foundation (project scaffolding, CI, basic desktop shell)
- Phase 2: AI Core (first provider integration, streaming chat)
- Phase 3: Local AI (Ollama integration)

## Known Risks

| Risk | Severity | Mitigation |
|:---|:---|:---|
| Tauri v2 ecosystem maturity | Medium | Evaluate Electron as fallback; prototype early |
| Vitest worker timeout in constrained environments | Low | Use happy-dom; document CI requirements |
| Cross-platform Ollama integration differences | Medium | Test on all three platforms early |
| Credential storage varies by OS | Medium | Abstract behind a storage interface; start with file-based fallback |

## Open Questions

1. **Tauri vs. Electron?** Tauri is lighter and more secure but less mature. Electron is battle-tested but heavier. Decision documented in DECISIONS.md as OPEN.
2. **Credential storage mechanism?** OS keychain vs. encrypted file vs. environment variables.
3. **Conversation persistence?** SQLite vs. flat files for storing chat history.
4. **Packaging strategy?** How will we distribute the desktop app to end users?
