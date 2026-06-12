# RichLand Ops Backend

This is a lightweight prototype backend for the RichLand website and export-order coordination workflow.

Current scope:

- Website inquiry intake
- Job contact intake
- Inquiry qualification and customer credit review
- Quotation creation
- PI creation
- Customer PO intake and PO review
- Deposit confirmation and manager release
- Inventory / material review, cost review, and finance sign-off
- Production / shipping / export-doc execution objects
- Balance confirmation, BL release, and workflow closeout
- File metadata attachment
- Customer portal token lookup

This prototype now uses a Prisma-backed store bridge for runtime persistence. The operational model is still intentionally lightweight, but the route boundaries and workflow objects are shaped for later migration into a more explicit PostgreSQL / Prisma entity model.

## Run

```bash
cd backend
npm start
```

Repeatable end-to-end simulation:

```bash
cd backend
npm run simulate:po-flow
```

The simulation verifies one complete quote-to-settlement path:

- inquiry received
- qualification
- credit review
- quotation
- PI
- customer PO
- deposit confirmation
- manager release
- inventory / material review
- cost review
- finance sign-off
- production
- shipping / on-board
- balance confirmation
- BL release
- order closed

Default server:

- `http://localhost:8787`

## Main routes

- `GET /api/internal/roles`
- `GET /api/internal/ops-overview`
- `GET /api/internal/inquiries/:id`
- `GET /api/internal/quotations/:id`
- `GET /api/internal/customer-pos/:id`
- `POST /api/internal/inquiries/:id/qualify`
- `POST /api/internal/customers/:id/credit-check`
- `POST /api/inquiries`
- `POST /api/job-contacts`
- `POST /api/quotations`
- `POST /api/pi`
- `POST /api/customer-pos`
- `GET /api/orders`
- `POST /api/orders/:id/confirm`
- `POST /api/orders/:id/deposit-confirm`
- `POST /api/orders/:id/manager-release`
- `POST /api/orders/:id/inventory-match`
- `POST /api/orders/:id/cost-review`
- `POST /api/orders/:id/finance-signoff`
- `POST /api/orders/:id/balance-confirm`
- `POST /api/orders/:id/bl-release`
- `GET /api/orders/:id/execution`
- `PATCH /api/orders/:id/status`
- `PATCH /api/orders/:id/production`
- `PATCH /api/orders/:id/docs`
- `PATCH /api/orders/:id/shipping`
- `POST /api/orders/:id/files`
- `POST /api/orders/:id/documents/send`
- `POST /api/orders/:id/notifications/send`
- `GET /api/workflows`
- `GET /api/production-tasks`
- `GET /api/shipping-plans`
- `GET /api/export-document-packs`
- `GET /portal/orders/:token`
- `POST /portal/orders/:token/po`
- `POST /portal/orders/:token/messages`
- `GET /portal/orders/:token/files`

## Notes

- Customer portal tokens are generated when a quotation is created.
- Customer PO submission can happen from the internal API or the customer portal.
- Workflow stages are tracked separately from customer-visible milestones.
- `PO approved` is separated from `production released`.
- `balance confirmed` is a hard gate before BL release.
- Files are stored as metadata records only in this prototype. The API expects an external storage URL or reference instead of binary upload.
- First-pass internal role boundary is documented in:
  - `/Users/bosco/codex-projects/web-UI-Richland-v3/backend/docs/ops-role-permission-boundary.md`
