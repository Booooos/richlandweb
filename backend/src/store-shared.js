const crypto = require("crypto");

const EMPTY_STORE = {
  users: [],
  customers: [],
  contacts: [],
  inquiries: [],
  followUps: [],
  jobContacts: [],
  quotations: [],
  sampleRequests: [],
  proformaInvoices: [],
  customerPOs: [],
  orders: [],
  orderLineItems: [],
  dispatchBatches: [],
  shipmentLineItems: [],
  sourceDocuments: [],
  customerCreditChecks: [],
  workflowCases: [],
  workflowStages: [],
  agentTasks: [],
  approvalTasks: [],
  paymentRecords: [],
  inventoryMatches: [],
  materialRequests: [],
  costReviews: [],
  financeApprovals: [],
  documentVersions: [],
  notificationJobs: [],
  auditEvents: [],
  productionTasks: [],
  shippingPlans: [],
  exportDocumentPacks: [],
  uploads: [],
  files: [],
  messages: [],
  timeline: []
};

function nowIso() {
  return new Date().toISOString();
}

function createPasswordHash(password, saltSeed) {
  const salt = crypto.createHash("sha256").update(String(saltSeed)).digest("hex").slice(0, 24);
  const digest = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

function defaultUsers() {
  return [
    {
      id: "usr_sales_demo",
      name: "Zhihai Sales",
      email: "sales@richland.local",
      role: "sales",
      passwordHash: createPasswordHash("Richland#Sales2026", "sales@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_merch_demo",
      name: "Merchandiser Demo",
      email: "merch@richland.local",
      role: "merchandiser",
      passwordHash: createPasswordHash("Richland#Merch2026", "merch@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_prod_demo",
      name: "Production Demo",
      email: "production@richland.local",
      role: "production",
      passwordHash: createPasswordHash("Richland#Production2026", "production@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_doc_demo",
      name: "Documentation Demo",
      email: "docs@richland.local",
      role: "documentation",
      passwordHash: createPasswordHash("Richland#Docs2026", "docs@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_fin_demo",
      name: "Finance Demo",
      email: "finance@richland.local",
      role: "finance",
      passwordHash: createPasswordHash("Richland#Finance2026", "finance@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_mgr_demo",
      name: "Manager Demo",
      email: "manager@richland.local",
      role: "manager",
      passwordHash: createPasswordHash("Richland#Manager2026", "manager@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: "usr_admin_demo",
      name: "Ops Admin",
      email: "admin@richland.local",
      role: "admin",
      passwordHash: createPasswordHash("Richland#Admin2026", "admin@richland.local"),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ];
}

function createEmptyStore() {
  return JSON.parse(JSON.stringify(EMPTY_STORE));
}

function ensureDefaultUsers(store) {
  if (!Array.isArray(store.users)) {
    store.users = [];
  }
  var changed = false;
  var defaults = defaultUsers();
  var byEmail = new Map(store.users.map(function (entry) {
    return [String(entry.email || "").toLowerCase(), entry];
  }));

  defaults.forEach(function (entry) {
    var existing = byEmail.get(String(entry.email || "").toLowerCase());
    if (!existing) {
      store.users.push(entry);
      changed = true;
      return;
    }
    if (!existing.role) {
      existing.role = entry.role;
      changed = true;
    }
    if (existing.isActive === undefined) {
      existing.isActive = true;
      changed = true;
    }
  });

  return changed;
}

module.exports = {
  EMPTY_STORE,
  createEmptyStore,
  createPasswordHash,
  defaultUsers,
  ensureDefaultUsers,
  nowIso
};
