# RichLand CRM Case Study — 60–90 Second Demo Script

## Recording target

- Length: 75 seconds
- Audience: Business Analyst, BI, Operations, CRM, and supply-chain hiring managers
- Data boundary: anonymized enterprise quantities plus clearly labeled synthetic commercial records

## Shot list and narration

### 0:00–0:09 — Overview

**Screen:** Hero and Role / Team / Impact / Tools strip.

> I turned six enterprise order and shipment pages into a source-backed Business Analysis and CRM automation case, then added a clearly labeled 36-order simulation at roughly 200 million yuan annual scale.

### 0:09–0:20 — Problem and discovery

**Screen:** Business Problem, then Discovery.

> Customer, quotation, follow-up and order context was fragmented. During discovery I separated the 56,480-unit order plan from the 17,132-unit shipment record and kept 216,052 BOM items out of finished-goods volume.

### 0:20–0:33 — Automation and source of truth

**Screen:** Workflow, trigger cards, then data model.

> The workflow links inquiry, customer, follow-up, quotation, PI, PO, order and shipment. PO approval, deposit, manager release and finance sign-off are separate gates, and every source-backed or synthetic field retains its truth status.

### 0:33–0:47 — Decision view

**Screen:** Action Now panel, KPIs and charts.

> The dashboard leads with action: recover three overdue follow-ups, review three open quotes, capacity-check the December peak, and monitor product concentration. The annual values reconcile to the synthetic CNY dataset.

### 0:47–1:02 — Development and testing

**Screen:** Implementation evidence and UAT.

> GitHub contains the datasets, idempotent importers, database bridge, workflow simulations and 15 UAT cases. Quotation dates, sequential versions and duplicate revisions are now enforced; duplicate inquiry review remains openly disclosed.

### 1:02–1:15 — Reflection and next steps

**Screen:** Reflection and Next Steps.

> The current limitation is transitional JSON collection persistence. Next I would normalize PostgreSQL tables, digitize all BOM rows, and add a simple forecast baseline with MAE, MAPE and bias before converting exceptions into inventory actions.

## Recording checklist

- Use a clean browser profile and hide bookmarks and accounts.
- Start at `case-study.html` at 100% zoom.
- Do not show raw source pages or customer-identifying references.
- Keep movement slow; add captions from the narration.
- Export at 1080p and name the file `richland-crm-case-demo.mp4`.
