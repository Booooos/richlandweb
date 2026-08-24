/*
 * MUTATES THE PRISMA-BACKED STORE.
 * Idempotently imports the anonymized shipment record transcribed from
 * backend/data/verified-shipment-2025-01-03.json.
 */
const fs = require("fs");
const path = require("path");
const { loadStore, saveStore } = require("../src/store");

const sourcePath = path.join(__dirname, "..", "data", "verified-shipment-2025-01-03.json");
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function upsertById(collection, record) {
  const index = collection.findIndex((entry) => entry.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.push(record);
}

const store = loadStore();
store.sourceDocuments = Array.isArray(store.sourceDocuments) ? store.sourceDocuments : [];
store.orderLineItems = Array.isArray(store.orderLineItems) ? store.orderLineItems : [];

upsertById(store.sourceDocuments, payload.sourceDocument);
upsertById(store.customers, payload.customer);
upsertById(store.orders, payload.order);
upsertById(store.shippingPlans, payload.shippingPlan);
payload.orderLineItems.forEach((item) => upsertById(store.orderLineItems, item));
upsertById(store.timeline, {
  id: "tl_verified_shipment_2025_001",
  createdAt: "2026-08-24T00:00:00.000Z",
  entityType: "order",
  entityId: payload.order.id,
  visibility: "internal",
  type: "legacy_shipment_imported",
  message: "Anonymized shipment detail record imported from verified source evidence."
});

saveStore(store);
console.log(JSON.stringify({
  importedOrderId: payload.order.id,
  lineItemCount: payload.orderLineItems.length,
  finishedProductUnits: payload.order.finishedProductUnits,
  cartonCount: payload.order.cartonCount,
  totalCbm: payload.order.totalCbm
}, null, 2));
