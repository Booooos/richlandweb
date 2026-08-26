# RichLand Ltd. Website and Ops Prototype

Static B2B product showcase website for RichLand Ltd., focused on electric fans and related home appliances for OEM / ODM export business.

The repo also includes the first prototype of the supporting internal ops backend for inquiry intake, quotation / PI / PO handling, and order execution handoff.

## Featured BA + CRM Case Study

Open [`case-study.html`](case-study.html) for the recruiter-facing project narrative:

> Overview → Business Problem → Discovery → Automation → Source of Truth → Decision View → Testing → Development → Reflection → Next Steps

The case study presents this repository as a **Business Analysis + Data Workflow + CRM Automation** project, including:

- Top-level Role, Team, Impact, and Tools summary
- Discovery decisions derived from six anonymized enterprise pages
- Inquiry → Customer → Follow-Up → Quotation → Order → Shipment workflow
- Trigger, owner, system-write, and failure-handling automation logic
- Logical CRM ER model with source-provenance classification
- CNY 200.02M annual synthetic dashboard led by exceptions and recommended actions
- 15 UAT cases with quotation date/version/duplicate controls and one disclosed inquiry-deduplication gap
- Real browser captures, working screens, implementation evidence, limitations, reflection, and next steps

All public case-study records are anonymous or synthetic. The current backend uses Prisma `StoreCollection` payloads as a prototype storage bridge; the normalized entity model is a documented production target, not a false claim about the current physical schema.

The public companion case is available at https://richland-crm-case.bosco0127.chatgpt.site.

Supporting analyst artifacts:

- [`docs/business-requirements.md`](docs/business-requirements.md)
- [`docs/crm-data-dictionary.md`](docs/crm-data-dictionary.md)
- [`docs/workflow-specification.md`](docs/workflow-specification.md)
- [`docs/uat-test-report.md`](docs/uat-test-report.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/screenshots/README.md`](docs/screenshots/README.md)

## Source-backed enterprise evidence

The branch now includes an anonymized dataset transcribed and reconciled from six user-supplied business pages:

- Order plan: 20 containers, 56,480 finished units, five fan models, and three planned dispatch batches
- Verified 03 Jan 2025 shipment: 6 containers, 17,132 finished units, 5,642 cartons, and 420.6100871 CBM
- Shipment packing/BOM source: 171 component rows summarized to 216,052 component and packaging units
- All raw customer, PO, SO, booking, and container identifiers are excluded from the public dataset

The order plan and shipment execution are stored separately because their model/color mixes do not support claiming that the shipment equals one original planned batch.

The default backend start command idempotently imports the source-backed records before starting the server. To run only the import:

```bash
cd backend
npm run import:verified-shipment
```

Dataset: [`backend/data/verified-shipment-2025-01-03.json`](backend/data/verified-shipment-2025-01-03.json)

> Demonstration data has been anonymized or synthetically generated. Quantities and logistics totals are source-backed; commercial values and dates are labeled synthetic.

## Synthetic annual CRM portfolio

To support realistic BA, CRM, and BI analysis at the company's stated scale, the branch includes a fully synthetic 2025 domestic portfolio:

- 36 orders across 12 anonymous Mainland China customers
- CNY 200,023,190 total order value (approximately CNY 200 million)
- Order values from CNY 178,380 to CNY 9,905,840
- Unit prices between CNY 50 and CNY 300
- 1,754,070 finished units and 636.97 estimated container equivalents
- Linked inquiries, follow-ups, quotations, PIs, customer POs, payments, production tasks, and shipping plans
- 30 completed, 3 shipped, 2 confirmed, and 1 in-production order

Every record in this portfolio is marked `dataClassification: "synthetically_generated"`. It is separate from the anonymized source-backed order and shipment evidence.

```bash
cd backend
npm run import:synthetic-orders
```

Dataset: [`backend/data/synthetic-orders-2025.json`](backend/data/synthetic-orders-2025.json)

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

## Anonymized BOM evidence

- `backend/data/anonymized-bom-audit.json` contains 171 fully digitized operational rows.
- `backend/scripts/import-anonymized-bom.js` performs an idempotent import and blocks any dataset marked as containing commercial fields.
- `internal-bom-audit.html` shows row lineage, totals, search, and reconciliation exceptions without customer, price, transaction, route, date, container, or original product-model identifiers.
- Reconciled totals: 5,642 cartons and 216,052 component / packaging units; small CBM and weight differences remain documented rather than forced.

## Notes

- Keep the public marketing site lightweight and static.
- Keep ops workflow logic inside `backend/`.
- Do not treat PO approval as production release.
- Do not release BL before balance confirmation.
- Product data work should follow `docs/product-feature-context.md`.
- Public demonstration data must remain anonymized or synthetically generated.
