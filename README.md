# RichLand Ltd. Website and Ops Prototype

Static B2B product showcase website for RichLand Ltd., focused on electric fans and related home appliances for OEM / ODM export business.

The repo also includes the first prototype of the supporting internal ops backend for inquiry intake, quotation / PI / PO handling, and order execution handoff.

## Featured BA + CRM Case Study

Open [`case-study.html`](case-study.html) for the recruiter-facing project narrative:

> Business problem → data structure → solution → testing method → final outcome

The case study presents this repository as a **Business Analysis + Data Workflow + CRM Automation** project, including:

- Business problem and project role
- Inquiry → Customer → Follow-Up → Quotation → Order → Shipment workflow
- Logical CRM ER model with primary and foreign keys
- Synthetic dashboard for open quotations, follow-ups, order status, monthly value, conversion, and overdue work
- 15 UAT cases with a defect/fix log
- Working-screen evidence and implementation limitations

All public case-study records are anonymous or synthetic. The current backend uses Prisma `StoreCollection` payloads as a prototype storage bridge; the normalized entity model is a documented production target, not a false claim about the current physical schema.

Supporting analyst artifacts:

- [`docs/business-requirements.md`](docs/business-requirements.md)
- [`docs/crm-data-dictionary.md`](docs/crm-data-dictionary.md)
- [`docs/workflow-specification.md`](docs/workflow-specification.md)
- [`docs/uat-test-report.md`](docs/uat-test-report.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/screenshots/README.md`](docs/screenshots/README.md)

## Overview

The public site is a lightweight static website built to present product lines clearly to international buyers.

It emphasizes:

- Clean product categorization
- Fast loading with optimized WebP assets
- Practical inquiry flow
- Professional B2B visual style
- Manufacturer-oriented export positioning

The homepage structure and product logic are inspired by the clarity of corporate and fan-category sites such as Panasonic and Hunter, without copying either site directly.

## Key Website Features

### Product Organization

- Categorized into:
  - Pedestal Fans
  - Table Fans
  - Wall Fans
  - Air Circulators
  - Ceiling Fans
  - Related appliance lines
- Models grouped by series instead of listing every variation.
- Variants, such as colors, are handled inside one product card where appropriate.

### Sorting and Product Logic

Products are displayed based on:

1. Feature completeness
2. Model clarity
3. Category grouping

This keeps higher-quality and clearer product records easier for buyers to scan.

### Optimized Assets

- Product images use trimmed WebP assets where available.
- Transparent backgrounds are preferred for catalog presentation.
- File sizes are kept practical for static hosting.

### Inquiry-Oriented Design

The site is built around B2B conversion:

- Clear product display
- Practical buyer inquiry fields
- Contact and inquiry routes for importers, wholesalers, and private-label buyers
- Backend-connected inquiry submission when `apiBaseUrl` is configured

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js backend prototype
- Prisma-backed local store bridge for ops data

No frontend framework is required.

## Public Website

Main files:

- `index.html`
- `products.html`
- `service.html`
- `culture.html`
- `job.html`
- `scripts/`
- `assets/`

Inquiry form behavior is configured in:

- `scripts/site-config.js`
- `scripts/inquiry-form.js`

When `apiBaseUrl` points to the ops backend, public inquiry submission must receive a stored backend `inquiry.id` before showing success.

## Backend Prototype

Start the local backend:

```bash
cd backend
npm start
```

Default address:

```text
http://localhost:8787
```

Core backend coverage:

- Website inquiry intake
- Customer / contact records
- Quotation records
- PI records
- Customer PO review
- Workflow case tracking
- Agent and approval queues
- Deposit, manager release, production, shipment, balance, and BL release gates
- Customer portal token access

## Internal Portal Prototype

Open:

- `internal-portal.html`

Current internal areas include:

- Inquiry Inbox
- Quotation Workspace
- PO Review Queue
- Workflow Gates
- Execution Control
- Manager Dashboard

The internal portal reads from:

```text
GET /api/internal/ops-overview
```

## Workflow Simulations

Repeatable valid quote-to-settlement simulation:

```bash
cd backend
npm run simulate:po-flow
```

Invalid gate simulation:

```bash
cd backend
npm run simulate:invalid-gates
```

These scripts verify that the main order flow can complete and that invalid jumps, such as production before finance sign-off or shipment before ready-to-ship, are blocked.

## Notes

- Keep the public marketing site lightweight and static.
- Keep ops workflow logic inside `backend/`.
- Do not treat PO approval as production release.
- Do not release BL before balance confirmation.
- Product data work should follow `docs/product-feature-context.md`.
- Public demonstration data must remain anonymized or synthetically generated.
