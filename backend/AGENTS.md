# AGENTS.md

## Scope
This file applies to everything under `/backend`.

Use this backend as the operating system for RichLand's export workflow, not as a generic SaaS admin.

The backend's job is to support:
- inquiry intake
- quotation and PI preparation
- customer PO intake and review
- internal workflow handoff
- payment, approval, production, shipping, and BL-release control
- customer-visible milestone tracking

## Architecture priorities
- Keep the marketing website lightweight and separate from backend operations logic.
- Treat `WorkflowCase` as the main business spine for one inquiry-to-settlement path.
- Treat `AgentTask` and `ApprovalTask` as workflow control objects, not decorative metadata.
- Keep customer-facing milestones simpler than internal workflow stages.
- Prefer explicit state transitions and audit records over hidden side effects.

## Efficiency rules
- Minimize broad edits across unrelated backend modules.
- Prefer adding or updating small helpers instead of duplicating route logic.
- Reuse existing workflow helpers before introducing new abstractions.
- Keep route handlers readable; do not bury core business gates behind clever generic layers.
- When adding a new workflow gate, define:
  - who owns it
  - what blocks it
  - what evidence closes it
  - what customer-facing status changes, if any

## Data and storage rules
- The runtime store is Prisma-backed through the bridge script. Do not reintroduce direct JSON-file runtime logic.
- Avoid adding unstable implicit schema assumptions inside route handlers.
- When creating new business records, prefer linking them back to `workflowCaseId` and `orderId` where relevant.
- Every critical step should leave at least one of:
  - workflow stage record
  - agent task update
  - approval task update
  - payment record
  - document version
  - notification job
  - audit event

## Workflow integrity rules
- `PO approved` does not mean `production released`.
- `deposit confirmed` does not mean `execution opened`.
- `shipping completed` does not mean `BL can be released`.
- `balance confirmed` must be a hard gate before BL release.
- Prefer blocking a case clearly over silently skipping a required gate.

## What not to do
- Do not turn this into a chatbot-first system.
- Do not expose internal approval detail to customers.
- Do not auto-generate unrealistic trade documents or compliance claims.
- Do not collapse all roles into a single admin-like path for convenience.
