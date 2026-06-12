# AGENTS.md

## Scope
This file applies to everything under `/backend/src`.

## Code shape
- Keep business logic straightforward and operationally readable.
- Prefer small workflow helpers over repeating status mutation blocks.
- Keep permission checks close to routes that use them.
- Avoid adding frameworks or large dependency layers.

## Route implementation rules
- Route handlers should validate inputs early and fail clearly.
- If a route changes workflow state, it should also update related records in the same request path when appropriate.
- Do not let one route imply multiple business approvals unless the business rule explicitly says so.

## Performance and maintainability
- Avoid unnecessary full-store scans in new hot paths when a direct lookup is easy.
- Prefer one consistent helper for finding current workflow, pending task, or pending approval.
- Keep internal route responses shaped for portal rendering; avoid sending large unused blobs by default.

## Verification
- After backend edits, run syntax checks on touched JS files.
- When changing workflow logic, validate with the simulation script before claiming success.
