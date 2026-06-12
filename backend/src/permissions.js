const ROLES = {
  sales: {
    key: "sales",
    label: "Sales / Foreign Trade",
    scope: "Lead ownership, quotation handling, PI / PO review, customer communication."
  },
  merchandiser: {
    key: "merchandiser",
    label: "Merchandiser / Order Follow-up",
    scope: "Order follow-up, packaging confirmation, production coordination, delivery execution."
  },
  production: {
    key: "production",
    label: "Production",
    scope: "Production scheduling, workshop progress, inspection readiness."
  },
  documentation: {
    key: "documentation",
    label: "Documentation / Shipping",
    scope: "Booking, document preparation, shipment follow-up, customer-facing files."
  },
  finance: {
    key: "finance",
    label: "Finance",
    scope: "Deposit confirmation, cost sign-off, final payment and BL release control."
  },
  manager: {
    key: "manager",
    label: "Manager",
    scope: "Production release, cost value review, cross-department approvals."
  },
  admin: {
    key: "admin",
    label: "Admin / Manager",
    scope: "Cross-functional visibility, override approval, operational supervision."
  },
  customer: {
    key: "customer",
    label: "Customer",
    scope: "Own-order tracking, PO upload, message exchange, file download."
  }
};

const MODULE_RULES = {
  inquiryInbox: {
    read: ["sales", "merchandiser", "admin"],
    update: ["sales", "admin"],
    fields: {
      pricing: [],
      customerContact: ["sales", "admin"],
      commercialDecision: ["sales", "admin"]
    }
  },
  quotationWorkspace: {
    read: ["sales", "merchandiser", "admin"],
    update: ["sales", "admin"],
    fields: {
      pricing: ["sales", "admin"],
      portalLink: ["sales", "admin"],
      commercialTerms: ["sales", "admin"],
      packagingContext: ["sales", "merchandiser", "admin"]
    }
  },
  poReviewQueue: {
    read: ["sales", "merchandiser", "admin"],
    update: ["sales", "admin"],
    fields: {
      pricingComparison: ["sales", "admin"],
      packagingConfirmation: ["sales", "merchandiser", "admin"],
      executionReadiness: ["sales", "merchandiser", "admin"]
    }
  },
  orchestratorOverview: {
    read: ["sales", "merchandiser", "production", "documentation", "finance", "manager", "admin"],
    update: ["admin", "manager"],
    fields: {
      blockedCases: ["sales", "finance", "manager", "admin"],
      overdueCases: ["sales", "merchandiser", "finance", "manager", "admin"]
    }
  },
  creditReviewQueue: {
    read: ["finance", "manager", "admin"],
    update: ["finance", "manager", "admin"],
    fields: {
      riskLevel: ["finance", "manager", "admin"],
      paymentAdvice: ["finance", "manager", "admin"]
    }
  },
  depositConfirmationQueue: {
    read: ["finance", "manager", "admin"],
    update: ["finance", "admin"],
    fields: {
      paymentProof: ["finance", "admin"],
      amount: ["finance", "admin"]
    }
  },
  managerReleaseQueue: {
    read: ["manager", "admin"],
    update: ["manager", "admin"],
    fields: {
      releaseDecision: ["manager", "admin"]
    }
  },
  inventoryMaterialQueue: {
    read: ["merchandiser", "production", "manager", "admin"],
    update: ["production", "merchandiser", "admin"],
    fields: {
      materialGap: ["production", "merchandiser", "manager", "finance", "admin"],
      costEstimate: ["manager", "finance", "admin"]
    }
  },
  costReviewQueue: {
    read: ["manager", "admin"],
    update: ["manager", "admin"],
    fields: {
      costDecision: ["manager", "admin"]
    }
  },
  financeSignoffQueue: {
    read: ["finance", "manager", "admin"],
    update: ["finance", "admin"],
    fields: {
      signoffPdf: ["finance", "admin"]
    }
  },
  productionQueue: {
    read: ["production", "merchandiser", "manager", "admin"],
    update: ["production", "merchandiser", "admin"],
    fields: {
      workshopNotes: ["production", "merchandiser", "admin"]
    }
  },
  shippingCustomsQueue: {
    read: ["documentation", "merchandiser", "manager", "admin"],
    update: ["documentation", "merchandiser", "admin"],
    fields: {
      customsDocs: ["documentation", "admin"],
      bookingData: ["documentation", "merchandiser", "admin"]
    }
  },
  balanceReleaseQueue: {
    read: ["finance", "documentation", "manager", "admin"],
    update: ["finance", "documentation", "admin"],
    fields: {
      balanceProof: ["finance", "admin"],
      blRelease: ["finance", "documentation", "admin"]
    }
  },
  orderExecution: {
    read: ["sales", "merchandiser", "production", "documentation", "finance", "manager", "admin"],
    update: ["merchandiser", "production", "documentation", "finance", "manager", "admin"],
    fields: {
      pricing: ["sales", "admin"],
      productionStatus: ["merchandiser", "production", "admin"],
      shippingStatus: ["merchandiser", "documentation", "admin"],
      customerFiles: ["sales", "documentation", "admin"],
      paymentStatus: ["finance", "manager", "admin"]
    }
  },
  customerPortal: {
    read: ["customer", "sales", "admin"],
    update: ["customer", "sales", "admin"],
    fields: {
      ownOrderOnly: ["customer"],
      uploadPO: ["customer", "sales", "admin"],
      internalPricing: ["sales", "admin"]
    }
  }
};

function normalizeRole(role) {
  return ROLES[role] ? role : "sales";
}

function parseRole(req) {
  const headerRole = req.headers["x-richland-role"];
  if (Array.isArray(headerRole)) {
    return normalizeRole(String(headerRole[0] || "").trim().toLowerCase());
  }
  return normalizeRole(String(headerRole || "").trim().toLowerCase());
}

function roleCan(role, moduleKey, action) {
  const normalizedRole = normalizeRole(role);
  const rules = MODULE_RULES[moduleKey];
  if (!rules || !rules[action]) return false;
  return rules[action].includes(normalizedRole);
}

function roleCanSeeField(role, moduleKey, fieldKey) {
  const normalizedRole = normalizeRole(role);
  const rules = MODULE_RULES[moduleKey];
  if (!rules || !rules.fields || !rules.fields[fieldKey]) return false;
  return rules.fields[fieldKey].includes(normalizedRole);
}

function buildRoleAccess(role) {
  const normalizedRole = normalizeRole(role);
  const roleMeta = ROLES[normalizedRole];
  return {
    role: normalizedRole,
    label: roleMeta.label,
    scope: roleMeta.scope,
    modules: Object.keys(MODULE_RULES).reduce((accumulator, moduleKey) => {
      const rules = MODULE_RULES[moduleKey];
      accumulator[moduleKey] = {
        read: roleCan(normalizedRole, moduleKey, "read"),
        update: roleCan(normalizedRole, moduleKey, "update"),
        fields: Object.keys(rules.fields || {}).reduce((fieldAccumulator, fieldKey) => {
          fieldAccumulator[fieldKey] = roleCanSeeField(normalizedRole, moduleKey, fieldKey);
          return fieldAccumulator;
        }, {})
      };
      return accumulator;
    }, {})
  };
}

function listRoles() {
  return Object.values(ROLES);
}

module.exports = {
  ROLES,
  MODULE_RULES,
  normalizeRole,
  parseRole,
  roleCan,
  roleCanSeeField,
  buildRoleAccess,
  listRoles
};
