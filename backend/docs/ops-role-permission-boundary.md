# Ops Role Permission Boundary

This document defines the first-pass role boundary for the RichLand internal portal and supporting ops backend.

The goal is practical separation, not enterprise-complex RBAC on day one.

## Roles

### Sales / Foreign Trade
- Owns inquiry triage
- Creates and revises quotations
- Creates PI
- Reviews customer PO against quotation / PI
- Can see commercial pricing, terms, and portal handoff details

### Merchandiser / Order Follow-up
- Follows approved orders after customer confirmation
- Coordinates packaging, scheduling, delivery readiness, and internal follow-up
- Can read inquiry / quotation context, but should not own pricing decisions
- Can update execution progress after order confirmation

### Production
- Sees only execution-ready order content
- Maintains workshop scheduling and production progress
- Should not see quotation pricing or commercial negotiation notes

### Documentation / Shipping
- Sees confirmed order data required for booking and document preparation
- Updates shipment and export document progress
- Should not edit quotation pricing or early commercial decisions

### Admin / Manager
- Cross-functional visibility
- Override authority for approvals and operational supervision
- Can access all internal modules

### Customer
- Only sees own order token-based portal
- Can upload PO, send messages, and download customer-visible files
- Cannot access internal portal

## First screen scope

The first internal screen currently includes:
- Inquiry Inbox
- Quotation Workspace
- PO Review Queue

## Module matrix

### Inquiry Inbox
- Read: Sales, Merchandiser, Admin
- Update / take commercial action: Sales, Admin
- Customer contact details: Sales, Admin

### Quotation Workspace
- Read: Sales, Merchandiser, Admin
- Update quotation / PI readiness: Sales, Admin
- Pricing and trade terms: Sales, Admin
- Portal handoff link: Sales, Admin
- Packaging context only: Sales, Merchandiser, Admin

### PO Review Queue
- Read: Sales, Merchandiser, Admin
- Approve / reject / revise: Sales, Admin
- Packaging confirmation context: Sales, Merchandiser, Admin
- Pricing comparison: Sales, Admin

### Order Execution
- Read: Sales, Merchandiser, Production, Documentation, Admin
- Update production progress: Merchandiser, Production, Admin
- Update shipment / docs progress: Merchandiser, Documentation, Admin
- Customer-visible file release: Sales, Documentation, Admin

## Practical rules

- Production should never receive quotation price visibility by default.
- Documentation should receive only execution-relevant fields needed for booking and export files.
- Merchandiser can work across commercial and execution context, but pricing ownership stays with Sales.
- Customer-facing status should stay at milestone level, not internal subtask level.

## Current code boundary

This first-pass boundary is reflected in:
- `/Users/bosco/codex-projects/web-UI-Richland-v3/backend/src/permissions.js`
- `/Users/bosco/codex-projects/web-UI-Richland-v3/backend/src/server.js`
- `/Users/bosco/codex-projects/web-UI-Richland-v3/internal-portal.html`
- `/Users/bosco/codex-projects/web-UI-Richland-v3/scripts/internal-portal.js`

## Next implementation use

The next screens should use this boundary:
- Inquiry Detail
- Quotation Detail
- PO Review Detail

Those screens should not only hide actions in UI.
They should also be backed by server-side permission checks once auth is added.
