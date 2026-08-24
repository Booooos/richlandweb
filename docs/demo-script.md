# RichLand CRM Case Study — 60–90 Second Demo Script

## Recording target

- Length: 75 seconds
- Format: 1080p screen recording
- Audience: Business Analyst, Business Intelligence, Operations Analyst, and CRM hiring managers
- Data: synthetic demonstration records only

## Shot list and narration

### 0:00–0:10 — Business problem

**Screen:** Case-study hero, then scroll to Business Problem.

**Narration:**

> RichLand's customer details, quotations, follow-ups, and order files were handled across separate records. I analyzed the process and designed one traceable CRM workflow from inquiry through shipment.

### 0:10–0:22 — Role and workflow

**Screen:** My Role cards, then the six workflow stages.

**Narration:**

> I defined the requirements, designed the data structure, built the public and internal screens, connected form submissions to storage, and documented the approval and reminder logic.

### 0:22–0:35 — Data model

**Screen:** ER model and integrity notes.

**Narration:**

> The logical model links each customer to follow-ups, quotations, and orders with primary and foreign keys. Statuses, timestamps, unique business keys, and date rules make the activity history auditable.

### 0:35–0:49 — Dashboard

**Screen:** Six KPI cards and both charts.

**Narration:**

> The dashboard focuses on action: open quotations, pending and overdue follow-ups, order status, monthly order value, and quotation conversion. All values shown here come from synthetic demonstration data with documented formulas.

### 0:49–1:03 — Working solution

**Screen:** Public inquiry form, internal portal, quotation workspace.

**Narration:**

> A public inquiry creates a stored record before success is shown. Internal users then work from role-based queues for quotation, PO review, payment, production, shipment, and release controls.

### 1:03–1:15 — Testing and result

**Screen:** UAT summary and Final Outcome section.

**Narration:**

> I documented 15 UAT cases covering required fields, duplicates, invalid dates, overdue logic, and blocked workflow jumps. The result is not just a website—it is a reviewable Business Analysis, CRM, and workflow automation case.

## Recording checklist

- Use a clean browser profile and hide bookmarks/personal accounts.
- Start at `case-study.html` with the page at 100% zoom.
- Use synthetic records only.
- Keep the pointer movement slow and deliberate.
- Avoid showing backend `.env`, local databases, tokens, or internal passwords.
- Export with readable text at 1080p.
- Add captions using the narration text above.
- Name the final file `richland-crm-case-demo.mp4`.

## Publish location

Place the final compressed recording under `assets/case-study/` or host it on a portfolio video service, then replace this repository documentation link with the public video URL.

