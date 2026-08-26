/*
 * MUTATES THE PRISMA-BACKED STORE.
 * Idempotently imports the anonymized source-backed order/shipment facts and
 * the explicitly synthetic domestic-China CRM scenario.
 */
const fs = require("fs");
const path = require("path");
const { loadStore, saveStore } = require("../src/store");

const sourcePath = path.join(__dirname, "..", "data", "verified-shipment-2025-01-03.json");
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const commercial = payload.syntheticCommercialScenario;
const importedAt = "2026-08-24T00:00:00.000Z";
const customerId = "cust_verified_legacy_001";
const quotationId = "quo_verified_legacy_001";
const piId = "pi_verified_legacy_001";
const customerPoId = "po_verified_legacy_001";
const orderId = "ord_verified_legacy_001";
const shippingPlanId = "ship_verified_legacy_001";

function upsertById(collection, record) {
  const index = collection.findIndex((entry) => entry.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.push(record);
}

const store = loadStore();
[
  "sourceDocuments", "orderLineItems", "dispatchBatches", "shipmentLineItems",
  "paymentRecords", "quotations", "proformaInvoices", "customerPOs",
  "productionTasks", "shippingPlans", "timeline"
].forEach((key) => {
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
  companyName: `Customer ${commercial.customer.anonymousCode}`,
  customerCode: commercial.customer.anonymousCode,
  primaryEmail: null,
  country: commercial.customer.country,
  destinationMarket: commercial.customer.destinationMarket,
  destinationLocation: commercial.customer.destinationLocation,
  port: commercial.customer.port,
  dataClassification: "anonymized_customer_with_synthetic_commercial_context",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.quotations, {
  id: quotationId,
  customerId,
  inquiryId: null,
  quotationNumber: commercial.quotation.quotationNumber,
  version: commercial.quotation.version,
  currency: commercial.quotation.currency,
  issuedDate: commercial.quotation.issuedDate,
  validUntil: commercial.quotation.validUntil,
  totalValue: commercial.quotation.totalValue,
  pricingBasis: commercial.quotation.pricingBasis,
  items: payload.orderPlan.orderLineItems.map((item) => ({
    model: item.model,
    quantity: item.quantity,
    unitPrice: item.syntheticUnitPriceCny,
    lineValue: item.syntheticLineValueCny
  })),
  status: "approved",
  dataClassification: "synthetically_generated",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.proformaInvoices, {
  id: piId,
  quotationId,
  customerId,
  piNumber: commercial.proformaInvoice.piNumber,
  issuedDate: commercial.proformaInvoice.issuedDate,
  confirmedDate: commercial.proformaInvoice.confirmedDate,
  currency: commercial.proformaInvoice.currency,
  totalValue: commercial.proformaInvoice.totalValue,
  paymentTerms: commercial.proformaInvoice.paymentTerms,
  status: "confirmed",
  dataClassification: "synthetically_generated",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.customerPOs, {
  id: customerPoId,
  customerId,
  quotationId,
  piId,
  orderId,
  poNumber: "ANON-CN-2024-001",
  version: 1,
  status: "approved",
  quantitySummary: "Five fan models; 56,480 finished units; 20 planned containers",
  note: "Anonymous PO alias generated for CRM demonstration.",
  dataClassification: "synthetically_generated_alias",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.orders, {
  id: orderId,
  customerId,
  quotationId,
  piId,
  customerPoId,
  sourceDocumentIds: sourceDocuments.map((record) => record.id),
  status: "historical_source_record",
  plannedContainerCount: payload.orderPlan.plannedContainerCount,
  plannedFinishedProductUnits: payload.orderPlan.plannedFinishedProductUnits,
  documentedShipmentUnits: payload.verifiedShipment.finishedProductUnits,
  evidenceCoveragePercent: payload.reconciliation.sourceCoveragePercent,
  currency: commercial.quotation.currency,
  commercialValue: commercial.quotation.totalValue,
  sameCustomerAndOrderConfirmedByUser: true,
  createdAt: importedAt,
  updatedAt: importedAt
});

payload.orderPlan.orderLineItems.forEach((item, index) => upsertById(store.orderLineItems, {
  id: `oli_verified_${String(index + 1).padStart(3, "0")}`,
  orderId,
  sourceDocumentId: "src_order_plan_001",
  dataClassification: {
    quantities: "source_backed",
    prices: "synthetically_generated"
  },
  ...item
}));

payload.orderPlan.dispatchBatches.forEach((batch) => upsertById(store.dispatchBatches, {
  id: `batch_verified_${String(batch.sequence).padStart(3, "0")}`,
  orderId,
  sourceDocumentId: "src_order_plan_001",
  status: "planned_from_source",
  ...batch
}));

upsertById(store.productionTasks, {
  id: "prd_verified_legacy_001",
  orderId,
  customerId,
  status: "historical_scenario",
  plannedStartDate: commercial.timeline.productionPlannedStartDate,
  actualStartDate: commercial.timeline.productionActualStartDate,
  documentedShipmentReadyDate: commercial.timeline.documentedShipmentReadyDate,
  quantitySummary: "56,480 planned finished units",
  dataClassification: "synthetically_generated",
  createdAt: importedAt,
  updatedAt: importedAt
});

upsertById(store.shippingPlans, {
  id: shippingPlanId,
  orderId,
  customerId,
  sourceDocumentId: "src_shipment_detail_001",
  status: "historical_shipment_documented",
  shipmentDate: payload.verifiedShipment.documentDate,
  destinationMarket: commercial.customer.destinationMarket,
  destinationLocation: commercial.customer.destinationLocation,
  port: commercial.customer.port,
  containerCount: payload.verifiedShipment.containerCount,
  cartonCount: payload.verifiedShipment.cartonCount,
  finishedProductUnits: payload.verifiedShipment.finishedProductUnits,
  componentAndPackagingQuantity: payload.verifiedShipment.componentAndPackagingQuantity,
  componentDetailSourceRows: payload.verifiedShipment.componentDetailSourceRows,
  totalCbm: payload.verifiedShipment.totalCbm,
  totalNetWeightKg: payload.verifiedShipment.totalNetWeightKg,
  totalGrossWeightKg: payload.verifiedShipment.totalGrossWeightKg,
  syntheticCommercialValue: commercial.documentedShipmentCommercialValue,
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

commercial.payments.forEach((payment, index) => upsertById(store.paymentRecords, {
  id: `pay_verified_${String(index + 1).padStart(3, "0")}`,
  orderId,
  customerId,
  ...payment,
  dataClassification: "synthetically_generated",
  createdAt: importedAt,
  updatedAt: importedAt
}));

upsertById(store.timeline, {
  id: "tl_verified_shipment_2025_001",
  createdAt: importedAt,
  entityType: "order",
  entityId: orderId,
  visibility: "internal",
  type: "legacy_source_evidence_imported",
  message: "One anonymized customer/order links the source-backed plan and shipment; domestic commercial fields are explicitly synthetic."
});

saveStore(store);
console.log(JSON.stringify({
  importedOrderId: orderId,
  anonymousCustomerCode: commercial.customer.anonymousCode,
  plannedFinishedProductUnits: payload.orderPlan.plannedFinishedProductUnits,
  plannedContainerCount: payload.orderPlan.plannedContainerCount,
  syntheticOrderValueCny: commercial.quotation.totalValue,
  verifiedShipmentUnits: payload.verifiedShipment.finishedProductUnits,
  verifiedShipmentContainers: payload.verifiedShipment.containerCount,
  sourceBackedAndSyntheticFieldsSeparated: true
}, null, 2));
