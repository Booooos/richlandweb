# Case Study Visual QA Evidence

These captures were generated from the local static site with Chrome for Testing 152 and Playwright.

> Demonstration data shown in the screenshots is synthetic.

## Desktop — 1440 × 1000 viewport

![RichLand CRM case study desktop capture](case-study-desktop.webp)

## Mobile — 390 × 844 viewport

![RichLand CRM case study mobile capture](case-study-mobile.webp)

## Automated browser checks

| Check | Desktop | Mobile |
|---|---:|---:|
| Page title and primary heading rendered | Pass | Pass |
| KPI cards rendered | 6 | 6 |
| Workflow stages rendered | 6 | 6 |
| Data-model entities rendered | 4 | 4 |
| Visible UAT evidence rows rendered | 7 | 7 |
| Horizontal overflow | None | None |
| Console or page errors | None | None |

The full UAT report contains 15 cases. The public page intentionally presents seven representative rows for fast recruiter scanning.


## Internal evidence capture — BOM audit

Capture `internal-bom-audit.html` at 1440 × 1000 after serving the repository root over HTTP. The frame should include:

1. the non-commercial data notice;
2. five KPI cards, including `Commercial fields: 0`;
3. the reconciliation outcome and release decision; and
4. the first visible source-lineage rows.

Do not include browser tabs, local file paths, login credentials, customer records, prices, transaction identifiers, routes, dates, original model identifiers, or raw source photographs. Use this as the primary internal-system screenshot because it demonstrates source → validation → decision without exposing commercial information.
