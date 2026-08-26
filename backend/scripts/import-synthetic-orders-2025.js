/*
 * MUTATES THE PRISMA-BACKED STORE.
 * Idempotently imports the fully synthetic 2025 domestic order portfolio.
 * Every imported business record carries dataClassification=synthetically_generated.
 */
const fs = require("fs");
const path = require("path");
const { loadStore, saveStore } = require("../src/store");

const sourcePath = path.join(__dirname, "..", "data", "synthetic-orders-2025.json");
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const importedAt = "2026-08-24T00:00:00.000Z";

function upsertById(collection, record) {
  const index = collection.findIndex((entry) => entry.id === record.id);
  const normalized = {
    ...record,
    createdAt: record.createdAt || importedAt,
    updatedAt: importedAt
  };
  if (index >= 0) collection[index] = { ...collection[index], ...normalized };
  else collection.push(normalized);
}

const store = loadStore();
const imports = [
  ["customers", payload.customers],
  ["inquiries", payload.inquiries],
  ["followUps", payload.followUps],
  ["quotations", payload.quotations],
  ["proformaInvoices", payload.proformaInvoices],
  ["customerPOs", payload.customerPOs],
  ["orders", payload.orders],
  ["orderLineItems", payload.orderLineItems],
  ["paymentRecords", payload.paymentRecords],
  ["productionTasks", payload.productionTasks],
  ["shippingPlans", payload.shippingPlans]
];

imports.forEach(([key, records]) => {
  store[key] = Array.isArray(store[key]) ? store[key] : [];
  records.forEach((record) => upsertById(store[key], record));
});

store.timeline = Array.isArray(store.timeline) ? store.timeline : [];
upsertById(store.timeline, {
  id: "tl_synthetic_annual_portfolio_2025",
  createdAt: importedAt,
  entityType: "portfolio",
  entityId: "synthetic_orders_2025",
  visibility: "internal",
  type: "synthetic_portfolio_imported",
  message: `Imported ${payload.summary.orderCount} explicitly synthetic domestic orders totaling CNY ${payload.summary.annualOrderValueCny}.`
});

saveStore(store);
console.log(JSON.stringify({
  reportingPeriod: payload.reportingPeriod,
  importedCustomers: payload.customers.length,
  importedOrders: payload.orders.length,
  importedOrderLineItems: payload.orderLineItems.length,
  annualOrderValueCny: payload.summary.annualOrderValueCny,
  minimumOrderValueCny: payload.summary.minimumOrderValueCny,
  maximumOrderValueCny: payload.summary.maximumOrderValueCny,
  allRecordsSynthetic: true
}, null, 2));
