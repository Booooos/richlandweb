/*
 * MUTATES THE PRISMA-BACKED STORE.
 * Idempotently imports the anonymized order plan and shipment execution
 * transcribed from six user-supplied enterprise pages.
 */
const fs = require("fs");
const path = require("path");
const { loadStore, saveStore } = require("../src/store");

const sourcePath = path.join(__dirname, "..", "data", "verified-shipment-2025-01-03.json");
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const importedAt = "2026-08-24T00:00:00.000Z";
const customerId = "cust_verified_legacy_001";
const orderId = "ord_verified_legacy_001";
const shippingPlanId = "ship_verified_legacy_001";

function upsertById(collection, record) {
  const index = collection.findIndex((entry) => entry.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.push(record);
}

const store = loadStore();
["sourceDocuments", "orderLineItems", "dispatchBatches", "shipmentLineItems"].forEach((key) => {
  store[key] = Array.isArray(store[key]) ? store[key] : [];
});

const sourceDocuments = [
  {
    id: "src_order_plan_001",
    ...payload.sourceDocuments[0],
    orderId,
    evidenceScope: "order_plan",
    createdAt: importedAt,
    updatedAt: importedAt
  },
  {
    id: "src_shipment_detail_001",
    ...payload.sourceDocuments[1],
    orderId,
    shippingPlanId,
    evidenceScope: "shipment_execution",
    createdAt: importedAt,
    updatedAt: importedAt
  }
];
sourceDocuments.forEach((record) => upsertById(store.sourceDocuments, record));

upsertById(store.customers, {
  id: customerId,
  companyName: "Anonymized legacy buyer",
  primaryEmail: null,
  destinationMarket: null,
  dataClassification: "anonymized_enterprise_record",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.orders, {
  id: orderId,
  customerId,
  sourceDocumentIds: sourceDocuments.map((record) => record.id),
  status: "historical_source_record",
  plannedContainerCount: payload.orderPlan.plannedContainerCount,
  plannedFinishedProductUnits: payload.orderPlan.plannedFinishedProductUnits,
  documentedShipmentUnits: payload.verifiedShipment.finishedProductUnits,
  evidenceCoveragePercent: payload.reconciliation.sourceCoveragePercent,
  commercialValue: null,
  currency: null,
  createdAt: importedAt,
  updatedAt: importedAt
});

payload.orderPlan.orderLineItems.forEach((item, index) => upsertById(store.orderLineItems, {
  id: `oli_verified_${String(index + 1).padStart(3, "0")}`,
  orderId,
  sourceDocumentId: "src_order_plan_001",
  ...item
}));

payload.orderPlan.dispatchBatches.forEach((batch) => upsertById(store.dispatchBatches, {
  id: `batch_verified_${String(batch.sequence).padStart(3, "0")}`,
  orderId,
  sourceDocumentId: "src_order_plan_001",
  status: "planned_from_source",
  ...batch
}));

upsertById(store.shippingPlans, {
  id: shippingPlanId,
  orderId,
  customerId,
  sourceDocumentId: "src_shipment_detail_001",
  status: "historical_shipment_documented",
  shipmentDate: payload.verifiedShipment.documentDate,
  containerCount: payload.verifiedShipment.containerCount,
  cartonCount: payload.verifiedShipment.cartonCount,
  finishedProductUnits: payload.verifiedShipment.finishedProductUnits,
  componentAndPackagingQuantity: payload.verifiedShipment.componentAndPackagingQuantity,
  componentDetailSourceRows: payload.verifiedShipment.componentDetailSourceRows,
  totalCbm: payload.verifiedShipment.totalCbm,
  totalNetWeightKg: payload.verifiedShipment.totalNetWeightKg,
  totalGrossWeightKg: payload.verifiedShipment.totalGrossWeightKg,
  rawCommercialIdentifiersStored: false,
  createdAt: importedAt,
  updatedAt: importedAt
});

payload.verifiedShipment.shipmentLineItems.forEach((item, index) => upsertById(store.shipmentLineItems, {
  id: `sli_verified_${String(index + 1).padStart(3, "0")}`,
  shippingPlanId,
  orderId,
  sourceDocumentId: "src_shipment_detail_001",
  ...item
}));

upsertById(store.timeline, {
  id: "tl_verified_shipment_2025_001",
  createdAt: importedAt,
  entityType: "order",
  entityId: orderId,
  visibility: "internal",
  type: "legacy_source_evidence_imported",
  message: "Anonymized 20-container order plan and six-container shipment record imported from six verified source pages."
});

saveStore(store);
console.log(JSON.stringify({
  importedOrderId: orderId,
  plannedFinishedProductUnits: payload.orderPlan.plannedFinishedProductUnits,
  plannedContainerCount: payload.orderPlan.plannedContainerCount,
  dispatchBatchCount: payload.orderPlan.dispatchBatches.length,
  verifiedShipmentUnits: payload.verifiedShipment.finishedProductUnits,
  verifiedShipmentContainers: payload.verifiedShipment.containerCount,
  componentDetailSourceRows: payload.verifiedShipment.componentDetailSourceRows
}, null, 2));
