/*
 * MUTATES THE PRISMA-BACKED STORE.
 * Idempotently imports a portfolio-safe, non-commercial BOM audit dataset.
 */
const fs = require("fs");
const path = require("path");
const { loadStore, saveStore } = require("../src/store");

const sourcePath = path.join(__dirname, "..", "data", "anonymized-bom-audit.json");
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const importedAt = "2026-08-26T00:00:00.000Z";

function upsertById(collection, record) {
  const index = collection.findIndex((entry) => entry.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.push(record);
}

if (payload.source.commercialFieldsIncluded !== false) {
  throw new Error("BOM import blocked: commercial fields must be excluded.");
}
if (payload.bomLineItems.length !== 171) {
  throw new Error(`BOM import blocked: expected 171 rows, received ${payload.bomLineItems.length}.`);
}

const cartonTotal = payload.bomLineItems.reduce((sum, row) => sum + (row.cartons || 0), 0);
const quantityTotal = payload.bomLineItems.reduce((sum, row) => sum + (row.quantity || 0), 0);
if (cartonTotal !== payload.printedDocumentTotals.cartons || quantityTotal !== payload.printedDocumentTotals.quantity) {
  throw new Error("BOM import blocked: carton or quantity reconciliation failed.");
}

const store = loadStore();
store.bomLineItems = Array.isArray(store.bomLineItems) ? store.bomLineItems : [];
store.bomAudits = Array.isArray(store.bomAudits) ? store.bomAudits : [];

payload.bomLineItems.forEach((row) => upsertById(store.bomLineItems, {
  id: `anon_${row.lineId.toLowerCase()}`,
  datasetId: payload.datasetId,
  ...row,
  importedAt
}));

upsertById(store.bomAudits, {
  id: payload.datasetId,
  datasetType: payload.datasetType,
  lineCount: payload.bomLineItems.length,
  sourcePagesReviewed: payload.source.sourcePagesReviewed,
  commercialFieldsIncluded: false,
  printedDocumentTotals: payload.printedDocumentTotals,
  transcribedRowSums: payload.transcribedRowSums,
  reconciliation: payload.reconciliation,
  excludedFields: payload.source.excludedFields,
  createdAt: importedAt,
  updatedAt: importedAt
});

saveStore(store);
console.log(JSON.stringify({
  datasetId: payload.datasetId,
  rowsImported: payload.bomLineItems.length,
  cartonsReconciled: cartonTotal,
  quantityReconciled: quantityTotal,
  commercialFieldsIncluded: false
}, null, 2));
