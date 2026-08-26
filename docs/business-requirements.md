# RichLand Export Sales CRM — Business Requirements

## 1. Purpose

Create a controlled inquiry-to-shipment workflow that gives sales and operations a shared view of customer activity, next actions, commercial documents, and execution gates.

This document describes the recruiter-facing case-study scope. It does not claim that every production-hardening item is complete.

> Demonstration data has been anonymized or synthetically generated.

## 2. Business problem

Customer details, follow-up notes, quotations, and order files were handled across separate messages and documents. This made it difficult to confirm the current status, the next action owner, the latest document version, and whether required controls had been completed.

## 3. Objectives

- Create a traceable customer history from inquiry through shipment.
- Make the next action, due date, and owner visible.
- Standardize quotation and order statuses.
- Prevent incomplete or invalid records from moving downstream.
- Expose management metrics with documented definitions.
- Preserve a simpler customer-visible status than the internal operating workflow.

## 4. Users and responsibilities

| Actor | Primary responsibility | Required visibility |
|---|---|---|
| Sales / Foreign Trade | Qualify inquiries, manage follow-ups, prepare quotations | Customer, inquiry, follow-up, quotation, PO status |
| Finance | Review credit posture, confirm deposits and balances | Commercial terms, payment evidence, approval queue |
| General Manager | Approve controlled releases and exception decisions | Blocked cases, approval queue, order pipeline |
| Production / Merchandising | Plan materials and execute released orders | Approved order scope, quantities, packaging, dates |
| Documentation / Shipping | Prepare booking, customs, and release documents | Shipment readiness, document status, balance gate |
| Customer | Review selected documents and simplified milestones | Customer-visible status only |

## 5. Scope

### In scope

- Public website inquiry intake
- Customer and contact records
- Follow-up task ownership and due dates
- Quotation version and validity control
- Customer PO review
- Order workflow and approval gates
- Production, shipment, payment, and BL-release controls
- Internal action queues and manager dashboard
- Data dictionary, KPI definitions, and UAT evidence

### Out of scope for this prototype

- Production ERP replacement
- Accounting ledger or invoice settlement system
- Automated compliance certification
- Carrier or customs-broker integration
- A fully normalized production database migration
- Real customer data in public demonstrations

## 6. Functional requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-01 | Capture structured public inquiries | Must | Required fields validate; success appears only after a stored inquiry ID is returned |
| FR-02 | Match or create a customer record | Must | Inquiry references one customer; duplicate candidates are flagged for review |
| FR-03 | Assign follow-up ownership | Must | Open action includes owner, due date, action type, and status |
| FR-04 | Identify overdue follow-ups | Must | Open actions with due dates before the snapshot date appear in the overdue queue |
| FR-05 | Control quotation versions | Must | Each quotation has a business ID, version, status, currency, and validity date |
| FR-06 | Validate quotation dates | Must | `valid_until` cannot precede `created_at` |
| FR-07 | Review customer PO against commercial documents | Must | PO review records discrepancies in quantity, price, packaging, lead time, and trade terms |
| FR-08 | Separate PO approval from production release | Must | PO approval alone cannot open production execution |
| FR-09 | Enforce payment and approval gates | Must | Deposit, manager release, material/cost review, and finance sign-off remain distinct controls |
| FR-10 | Track shipment readiness | Must | Booking, packaging, marks, and document readiness remain visible by order |
| FR-11 | Block BL release before balance confirmation | Must | An invalid release attempt returns a clear blocking reason |
| FR-12 | Show internal action dashboard | Should | Users can see inquiries, quotations, PO reviews, approvals, blocked cases, and active orders |
| FR-13 | Show recruiter-facing CRM metrics | Should | Six defined KPIs render from synthetic case-study data |
| FR-14 | Preserve role boundaries | Should | Internal approval details are not exposed through customer-facing status |
| FR-15 | Record critical workflow events | Should | Each critical transition leaves a workflow, task, approval, payment, document, notification, or audit record |

## 7. Non-functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| NFR-01 | Privacy | Public case study contains only anonymous or synthetic records |
| NFR-02 | Traceability | Core entities use stable IDs and documented foreign-key relationships |
| NFR-03 | Data integrity | Required fields, unique keys, controlled statuses, and valid date ranges are documented and tested |
| NFR-04 | Usability | Hiring manager can understand problem, model, solution, tests, and outcome in approximately two minutes |
| NFR-05 | Accessibility | Page uses semantic headings, keyboard-accessible links, readable contrast, and responsive layout |
| NFR-06 | Maintainability | Case-study metric data and rendering logic remain separate from the HTML content |
| NFR-07 | Honesty | Prototype limitations and the logical-versus-physical data-model distinction are explicit |

## 8. Business rules

1. One Customer can own many Follow-Ups, Quotations, and Orders.
2. Every Order must reference one Customer and its accepted commercial source.
3. A Follow-Up is overdue only when it is still open and its due date is in the past.
4. A quotation validity date cannot be earlier than its creation date.
5. PO approval does not equal production release.
6. Deposit confirmation does not equal execution opened.
7. Shipping completion does not equal permission to release the bill of lading.
8. Balance confirmation is a hard gate before BL release.
9. Customer-visible milestones must not reveal internal approval detail.

## 9. Requirement traceability

| Requirement group | Implementation evidence | Test evidence |
|---|---|---|
| Inquiry intake | `index.html`, `scripts/inquiry-form.js`, backend inquiry API | UAT-01 to UAT-04 |
| Customer / CRM history | Operational collections and logical CRM model | UAT-04, UAT-05 |
| Quotation control | `internal-quotation.html`, quotation API and records | UAT-06 to UAT-08 |
| Follow-up visibility | Case-study KPI logic and action-queue design | UAT-09, UAT-10 |
| Order gates | `backend/src/workflow.js`, workflow simulations | UAT-11 to UAT-15 |
| Dashboard | `case-study.html`, `scripts/case-study.js` | UAT-10, UAT-15 |

## 10. Success criteria

The prototype is accepted for case-study use when:

- The public page presents the full problem-to-outcome narrative.
- Every displayed KPI has a written definition.
- The logical relationships and implementation limitation are explicit.
- The final UAT report shows 14 passed cases and clearly discloses the duplicate-review design gap.
- No customer-identifying demonstration data is exposed.
