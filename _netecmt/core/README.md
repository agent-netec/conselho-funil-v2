# NETECMT Core Module

## Purpose
The `core/` directory contains all the operational logic, agent personas, and workflow definitions that drive the NETECMT environment.

## Key Components
- `agents/`: Agent logic files (`.md`).
- `workflows/`: Procedural definitions for project steps.
- `tasks/`: Core operational XML files.
- `data/`: Supplementary datasets and templates.
- `config.yaml`: Central system configuration.

## Maintenance
When adding new workflows, ensure they reference `{project-root}/{methodology-root}/core/config.yaml` for configuration. Use `workflow.xml` as the execution engine.
