# NETECMT v2.0: Unified Methodology Engine

## Overview
NETECMT v2.0 represents a complete refactoring of the preceding BMAD modules into a unified, high-integrity methodology enforcement engine. All core logic, agents, and workflows are now consolidated within the `core/` module.

## Project Tracks
NETECMT adapts its workflow based on the project state:
- **Greenfield (New Projects):** Focuses on Discovery and Planning from scratch.
- **Brownfield (Existing Projects):** Mandatory `document-project` prerequisite (via Wilder/Analyst) to build context before planning additions.

## Project Structure
- `core/`: Central nervous system of the methodology.
  - `agents/`: All 15+ specialized agents (Iuran, Athos, Leticia, Darllyson, etc.).
  - `workflows/`: Standardized procedural guides for all project phases.
  - `tasks/`: Core OS components (`workflow.xml`, `handoff.xml`).
  - `config.yaml`: Global configuration and variables.
- `contracts/`: Interface definitions between agents and modules.
- `epics/`: Story storage for implementation phases.

## Key Features
1. **Frictionless Enforcement (Step 2.5):** Automatic validation of project state and artifacts during agent activation.
2. **Dynamic Handoffs:** Formal context passing between agents via `handoff.xml`.
3. **Unified Config:** Single source of truth for user data and system paths.
4. **Specialized Roles:** Clear distinction between UX (Beto) and UI (Victor) design responsibilities.

## How to Start
Activate any agent (e.g., `iuran`) and follow the menu instructions. The "Gatekeeper" will ensure you have the mandatory artifacts (PRD, Arch, etc.) before proceeding.

---
*Version 2.0.0 | Refactored by Antigravity*
