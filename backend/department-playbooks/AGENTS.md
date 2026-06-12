# AGENTS.md

## Scope
This file applies to everything under `/backend/department-playbooks`.

## Purpose
These departmental playbooks split the export workflow by operational ownership so future work can load only the relevant context.

Use this layer for:
- role boundaries
- inputs and outputs by department
- escalation and blocking conditions
- approval expectations

## Shared rules
- Department playbooks should describe real operating behavior, not abstract values.
- Each department should only own the steps it can truly confirm.
- If a handoff depends on another department's evidence, say exactly what evidence is required.
