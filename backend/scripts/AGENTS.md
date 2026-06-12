# AGENTS.md

## Scope
This file applies to everything under `/backend/scripts`.

## Script purpose
Scripts in this folder should do one of three things:
- support runtime storage and migrations
- exercise the workflow with repeatable simulations
- export or inspect backend state

## Script rules
- Scripts should be safe to rerun locally.
- Prefer deterministic assertions over loose console logging.
- Simulation scripts should verify business evidence, not only HTTP 200 responses.
- If a script mutates the store, make that explicit near the top of the file.

## Simulation expectations
For end-to-end workflow scripts, verify:
- workflow stage progression
- approval closure
- payment records
- document version records
- notification records
- customer-visible milestone status
