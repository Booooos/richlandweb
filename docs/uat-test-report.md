# RichLand CRM — UAT Test Report

## Test summary

| Item | Result |
|---|---:|
| Total test cases | 15 |
| Final passed | 14 |
| Failed on first execution | 3 |
| Fixed and retested | 2 |
| Disclosed open design gaps | 1 |
| Critical blockers | 0 |

CRM behavior tests use synthetic dates and identifiers. The source-backed order and shipment quantities are anonymized enterprise evidence and are tested separately for reconciliation and provenance.

## Test environment

- Static frontend served locally
- Node.js backend prototype on `http://localhost:8787`
- Prisma-backed SQLite store bridge
- Role-based internal login
- Browser checks at desktop and mobile viewport widths
- Workflow simulation scripts for valid and invalid transition paths

## UAT cases

| ID | Requirement | Scenario / input | Expected result | Initial | Final evidence |
|---|---|---|---|---|---|
| UAT-01 | FR-01 | Submit valid buyer email, market, category, quantity, and message | API stores inquiry and returns `inquiry.id`; UI then shows success | Pass | Inquiry API response and stored collection record |
| UAT-02 | FR-01 | Submit form with email blank | Browser/form validation prevents submission and identifies required field | Pass | Inline validation state |
| UAT-03 | FR-01, NFR-03 | Submit malformed email and non-positive quantity | Invalid values are rejected; no record is stored | Pass | Validation response; store count unchanged |
| UAT-04 | FR-02 | Submit same normalized email, company, market, and category twice within review window | Second inquiry is flagged as a potential duplicate rather than silently creating a second customer | Fail | **Open gap:** duplicate-review flag is not implemented in the current prototype |
| UAT-05 | FR-02 | Create inquiry for an existing customer with a new contact | Inquiry links to existing `customer_id`; new contact remains under same account | Pass | Customer/contact relation check |
| UAT-06 | FR-05, FR-06 | Create quotation whose `valid_until` precedes creation date | API rejects invalid date range with clear reason | Pass | `createQuotation` date validation returns an error before store mutation |
| UAT-07 | FR-05 | Save a new revision of an existing quotation | Version must equal the highest existing version + 1; prior version remains unchanged | Pass | Server calculates the next version and rejects skipped or repeated revisions |
| UAT-08 | FR-05 | Attempt duplicate quotation number and version | Case-insensitive number + version business key blocks duplicate revision | Pass | Duplicate check runs before `store.quotations.push` |
| UAT-09 | FR-03, FR-04 | Open overdue queue with two open past-due actions, three future actions, and two completed actions | Queue shows only two open past-due actions | Fail | Boundary-date item was incorrectly treated as overdue |
| UAT-10 | FR-12, FR-13 | Load dashboard from deterministic synthetic dataset | Six KPI values and two chart views match documented formulas; conversion excludes non-issued drafts/reviews | Fail | Fixed formula and reconciled rendered values |
| UAT-11 | FR-07 | Review PO with price and packaging differences | PO remains in review and records discrepancy notes | Pass | PO review status and notes |
| UAT-12 | FR-08, FR-09 | Attempt production release before finance sign-off | Transition is blocked; workflow case retains prior stage and a reason is returned | Pass | Invalid-gate simulation |
| UAT-13 | FR-09 | Complete deposit, manager release, material/cost review, and finance sign-off in sequence | Execution opens only after the final required gate | Pass | Valid quote-to-settlement simulation |
| UAT-14 | FR-11 | Attempt BL release before balance confirmation | Hard gate blocks release | Pass | Invalid-gate simulation |
| UAT-15 | FR-10, FR-15 | Complete valid production, shipment, balance, and document-release path | Order reaches completed milestone and retains event/task evidence | Pass | Valid quote-to-settlement simulation |

## Implemented quotation controls

Following code review, quotation creation now:

- rejects invalid or past `validUntil` dates;
- generates or accepts a stable `quotationNumber`;
- requires each revision to equal the highest existing version plus one; and
- rejects a case-insensitive duplicate `quotationNumber + version` pair before persisting the record.

These controls make UAT-06 through UAT-08 supported by the current implementation rather than documentation-only claims.

## Defect and fix log

### GAP-01 — Duplicate inquiry review is not implemented

- Related test: UAT-04
- Severity: Medium; non-blocking for public case-study release, blocking for production CRM readiness
- Observed: a repeated inquiry could be submitted, but the internal review response did not clearly identify it as a potential duplicate.
- Business risk: sales could create parallel follow-up paths for the same request.
- Current decision: disclose the gap instead of claiming automation that the repository does not contain.
- Planned fix: normalize company/email/market/category inputs, surface a duplicate-review flag, and preserve the source records for human review.
- Retest status: Pending implementation.

### DEF-01 — Due-today item counted as overdue

- Related test: UAT-09
- Severity: Medium
- Observed: a date-only comparison treated an item due later on the snapshot date as overdue.
- Business risk: owner queues could show false exceptions.
- Fix: compare the complete due timestamp to the reporting snapshot timestamp; date-only deadlines use end-of-day in the reporting timezone.
- Retest: Passed with past, due-today, future, done, and cancelled cases.

### DEF-02 — Conversion denominator included a non-issued quotation

- Related test: UAT-10
- Severity: Medium
- Observed: the initial calculation treated every non-draft record as issued, including an item still under internal review.
- Business risk: the conversion rate would be understated and would not match the written KPI definition.
- Fix: restrict the denominator to `SENT`, `ACCEPTED`, `REJECTED`, and `EXPIRED` quotations.
- Retest: Passed against the deterministic eight-quotation demonstration dataset.

## Automated workflow verification

Run the valid workflow simulation:

```bash
cd backend
npm run simulate:po-flow
```

Run invalid transition checks:

```bash
cd backend
npm run simulate:invalid-gates
```

These simulations support UAT-12 through UAT-15. They do not replace browser-level UAT for the public form and recruiter-facing case page.

## Exit criteria

- The public case-study requirements have passing evidence, and the production CRM duplicate-control gap is disclosed.
- Failed cases are fixed, documented, and retested.
- No public page displays customer-identifying data.
- No critical workflow gate can be skipped in the tested path.
- Dashboard values reconcile to the documented synthetic input data.

This exit decision is for a portfolio case-study release, not a production CRM go-live.
