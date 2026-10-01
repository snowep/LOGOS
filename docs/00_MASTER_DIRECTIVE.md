# LOGOS — Hermes Agent Master Directive

## Product identity

You are implementing LOGOS, not a generic AI dashboard.

The project originated from the ORION roadmap. The product name is now LOGOS. Remaining ORION runtime naming is migration debt.

LOGOS is a persistent personal assistant that:
- understands the user's world,
- maintains useful continuity,
- manages meaningful Markdown knowledge,
- maintains memory,
- coordinates agents and councils,
- executes authorized work,
- verifies results,
- learns from outcomes.

It is text-first. Voice and vision are not core subsystems.

## Non-negotiable architecture

1. SQLite is the canonical runtime system database.
2. Markdown files are canonical human-readable knowledge documents.
3. Retrieval finds candidates; the Context Engine decides what matters.
4. File events are not automatically memories.
5. Memory promotion must preserve provenance and confidence.
6. LOGOS proposes -> user approves -> LOGOS executes for consequential actions.
7. Agents are delegated workers, not independent authorities.
8. Councils are structured reasoning groups, not automatic decision makers.
9. Technical diagnostics belong under System/Developer, not Home.
10. Never invent telemetry, integrations, agents, projects, or completed work.
11. Never report success without verification.

## Coding rules

- TypeScript/JavaScript only. No Python.
- Use MUI v9 and official `@mui/icons-material`.
- Prefer official MUI components over custom UI primitives.
- Centralize theme tokens.
- No arbitrary page-level hex colors after the theme foundation is implemented.
- No fake production data.
- No hard-coded Windows paths.
- No hard-coded localhost API URLs in browser components.
- No duplicate API servers.
- No duplicate database implementations.

## Required workflow

Before editing:
1. inspect the current implementation,
2. identify what is correct,
3. identify what must be deleted,
4. implement the smallest coherent change,
5. typecheck,
6. lint,
7. build,
8. test,
9. manually verify behavior,
10. update documentation.

A green build does not by itself mean the phase is complete.

## Required reading

Read the files in this pack before implementation:
- `01_ARCHITECTURE_CONSOLIDATION_GATE.md`
- `02_P0.4_VAULT_SYNC_SPEC.md`
- `03_UI_PRODUCT_SPEC.md`
- `04_UI_ACCEPTANCE_CHECKLIST.md`
- `05_BRANCH_AND_STEP_PLAN.md`
- `06_ROADMAP_TO_COMPLETION.md`
- `07_SUBAGENTS.md`
- `08_REPOSITORY_STRUCTURE.md`
- `09_VERIFICATION_AND_RELEASE.md`
- `10_CURRENT_BRANCH_AUDIT.md`
