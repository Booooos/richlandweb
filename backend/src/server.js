const http = require("http");
const { URL } = require("url");
const {
  loadStore,
  saveStore,
  createId,
  createPortalToken,
  nowIso,
  pushTimeline
} = require("./store");
const { writeBase64Upload, readUpload } = require("./uploads");
const {
  buildRoleAccess,
  listRoles,
  roleCan,
  roleCanSeeField
} = require("./permissions");
const {
  authenticateRequest,
  issueToken,
  sanitizeUser,
  verifyPassword
} = require("./auth");
const {
  AGENTS,
  findWorkflowCase,
  createWorkflowCase,
  linkWorkflowRefs,
  pushAuditEvent,
  createWorkflowStageRecord,
  createAgentTask,
  completeAgentTask,
  createApprovalTask,
  resolveNextAgent,
  createNotificationJob,
  createDocumentVersion,
  createPaymentRecord
} = require("./workflow");

const PORT = Number(process.env.PORT || 8787);

const ORDER_STATUSES = new Set([
  "draft",
  "confirmed",
  "in_production",
  "ready_to_ship",
  "shipped",
  "completed"
]);

const DOC_STATUSES = new Set(["pending", "preparing", "ready", "sent"]);
const PO_STATUSES = new Set(["uploaded", "under_review", "approved", "rejected", "revised"]);
const PRODUCTION_STATUSES = new Set([
  "not_started",
  "pending_scheduling",
  "scheduled",
  "in_progress",
  "inspection",
  "completed"
]);
const SHIPPING_STATUSES = new Set([
  "pending_booking",
  "booking_in_progress",
  "booked",
  "ready_for_loading",
  "shipped"
]);
const APPROVAL_STATUSES = new Set(["pending", "approved", "rejected", "returned"]);
const PAYMENT_KINDS = new Set(["deposit", "balance"]);
const PAYMENT_STATUSES = new Set(["pending", "confirmed"]);

function workflowQueueCard(task, extra) {
  return {
    id: task.id,
    taskKind: task.approvalType ? "approval" : "agent",
    workflowCaseId: task.workflowCaseId || "",
    inquiryId: extra && extra.inquiryId ? extra.inquiryId : "",
    quotationId: extra && extra.quotationId ? extra.quotationId : "",
    customerPoId: extra && extra.customerPoId ? extra.customerPoId : "",
    orderId: task.orderId || extra && extra.orderId || "",
    customerId: task.customerId || extra && extra.customerId || "",
    title: extra && extra.title ? extra.title : task.agentLabel || task.title || task.id,
    companyName: extra && extra.companyName ? extra.companyName : "",
    stageKey: task.stageKey || extra && extra.stageKey || "",
    queueKey: task.queueKey || "",
    agentKey: task.agentKey || "",
    approvalType: task.approvalType || "",
    owningRole: task.owningRole || "",
    status: task.status || "pending",
    tone: statusTone(task.status || "pending"),
    summary: extra && extra.summary ? extra.summary : task.inputSummary || task.summary || "",
    createdAt: task.createdAt
  };
}

function getCompanyName(store, customerId) {
  const customer = store.customers.find((entry) => entry.id === customerId) || null;
  return customer ? customer.companyName : "";
}

function getWorkflowRefs(store, workflowCaseId) {
  const workflowCase = (store.workflowCases || []).find((entry) => entry.id === workflowCaseId) || null;
  if (!workflowCase) {
    return {
      inquiryId: "",
      quotationId: "",
      customerPoId: "",
      orderId: "",
      customerId: ""
    };
  }
  return {
    inquiryId: workflowCase.inquiryId || "",
    quotationId: workflowCase.quotationId || "",
    customerPoId: workflowCase.customerPoId || "",
    orderId: workflowCase.orderId || "",
    customerId: workflowCase.customerId || ""
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function sortNewestFirst(left, right) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function statusTone(status) {
  if (["new", "under_review", "draft", "pending_customer_confirmation", "reviewing", "revised"].includes(status)) {
    return "warning";
  }
  if (["approved", "confirmed", "in_production", "ready_to_ship"].includes(status)) {
    return "good";
  }
  if (["rejected", "closed"].includes(status)) {
    return "neutral";
  }
  return "neutral";
}

function parseNumber(value) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetween(start, end) {
  const startTime = new Date(start || "").getTime();
  const endTime = new Date(end || nowIso()).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0;
  return Math.max(0, Math.round((endTime - startTime) / (24 * 60 * 60 * 1000)));
}

function quotedValue(quotation) {
  return (quotation && Array.isArray(quotation.items) ? quotation.items : []).reduce((total, item) => {
    return total + (parseNumber(item.quantity || item.qty) * parseNumber(item.price || item.unitPrice));
  }, 0);
}

function managerCaseCard(store, workflowCase, extra) {
  const customer = store.customers.find((entry) => entry.id === workflowCase.customerId) || null;
  const order = workflowCase.orderId
    ? store.orders.find((entry) => entry.id === workflowCase.orderId) || null
    : null;
  return {
    workflowCaseId: workflowCase.id,
    companyName: customer ? customer.companyName : "",
    inquiryId: workflowCase.inquiryId || "",
    orderId: workflowCase.orderId || "",
    stageKey: workflowCase.internalWorkflowStage || "",
    customerMilestoneStatus: workflowCase.customerMilestoneStatus || "",
    orderStatus: order ? order.status : "",
    ageDays: daysBetween(workflowCase.createdAt, workflowCase.closedAt || nowIso()),
    updatedAt: workflowCase.updatedAt || workflowCase.createdAt,
    ...(extra || {})
  };
}

function pipelineBucket(stageKey) {
  if (["inquiry_received", "inquiry_qualified", "customer_credit_reviewed"].includes(stageKey)) return "inquiry";
  if (["quotation_prepared_sent", "pi_prepared_sent"].includes(stageKey)) return "quotation";
  if (["customer_po_uploaded", "po_approved"].includes(stageKey)) return "poReview";
  if (["deposit_confirmed", "production_released", "inventory_matched_material_gap_identified", "cost_reviewed", "finance_signoff_completed"].includes(stageKey)) return "depositRelease";
  if (["production_in_progress", "production_completed"].includes(stageKey)) return "production";
  if (["ready_to_ship", "on_board", "balance_collection_open"].includes(stageKey)) return "shipment";
  if (["balance_confirmed", "bl_released"].includes(stageKey)) return "balanceRelease";
  if (stageKey === "order_closed") return "completed";
  return "inquiry";
}

function summarizeManagerDashboard(store, role) {
  const canRead = ["manager", "admin"].includes(role);
  if (!canRead) return null;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const workflowCases = (store.workflowCases || []).slice();
  const activeCases = workflowCases.filter((entry) => entry.status !== "closed");
  const pendingApprovalRoles = role === "admin" ? ["manager", "finance", "sales"] : ["manager"];
  const approvalCards = (store.approvalTasks || [])
    .filter((entry) => entry.status === "pending" && pendingApprovalRoles.includes(entry.owningRole))
    .sort(sortNewestFirst)
    .slice(0, 8)
    .map((entry) => {
      const workflowCase = findWorkflowCaseByRefs(store, { workflowCaseId: entry.workflowCaseId });
      return {
        id: entry.id,
        title: entry.title,
        approvalType: entry.approvalType,
        owningRole: entry.owningRole,
        status: entry.status,
        createdAt: entry.createdAt,
        summary: entry.summary,
        ...(workflowCase ? managerCaseCard(store, workflowCase) : {})
      };
    });

  const pipeline = {
    inquiry: 0,
    quotation: 0,
    poReview: 0,
    depositRelease: 0,
    production: 0,
    shipment: 0,
    balanceRelease: 0,
    completed: workflowCases.filter((entry) => entry.status === "closed").length
  };
  activeCases.forEach((entry) => {
    pipeline[pipelineBucket(entry.internalWorkflowStage)] += 1;
  });

  const blockedOrders = workflowCases
    .filter((entry) => entry.status === "blocked" || (Array.isArray(entry.blockingIssues) && entry.blockingIssues.length))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 8)
    .map((entry) => managerCaseCard(store, entry, {
      blockingIssues: Array.isArray(entry.blockingIssues) ? entry.blockingIssues : []
    }));

  const productionActive = (store.productionTasks || [])
    .filter((entry) => ["pending_scheduling", "scheduled", "in_progress", "inspection"].includes(entry.status))
    .sort(sortNewestFirst)
    .slice(0, 6)
    .map((entry) => {
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: entry.orderId });
      return {
        id: entry.id,
        orderId: entry.orderId,
        status: entry.status,
        quantitySummary: entry.quantitySummary,
        updatedAt: entry.updatedAt,
        ...(workflowCase ? managerCaseCard(store, workflowCase) : {})
      };
    });
  const shipmentActive = (store.shippingPlans || [])
    .filter((entry) => ["pending_booking", "booking_in_progress", "booked", "ready_for_loading", "shipped"].includes(entry.status))
    .sort(sortNewestFirst)
    .slice(0, 6)
    .map((entry) => {
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: entry.orderId });
      return {
        id: entry.id,
        orderId: entry.orderId,
        status: entry.status,
        bookingReference: entry.bookingReference,
        shipmentWindow: entry.shipmentWindow,
        updatedAt: entry.updatedAt,
        ...(workflowCase ? managerCaseCard(store, workflowCase) : {})
      };
    });

  const monthQuotations = (store.quotations || []).filter((entry) => entry.createdAt >= monthStart);
  const monthOrders = (store.orders || []).filter((entry) => entry.createdAt >= monthStart && entry.status !== "draft");
  const avgProgressDays = activeCases.length
    ? Math.round(activeCases.reduce((total, entry) => total + daysBetween(entry.createdAt, nowIso()), 0) / activeCases.length)
    : 0;

  return {
    todayNeedsApproval: approvalCards,
    orderPipeline: pipeline,
    blockedOrders,
    productionShipmentSnapshot: {
      productionActiveCount: productionActive.length,
      readyToShipCount: (store.orders || []).filter((entry) => entry.status === "ready_to_ship").length,
      shippedCount: (store.orders || []).filter((entry) => entry.status === "shipped").length,
      productionActive,
      shipmentActive
    },
    businessMetrics: {
      monthInquiryCount: (store.inquiries || []).filter((entry) => entry.createdAt >= monthStart).length,
      monthQuotationCount: monthQuotations.length,
      monthPoCount: (store.customerPOs || []).filter((entry) => entry.createdAt >= monthStart).length,
      monthOrderCount: monthOrders.length,
      monthBookedValue: monthOrders.reduce((total, order) => {
        const quotation = store.quotations.find((entry) => entry.id === order.quotationId) || null;
        return total + quotedValue(quotation);
      }, 0),
      avgProgressDays,
      delayedOrderCount: activeCases.filter((entry) => daysBetween(entry.createdAt, nowIso()) > 45).length
    }
  };
}

function summarizeInternalOverview(store, role) {
  const access = buildRoleAccess(role);
  const customersById = new Map(store.customers.map((entry) => [entry.id, entry]));
  const workflowCases = [...(store.workflowCases || [])];
  const inquiries = roleCan(role, "inquiryInbox", "read")
    ? [...store.inquiries]
    .sort(sortNewestFirst)
    .map((entry) => {
      const customer = customersById.get(entry.customerId) || null;
      return {
        id: entry.id,
        customerId: entry.customerId,
        companyName: customer ? customer.companyName : "",
        destinationMarket: entry.destinationMarket,
        targetCategory: entry.targetCategory,
        estimatedQuantity: entry.estimatedQuantity,
        cooperationMode: entry.cooperationMode,
        status: entry.status,
        tone: statusTone(entry.status),
        createdAt: entry.createdAt
      };
    })
    : [];

  const quotations = roleCan(role, "quotationWorkspace", "read")
    ? [...store.quotations]
    .sort(sortNewestFirst)
    .map((entry) => {
      const customer = customersById.get(entry.customerId) || null;
      const canSeePortalLink = roleCanSeeField(role, "quotationWorkspace", "portalLink");
      const canSeePricing = roleCanSeeField(role, "quotationWorkspace", "pricing");
      return {
        id: entry.id,
        inquiryId: entry.inquiryId,
        customerId: entry.customerId,
        companyName: customer ? customer.companyName : "",
        currency: canSeePricing ? entry.currency : "",
        version: entry.version,
        validUntil: entry.validUntil,
        salesOwner: entry.salesOwner,
        status: entry.status,
        tone: statusTone(entry.status),
        itemCount: Array.isArray(entry.items) ? entry.items.length : 0,
        portalPath: canSeePortalLink ? `/portal/orders/${entry.portalToken}` : "",
        createdAt: entry.createdAt
      };
    })
    : [];

  const poQueue = roleCan(role, "poReviewQueue", "read")
    ? [...store.customerPOs]
    .sort(sortNewestFirst)
    .map((entry) => {
      const customer = customersById.get(entry.customerId) || null;
      const order = store.orders.find((item) => item.id === entry.orderId) || null;
      const canSeePricingComparison = roleCanSeeField(role, "poReviewQueue", "pricingComparison");
      return {
        id: entry.id,
        customerId: entry.customerId,
        orderId: entry.orderId,
        poNumber: entry.poNumber,
        companyName: customer ? customer.companyName : "",
        quantitySummary: entry.quantitySummary,
        tradeTerms: entry.tradeTerms,
        packagingNotes: entry.packagingNotes,
        priceNotes: canSeePricingComparison ? entry.priceNotes : "",
        status: entry.status,
        tone: statusTone(entry.status),
        orderStatus: order ? order.status : "",
        customerVisibleStatus: order ? order.customerVisibleStatus : "",
        createdAt: entry.createdAt
      };
    })
    : [];

  const agentQueueMap = {
    creditReviewQueue: roleCan(role, "creditReviewQueue", "read")
      ? (store.agentTasks || [])
          .filter((entry) => entry.queueKey === "creditReviewQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.agentLabel,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.inputSummary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    depositConfirmationQueue: roleCan(role, "depositConfirmationQueue", "read")
      ? (store.agentTasks || [])
          .filter((entry) => entry.queueKey === "depositConfirmationQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.agentLabel,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.inputSummary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    managerReleaseQueue: roleCan(role, "managerReleaseQueue", "read")
      ? (store.approvalTasks || [])
          .filter((entry) => entry.approvalType === "manager_release" && entry.status === "pending")
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.title,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.summary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    inventoryMaterialQueue: roleCan(role, "inventoryMaterialQueue", "read")
      ? (store.agentTasks || [])
          .filter((entry) => entry.queueKey === "inventoryMaterialQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.agentLabel,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.inputSummary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    costReviewQueue: roleCan(role, "costReviewQueue", "read")
      ? (store.approvalTasks || [])
          .filter((entry) => entry.approvalType === "cost_review" && entry.status === "pending")
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.title,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.summary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    financeSignoffQueue: roleCan(role, "financeSignoffQueue", "read")
      ? (store.approvalTasks || [])
          .filter((entry) => entry.approvalType === "finance_signoff" && entry.status === "pending")
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.title,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.summary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    productionQueue: roleCan(role, "productionQueue", "read")
      ? (store.agentTasks || [])
          .filter((entry) => entry.queueKey === "productionQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.agentLabel,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.inputSummary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    shippingCustomsQueue: roleCan(role, "shippingCustomsQueue", "read")
      ? (store.agentTasks || [])
          .filter((entry) => entry.queueKey === "shippingCustomsQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
          .sort(sortNewestFirst)
          .map((entry) => workflowQueueCard(entry, {
            title: entry.agentLabel,
            companyName: getCompanyName(store, entry.customerId),
            summary: entry.inputSummary,
            ...getWorkflowRefs(store, entry.workflowCaseId)
          }))
      : [],
    balanceReleaseQueue: roleCan(role, "balanceReleaseQueue", "read")
      ? [
          ...(store.agentTasks || [])
            .filter((entry) => entry.queueKey === "balanceReleaseQueue" && ["pending", "blocked", "in_progress"].includes(entry.status))
            .map((entry) => workflowQueueCard(entry, {
              title: entry.agentLabel,
              companyName: getCompanyName(store, entry.customerId),
              summary: entry.inputSummary,
              ...getWorkflowRefs(store, entry.workflowCaseId)
            })),
          ...(store.approvalTasks || [])
            .filter((entry) => entry.approvalType === "bl_release" && entry.status === "pending")
            .map((entry) => workflowQueueCard(entry, {
              title: entry.title,
              companyName: getCompanyName(store, entry.customerId),
              summary: entry.summary,
              ...getWorkflowRefs(store, entry.workflowCaseId)
            }))
        ].sort(sortNewestFirst)
      : []
  };

  const blockedCases = workflowCases.filter((entry) => entry.status === "blocked").length;
  const pendingApprovals = (store.approvalTasks || []).filter((entry) => entry.status === "pending").length;
  const pendingAgentTasks = (store.agentTasks || []).filter((entry) => ["pending", "blocked", "in_progress"].includes(entry.status)).length;

  return {
    roleAccess: access,
    availableRoles: listRoles(),
    summary: {
      inquiryActionCount: roleCan(role, "inquiryInbox", "read")
        ? inquiries.filter((entry) => ["new", "reviewing"].includes(entry.status)).length
        : 0,
      quotationActionCount: roleCan(role, "quotationWorkspace", "read")
        ? quotations.filter((entry) => ["draft", "pending_customer_confirmation"].includes(entry.status)).length
        : 0,
      poReviewCount: roleCan(role, "poReviewQueue", "read")
        ? poQueue.filter((entry) => ["uploaded", "under_review", "revised"].includes(entry.status)).length
        : 0,
      activeOrderCount: roleCan(role, "orderExecution", "read")
        ? store.orders.filter((entry) => ["confirmed", "in_production", "ready_to_ship"].includes(entry.status)).length
        : 0,
      workflowActionCount: pendingAgentTasks,
      approvalActionCount: pendingApprovals,
      blockedCaseCount: blockedCases
    },
    orchestratorOverview: {
      activeWorkflowCount: workflowCases.filter((entry) => entry.status === "active").length,
      blockedCaseCount: blockedCases,
      pendingAgentTasks,
      pendingApprovals
    },
    managerDashboard: summarizeManagerDashboard(store, role),
    inquiryInbox: inquiries.slice(0, 12),
    quotationWorkspace: quotations.slice(0, 12),
    poReviewQueue: poQueue.slice(0, 12),
    agentQueues: Object.keys(agentQueueMap).reduce((accumulator, key) => {
      accumulator[key] = agentQueueMap[key].slice(0, 12);
      return accumulator;
    }, {})
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function badRequest(res, message) {
  sendJson(res, 400, { error: message });
}

function unauthorized(res, message) {
  sendJson(res, 401, { error: message || "Authentication required" });
}

function serviceUnavailable(res, message) {
  sendJson(res, 503, { error: message || "Store is temporarily unavailable" });
}

function protectedInternalRoute(req, pathname) {
  if (pathname.startsWith("/api/internal")) return true;
  if (pathname.startsWith("/api/workflows")) return true;
  if (pathname.startsWith("/api/agent-tasks")) return true;
  if (pathname.startsWith("/api/approval-tasks")) return true;
  if (pathname === "/api/uploads") return true;
  if (pathname.startsWith("/api/orders")) return true;
  if (pathname.startsWith("/api/quotations")) return true;
  if (pathname.startsWith("/api/customer-pos")) return true;
  if (pathname.startsWith("/api/pi")) return true;
  if (pathname.startsWith("/api/production-tasks")) return true;
  if (pathname.startsWith("/api/shipping-plans")) return true;
  if (pathname.startsWith("/api/export-document-packs")) return true;
  if (pathname === "/api/inquiries" && req.method === "GET") return true;
  return false;
}

function executionPayloadForOrder(store, orderId) {
  const order = store.orders.find((entry) => entry.id === orderId) || null;
  if (!order) return null;
  return {
    order,
    productionTasks: store.productionTasks.filter((entry) => entry.orderId === order.id),
    shippingPlans: store.shippingPlans.filter((entry) => entry.orderId === order.id),
    exportDocumentPacks: store.exportDocumentPacks.filter((entry) => entry.orderId === order.id)
  };
}

function timelineForEntity(store, entityIds, visibility) {
  return store.timeline.filter((entry) => {
    if (visibility && entry.visibility !== visibility) return false;
    return entityIds.includes(entry.entityId);
  });
}

function internalInquiryDetail(store, inquiryId) {
  const inquiry = store.inquiries.find((entry) => entry.id === inquiryId) || null;
  if (!inquiry) return null;
  const customer = store.customers.find((entry) => entry.id === inquiry.customerId) || null;
  const contact = store.contacts.find((entry) => entry.id === inquiry.contactId) || null;
  const quotations = store.quotations.filter((entry) => entry.inquiryId === inquiry.id);
  return {
    inquiry,
    customer,
    contact,
    quotations,
    timeline: timelineForEntity(
      store,
      [inquiry.id, ...quotations.map((entry) => entry.id)],
      "internal"
    )
  };
}

function internalQuotationDetail(store, quotationId) {
  const quotation = store.quotations.find((entry) => entry.id === quotationId) || null;
  if (!quotation) return null;
  const inquiry = store.inquiries.find((entry) => entry.id === quotation.inquiryId) || null;
  const customer = store.customers.find((entry) => entry.id === quotation.customerId) || null;
  const contact = inquiry ? store.contacts.find((entry) => entry.id === inquiry.contactId) || null : null;
  const pi = store.proformaInvoices.find((entry) => entry.quotationId === quotation.id) || null;
  const order = store.orders.find((entry) => entry.quotationId === quotation.id) || null;
  const customerPOs = store.customerPOs.filter((entry) => entry.quotationId === quotation.id);
  return {
    quotation,
    inquiry,
    customer,
    contact,
    pi,
    order,
    customerPOs,
    timeline: timelineForEntity(
      store,
      [
        quotation.id,
        inquiry && inquiry.id,
        pi && pi.id,
        order && order.id,
        ...customerPOs.map((entry) => entry.id)
      ].filter(Boolean),
      "internal"
    )
  };
}

function internalPOReviewDetail(store, poId) {
  const customerPO = store.customerPOs.find((entry) => entry.id === poId) || null;
  if (!customerPO) return null;
  const customer = store.customers.find((entry) => entry.id === customerPO.customerId) || null;
  const quotation = store.quotations.find((entry) => entry.id === customerPO.quotationId) || null;
  const pi = store.proformaInvoices.find((entry) => entry.id === customerPO.piId) || null;
  const inquiry = quotation ? store.inquiries.find((entry) => entry.id === quotation.inquiryId) || null : null;
  const contact = inquiry ? store.contacts.find((entry) => entry.id === inquiry.contactId) || null : null;
  const order = store.orders.find((entry) => entry.id === customerPO.orderId) || null;
  const execution = order ? executionPayloadForOrder(store, order.id) : null;
  return {
    customerPO,
    customer,
    quotation,
    pi,
    inquiry,
    contact,
    order,
    execution,
    timeline: timelineForEntity(
      store,
      [
        customerPO.id,
        quotation && quotation.id,
        pi && pi.id,
        inquiry && inquiry.id,
        order && order.id
      ].filter(Boolean),
      "internal"
    )
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
  return missing;
}

function findOrCreateCustomer(store, payload) {
  const companyName = String(payload.companyName || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const website = String(payload.website || "").trim();
  const contactPerson = String(payload.contactPerson || payload.name || "").trim();
  const destinationMarket = String(payload.destinationMarket || "").trim();

  let customer = store.customers.find(
    (entry) =>
      entry.companyName.toLowerCase() === companyName.toLowerCase() ||
      (email && entry.primaryEmail && entry.primaryEmail.toLowerCase() === email)
  );

  if (!customer) {
    customer = {
      id: createId("cust"),
      companyName,
      primaryEmail: email,
      website,
      destinationMarket,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.customers.push(customer);
  } else {
    customer.website = customer.website || website;
    customer.destinationMarket = customer.destinationMarket || destinationMarket;
    customer.primaryEmail = customer.primaryEmail || email;
    customer.updatedAt = nowIso();
  }

  let contact = store.contacts.find(
    (entry) => entry.customerId === customer.id && entry.email && entry.email.toLowerCase() === email
  );

  if (!contact && (contactPerson || email)) {
    contact = {
      id: createId("ctc"),
      customerId: customer.id,
      name: contactPerson,
      email,
      phone: String(payload.phone || payload.phoneOrWechat || "").trim(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.contacts.push(contact);
  }

  return { customer, contact };
}

function createInquiry(store, payload) {
  const { customer, contact } = findOrCreateCustomer(store, payload);
  const inquiry = {
    id: createId("inq"),
    customerId: customer.id,
    contactId: contact ? contact.id : null,
    source: payload.source || "website",
    status: "new",
    targetCategory: payload.targetCategory,
    estimatedQuantity: payload.estimatedQuantity,
    destinationMarket: payload.destinationMarket,
    cooperationMode: payload.cooperationMode,
    message: payload.message,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.inquiries.push(inquiry);
  const workflowCase = createWorkflowCase(store, createId, {
    customerId: customer.id,
    contactId: contact ? contact.id : null,
    inquiryId: inquiry.id
  });
  createWorkflowStageRecord(store, createId, workflowCase, "inquiry_received", "Website inquiry stored and reference created.");
  const intakeTask = createAgentTask(
    store,
    createId,
    workflowCase,
    "inquiry_intake",
    "inquiry_received",
    `Website inquiry for ${payload.targetCategory || "general category"} from ${customer.companyName || "customer"}.`
  );
  completeAgentTask(store, intakeTask, {
    status: "completed",
    result: "Inquiry payload checked and stored.",
    recommendedNextStep: "Move to sales qualification.",
    attachments: []
  });
  createAgentTask(
    store,
    createId,
    workflowCase,
    "sales_qualification",
    "inquiry_received",
    `Classify inquiry, confirm category fit, and decide whether it is ready for credit review and quotation.`
  );
  pushAuditEvent(store, createId, workflowCase.id, "workflow_created", "Workflow case opened from website inquiry.", {
    inquiryId: inquiry.id
  });
  pushTimeline(store, {
    entityType: "inquiry",
    entityId: inquiry.id,
    visibility: "internal",
    type: "inquiry_created",
    message: "Website inquiry received"
  });

  return inquiry;
}

function findWorkflowCaseByRefs(store, refs) {
  return findWorkflowCase(store, refs);
}

function findPendingAgentTask(store, workflowCaseId, agentKey) {
  return (store.agentTasks || [])
    .filter((entry) => {
      return (
        entry.workflowCaseId === workflowCaseId &&
        (!agentKey || entry.agentKey === agentKey) &&
        ["pending", "blocked", "in_progress"].includes(entry.status)
      );
    })
    .sort(sortNewestFirst)[0] || null;
}

function findPendingApprovalTask(store, workflowCaseId, approvalType) {
  return (store.approvalTasks || [])
    .filter((entry) => {
      return (
        entry.workflowCaseId === workflowCaseId &&
        (!approvalType || entry.approvalType === approvalType) &&
        entry.status === "pending"
      );
    })
    .sort(sortNewestFirst)[0] || null;
}

function setWorkflowBlocking(workflowCase, blockingIssues, status) {
  workflowCase.blockingIssues = Array.isArray(blockingIssues) ? blockingIssues.filter(Boolean) : [];
  workflowCase.status = status || (workflowCase.blockingIssues.length ? "blocked" : "active");
  workflowCase.updatedAt = nowIso();
}

function clearWorkflowBlocking(workflowCase) {
  workflowCase.blockingIssues = [];
  workflowCase.status = "active";
  workflowCase.updatedAt = nowIso();
}

function closeWorkflowCase(store, workflowCase, note) {
  stageWorkflow(store, workflowCase, "order_closed", note || "Workflow closed after final delivery and settlement.");
  workflowCase.status = "closed";
  workflowCase.currentAgentKey = "";
  workflowCase.currentTaskId = null;
  workflowCase.closedAt = nowIso();
  workflowCase.updatedAt = nowIso();
}

function stageWorkflow(store, workflowCase, stageKey, note) {
  clearWorkflowBlocking(workflowCase);
  return createWorkflowStageRecord(store, createId, workflowCase, stageKey, note);
}

function queueNextAgentTask(store, workflowCase, stageKey, inputSummary, extras) {
  const nextAgentKey = resolveNextAgent(stageKey);
  if (!nextAgentKey) return null;
  const existing = findPendingAgentTask(store, workflowCase.id, nextAgentKey);
  if (existing) return existing;
  return createAgentTask(store, createId, workflowCase, nextAgentKey, stageKey, inputSummary, extras);
}

function ensureApprovalTask(store, workflowCase, approvalType, summary, extras) {
  const existing = findPendingApprovalTask(store, workflowCase.id, approvalType);
  if (existing) return existing;
  return createApprovalTask(store, createId, workflowCase, approvalType, summary, extras);
}

function queueWorkflowTransition(store, workflowCase, stageKey, note, nextSummary) {
  stageWorkflow(store, workflowCase, stageKey, note);
  pushAuditEvent(store, createId, workflowCase.id, "workflow_stage_completed", note || `Workflow moved to ${stageKey}.`, {
    stageKey
  });
  return queueNextAgentTask(store, workflowCase, stageKey, nextSummary || "");
}

function createJobContact(store, payload) {
  const entry = {
    id: createId("job"),
    name: payload.name,
    phoneOrWechat: payload.phoneOrWechat || "",
    email: payload.email || "",
    interestedDirection: payload.interestedDirection,
    currentBackground: payload.currentBackground,
    message: payload.message,
    status: "new",
    source: "job-page",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  store.jobContacts.push(entry);
  pushTimeline(store, {
    entityType: "job_contact",
    entityId: entry.id,
    visibility: "internal",
    type: "job_contact_created",
    message: "Job contact received from website"
  });
  return entry;
}

function createQuotation(store, payload) {
  const inquiry = store.inquiries.find((entry) => entry.id === payload.inquiryId);
  if (!inquiry) return { error: "Inquiry not found" };
  const workflowCase = findWorkflowCaseByRefs(store, { inquiryId: inquiry.id });
  if (!workflowCase) return { error: "Workflow case not found for inquiry" };
  if (!["customer_credit_reviewed", "quotation_prepared_sent", "pi_prepared_sent", "customer_po_uploaded", "po_approved", "deposit_confirmed", "production_released", "inventory_matched_material_gap_identified", "cost_reviewed", "finance_signoff_completed", "production_in_progress", "production_completed", "ready_to_ship", "on_board", "balance_collection_open", "balance_confirmed", "bl_released", "order_closed"].includes(workflowCase.internalWorkflowStage)) {
    return { error: "Customer credit review must be completed before creating a quotation" };
  }

  const relatedQuotations = store.quotations.filter((entry) => entry.inquiryId === inquiry.id);
  const highestVersion = relatedQuotations.reduce((highest, entry) => Math.max(highest, Number(entry.version) || 0), 0);
  const requestedVersion = payload.version == null ? highestVersion + 1 : Number(payload.version);
  if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
    return { error: "Quotation version must be a positive integer" };
  }
  if (requestedVersion !== highestVersion + 1) {
    return { error: `Quotation version must increment from ${highestVersion} to ${highestVersion + 1}` };
  }

  const quotationNumber = String(payload.quotationNumber || `Q-${inquiry.id}`).trim();
  if (!quotationNumber) return { error: "Quotation number is required" };
  const duplicateRevision = store.quotations.some((entry) =>
    String(entry.quotationNumber || `Q-${entry.inquiryId}`).toLowerCase() === quotationNumber.toLowerCase()
    && Number(entry.version) === requestedVersion
  );
  if (duplicateRevision) return { error: "Quotation number and version already exist" };

  let validUntil = null;
  if (payload.validUntil) {
    const validUntilDate = new Date(`${payload.validUntil}T23:59:59.999Z`);
    if (Number.isNaN(validUntilDate.getTime())) return { error: "Quotation valid-until date is invalid" };
    const createdDate = new Date(nowIso());
    if (validUntilDate < createdDate) return { error: "Quotation valid-until date cannot precede creation date" };
    validUntil = payload.validUntil;
  }

  const portalToken = createPortalToken();
  const quotation = {
    id: createId("quo"),
    inquiryId: inquiry.id,
    customerId: inquiry.customerId,
    quotationNumber,
    version: requestedVersion,
    currency: payload.currency || "USD",
    validUntil,
    moq: payload.moq || null,
    leadTime: payload.leadTime || null,
    incoterm: payload.incoterm || null,
    notes: payload.notes || "",
    items: Array.isArray(payload.items) ? payload.items : [],
    status: payload.status || "draft",
    salesOwner: payload.salesOwner || "",
    portalToken,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.quotations.push(quotation);
  inquiry.status = "quoted";
  inquiry.updatedAt = nowIso();
  linkWorkflowRefs(workflowCase, {
    quotationId: quotation.id
  });
  const quotationTask = findPendingAgentTask(store, workflowCase.id, "quotation_preparation");
  if (quotationTask) {
    completeAgentTask(store, quotationTask, {
      status: "completed",
      result: "Quotation prepared and saved.",
      recommendedNextStep: "Prepare PI when commercial terms are confirmed."
    });
  }
  queueWorkflowTransition(
    store,
    workflowCase,
    "quotation_prepared_sent",
    "Quotation prepared and stored.",
    "Prepare PI and customer-facing commercial package."
  );
  createDocumentVersion(store, createId, workflowCase, {
    relatedEntityType: "quotation",
    relatedEntityId: quotation.id,
    kind: "quotation",
    fileName: `quotation-${quotation.id}.pdf`,
    visibility: "internal",
    deliveryChannel: "internal"
  });

  pushTimeline(store, {
    entityType: "quotation",
    entityId: quotation.id,
    visibility: "internal",
    type: "quotation_created",
    message: "Quotation created from inquiry"
  });

  return quotation;
}

function createPI(store, payload) {
  const quotation = store.quotations.find((entry) => entry.id === payload.quotationId);
  if (!quotation) return { error: "Quotation not found" };
  const existingPI = store.proformaInvoices.find((entry) => entry.quotationId === quotation.id);
  if (existingPI) return { error: "PI already exists for this quotation" };
  const workflowCase = findWorkflowCaseByRefs(store, { quotationId: quotation.id });
  if (!workflowCase) return { error: "Workflow case not found for quotation" };

  const pi = {
    id: createId("pi"),
    quotationId: quotation.id,
    customerId: quotation.customerId,
    quotationVersion: quotation.version,
    paymentTerms: payload.paymentTerms || "",
    tradeTerms: payload.tradeTerms || quotation.incoterm || "",
    notes: payload.notes || "",
    status: payload.status || "pending_customer_confirmation",
    portalToken: quotation.portalToken,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.proformaInvoices.push(pi);
  quotation.status = "pending_customer_confirmation";
  quotation.updatedAt = nowIso();
  linkWorkflowRefs(workflowCase, {
    piId: pi.id
  });
  const piTask = findPendingAgentTask(store, workflowCase.id, "pi_preparation");
  if (piTask) {
    completeAgentTask(store, piTask, {
      status: "completed",
      result: "PI prepared and linked to customer portal.",
      recommendedNextStep: "Wait for customer PO upload or revision feedback."
    });
  }
  stageWorkflow(store, workflowCase, "pi_prepared_sent", "PI prepared and sent for customer confirmation.");
  pushAuditEvent(store, createId, workflowCase.id, "pi_sent", "PI prepared from quotation.", {
    piId: pi.id,
    quotationId: quotation.id
  });
  createDocumentVersion(store, createId, workflowCase, {
    relatedEntityType: "pi",
    relatedEntityId: pi.id,
    kind: "pi",
    fileName: `pi-${pi.id}.pdf`,
    visibility: "customer",
    deliveryChannel: "email"
  });
  createNotificationJob(store, createId, workflowCase, {
    channel: "email",
    type: "pi_sent",
    recipientRole: "customer",
    recipientEmail: payload.customerEmail || "",
    subject: `PI ready for quotation ${quotation.id}`,
    bodyPreview: "PI issued and linked for customer confirmation.",
    status: "queued",
    triggeredByAgent: "pi_preparation"
  });
  pushTimeline(store, {
    entityType: "pi",
    entityId: pi.id,
    visibility: "internal",
    type: "pi_created",
    message: "Proforma invoice created"
  });
  return pi;
}

function ensureDraftOrder(store, references) {
  let order = store.orders.find(
    (entry) =>
      entry.quotationId === (references.quotationId || null) &&
      entry.piId === (references.piId || null) &&
      entry.customerId === references.customerId
  );

  if (!order) {
    order = {
      id: createId("ord"),
      customerId: references.customerId,
      quotationId: references.quotationId || null,
      piId: references.piId || null,
      customerPoId: null,
      status: "draft",
      customerVisibleStatus: "PO Under Review",
      productionStatus: "not_started",
      docsStatus: "pending",
      portalToken: references.portalToken || createPortalToken(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.orders.push(order);
  }

  return order;
}

function ensureExecutionArtifacts(store, order) {
  const po = store.customerPOs.find((entry) => entry.id === order.customerPoId) || null;
  const pi = store.proformaInvoices.find((entry) => entry.id === order.piId) || null;
  const quotation = store.quotations.find((entry) => entry.id === order.quotationId) || null;
  const quantitySummary = firstNonEmpty(
    po && po.quantitySummary,
    quotation && Array.isArray(quotation.items) && quotation.items.length
      ? quotation.items
          .map((item) => {
            const model = firstNonEmpty(item.model, item.sku, item.name);
            const qty = firstNonEmpty(item.quantity, item.qty);
            return model && qty ? `${model} x ${qty}` : model || qty;
          })
          .filter(Boolean)
          .join(", ")
      : "",
    "To be confirmed"
  );
  const tradeTerms = firstNonEmpty(po && po.tradeTerms, pi && pi.tradeTerms, quotation && quotation.incoterm);
  const packagingNotes = firstNonEmpty(po && po.packagingNotes, "To be confirmed");

  let productionTask = store.productionTasks.find((entry) => entry.orderId === order.id);
  if (!productionTask) {
    productionTask = {
      id: createId("prd"),
      orderId: order.id,
      customerId: order.customerId,
      status: "pending_scheduling",
      workshop: "Fan assembly line",
      quantitySummary,
      packagingNotes,
      plannedStartDate: "",
      plannedFinishDate: "",
      notes: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.productionTasks.push(productionTask);
  }

  let shippingPlan = store.shippingPlans.find((entry) => entry.orderId === order.id);
  if (!shippingPlan) {
    shippingPlan = {
      id: createId("ship"),
      orderId: order.id,
      customerId: order.customerId,
      status: "pending_booking",
      tradeTerms,
      portOfLoading: "Shunde / Foshan",
      shipmentWindow: "",
      bookingReference: "",
      packagingConfirmed: packagingNotes !== "To be confirmed",
      marksConfirmed: false,
      notes: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.shippingPlans.push(shippingPlan);
  }

  let exportDocumentPack = store.exportDocumentPacks.find((entry) => entry.orderId === order.id);
  if (!exportDocumentPack) {
    exportDocumentPack = {
      id: createId("doc"),
      orderId: order.id,
      customerId: order.customerId,
      status: "pending",
      requiredDocuments: ["PI", "CI", "PL", "BL draft"],
      preparedDocuments: [],
      packagingConfirmed: packagingNotes !== "To be confirmed",
      notes: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.exportDocumentPacks.push(exportDocumentPack);
  }

  return { productionTask, shippingPlan, exportDocumentPack };
}

function confirmOrderExecution(store, order, note) {
  const customerPo = store.customerPOs.find((entry) => entry.id === order.customerPoId) || null;
  const quotation = store.quotations.find((entry) => entry.id === order.quotationId) || null;
  const pi = store.proformaInvoices.find((entry) => entry.id === order.piId) || null;

  order.status = "confirmed";
  order.customerVisibleStatus = "Order Confirmed";
  order.updatedAt = nowIso();

  if (customerPo) {
    customerPo.status = "approved";
    customerPo.updatedAt = nowIso();
  }
  if (quotation) {
    quotation.status = "approved";
    quotation.updatedAt = nowIso();
  }
  if (pi) {
    pi.status = "confirmed";
    pi.updatedAt = nowIso();
  }

  const execution = ensureExecutionArtifacts(store, order);
  pushTimeline(store, {
    entityType: "order",
    entityId: order.id,
    visibility: "customer",
    type: "order_confirmed",
    message: note || "Order confirmed and handed to internal execution"
  });
  pushTimeline(store, {
    entityType: "order",
    entityId: order.id,
    visibility: "internal",
    type: "internal_handoff_created",
    message: "Production, shipping, and export document tasks opened"
  });

  return {
    order,
    customerPo,
    execution
  };
}

function createCustomerPO(store, payload, source) {
  const quotation = payload.quotationId
    ? store.quotations.find((entry) => entry.id === payload.quotationId)
    : null;
  const pi = payload.piId ? store.proformaInvoices.find((entry) => entry.id === payload.piId) : null;

  if (!quotation && !pi) {
    return { error: "Quotation or PI reference is required" };
  }

  const customerId = (pi && pi.customerId) || (quotation && quotation.customerId);
  const portalToken = (pi && pi.portalToken) || (quotation && quotation.portalToken) || createPortalToken();
  const workflowCase = findWorkflowCaseByRefs(store, {
    piId: pi ? pi.id : null,
    quotationId: quotation ? quotation.id : (pi ? pi.quotationId : null)
  });
  if (!workflowCase) {
    return { error: "Workflow case not found for quotation or PI" };
  }
  const order = ensureDraftOrder(store, {
    customerId,
    quotationId: quotation ? quotation.id : pi.quotationId,
    piId: pi ? pi.id : null,
    portalToken
  });

  const po = {
    id: createId("po"),
    customerId,
    quotationId: quotation ? quotation.id : pi.quotationId,
    piId: pi ? pi.id : null,
    orderId: order.id,
    poNumber: payload.poNumber,
    version: payload.version || 1,
    status: payload.status && PO_STATUSES.has(payload.status) ? payload.status : "under_review",
    quantitySummary: payload.quantitySummary || "",
    packagingNotes: payload.packagingNotes || "",
    priceNotes: payload.priceNotes || "",
    leadTimeNotes: payload.leadTimeNotes || "",
    tradeTerms: payload.tradeTerms || "",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    note: payload.note || "",
    source: source || "internal_api",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.customerPOs.push(po);
  order.customerPoId = po.id;
  order.updatedAt = nowIso();
  order.customerVisibleStatus = "PO Under Review";
  linkWorkflowRefs(workflowCase, {
    customerPoId: po.id,
    orderId: order.id
  });
  stageWorkflow(store, workflowCase, "customer_po_uploaded", source === "customer_portal" ? "Customer PO uploaded from portal." : "Customer PO recorded internally.");
  createAgentTask(
    store,
    createId,
    workflowCase,
    "po_review",
    "customer_po_uploaded",
    "Compare PO quantity, packaging, price notes, lead time, and trade terms against quotation and PI."
  );
  pushAuditEvent(store, createId, workflowCase.id, "customer_po_uploaded", "Customer PO attached to workflow.", {
    customerPoId: po.id,
    orderId: order.id
  });
  createDocumentVersion(store, createId, workflowCase, {
    relatedEntityType: "customer_po",
    relatedEntityId: po.id,
    kind: "customer_po",
    fileName: `${po.poNumber || po.id}.pdf`,
    visibility: "internal",
    deliveryChannel: source === "customer_portal" ? "portal" : "internal"
  });

  pushTimeline(store, {
    entityType: "customer_po",
    entityId: po.id,
    visibility: "internal",
    type: "customer_po_uploaded",
    message: source === "customer_portal" ? "Customer PO uploaded from portal" : "Customer PO recorded"
  });

  return { po, order };
}

function resolvePortalAccess(store, token) {
  const quotation = store.quotations.find((entry) => entry.portalToken === token) || null;
  const pi = store.proformaInvoices.find((entry) => entry.portalToken === token) || null;
  const order = store.orders.find((entry) => entry.portalToken === token) || null;
  const customerId =
    (order && order.customerId) ||
    (pi && pi.customerId) ||
    (quotation && quotation.customerId) ||
    null;

  if (!customerId) return null;

  const customer = store.customers.find((entry) => entry.id === customerId) || null;
  const pos = store.customerPOs.filter((entry) => entry.customerId === customerId && ((quotation && entry.quotationId === quotation.id) || (order && entry.orderId === order.id) || (pi && entry.piId === pi.id)));
  const files = store.files.filter((entry) => entry.customerId === customerId && entry.visibility === "customer");
  const messages = store.messages.filter((entry) => entry.customerId === customerId);

  return { customer, quotation, pi, order, pos, files, messages };
}

function publicPortalPayload(store, token) {
  const data = resolvePortalAccess(store, token);
  if (!data) return null;

  const timeline = store.timeline.filter((entry) => {
    if (entry.visibility !== "customer") return false;
    return (
      (data.quotation && entry.entityId === data.quotation.id) ||
      (data.pi && entry.entityId === data.pi.id) ||
      (data.order && entry.entityId === data.order.id) ||
      data.pos.some((po) => po.id === entry.entityId)
    );
  });

  return {
    customer: data.customer,
    quotation: data.quotation,
    pi: data.pi,
    order: data.order
      ? {
          id: data.order.id,
          status: data.order.status,
          customerVisibleStatus: data.order.customerVisibleStatus,
          docsStatus: data.order.docsStatus
        }
      : null,
    customerPOs: data.pos,
    files: data.files,
    messages: data.messages,
    timeline
  };
}

function routeRequest(req, res, pathname) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  let authStore;
  try {
    authStore = loadStore();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return serviceUnavailable(res, "Store is temporarily unavailable. Please retry.");
  }
  const authContext = authenticateRequest(req, authStore);
  const role = authContext.role || null;

  if (req.method === "POST" && pathname === "/api/auth/login") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["email", "password"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const user = (authStore.users || []).find(
        (entry) =>
          entry.email &&
          entry.email.toLowerCase() === String(payload.email).trim().toLowerCase() &&
          entry.isActive !== false
      );
      if (!user || !verifyPassword(payload.password, user.passwordHash)) {
        return unauthorized(res, "Invalid email or password");
      }
      const token = issueToken(user);
      return sendJson(res, 200, {
        token,
        user: sanitizeUser(user),
        roleAccess: buildRoleAccess(user.role)
      });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    if (!authContext.authenticated) {
      return unauthorized(res, "Login required");
    }
    return sendJson(res, 200, {
      user: sanitizeUser(authContext.user),
      roleAccess: buildRoleAccess(authContext.user.role)
    });
  }

  if (protectedInternalRoute(req, pathname) && !authContext.authenticated) {
    return unauthorized(res, "Login required for internal portal access");
  }

  const uploadFileMatch = pathname.match(/^\/uploads\/([^/]+)$/);
  if (req.method === "GET" && uploadFileMatch) {
    const file = readUpload(uploadFileMatch[1]);
    if (!file) return notFound(res);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(file.buffer);
    return;
  }

  const inquiryDetailMatch = pathname.match(/^\/api\/internal\/inquiries\/([^/]+)$/);
  if (req.method === "GET" && inquiryDetailMatch) {
    if (!roleCan(role, "inquiryInbox", "read")) {
      return sendJson(res, 403, { error: "Role cannot access inquiry details" });
    }
    const store = loadStore();
    const payload = internalInquiryDetail(store, inquiryDetailMatch[1]);
    if (!payload) return notFound(res);
    return sendJson(res, 200, {
      roleAccess: buildRoleAccess(role),
      detail: payload
    });
  }

  const inquiryQualifyMatch = pathname.match(/^\/api\/internal\/inquiries\/([^/]+)\/qualify$/);
  if (req.method === "POST" && inquiryQualifyMatch) {
    if (!roleCan(role, "inquiryInbox", "update")) {
      return sendJson(res, 403, { error: "Role cannot qualify inquiries" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const inquiry = store.inquiries.find((entry) => entry.id === inquiryQualifyMatch[1]);
      if (!inquiry) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { inquiryId: inquiry.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      inquiry.status = "reviewing";
      inquiry.updatedAt = nowIso();
      clearWorkflowBlocking(workflowCase);
      const qualificationTask = findPendingAgentTask(store, workflowCase.id, "sales_qualification");
      if (qualificationTask) {
        completeAgentTask(store, qualificationTask, {
          status: "completed",
          result: payload.note || "Inquiry categorized and approved to move into credit review.",
          recommendedNextStep: "Run credit review before quotation."
        });
      }
      queueWorkflowTransition(
        store,
        workflowCase,
        "inquiry_qualified",
        payload.note || "Inquiry qualified for commercial follow-up.",
        "Review customer risk and payment posture before quotation."
      );
      pushTimeline(store, {
        entityType: "inquiry",
        entityId: inquiry.id,
        visibility: "internal",
        type: "inquiry_qualified",
        message: payload.note || "Inquiry qualified for credit review"
      });
      saveStore(store);
      return sendJson(res, 200, { inquiry, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const customerCreditMatch = pathname.match(/^\/api\/internal\/customers\/([^/]+)\/credit-check$/);
  if (req.method === "POST" && customerCreditMatch) {
    if (!roleCan(role, "creditReviewQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot submit customer credit review" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const workflowCase = payload.workflowCaseId
        ? findWorkflowCaseByRefs(store, { workflowCaseId: payload.workflowCaseId })
        : (store.workflowCases || [])
            .filter((entry) => entry.customerId === customerCreditMatch[1])
            .sort(sortNewestFirst)[0] || null;
      if (!workflowCase) return badRequest(res, "Workflow case not found for customer");
      const task = findPendingAgentTask(store, workflowCase.id, "credit_check");
      if (!task) return badRequest(res, "No pending credit review task");
      const riskLevel = firstNonEmpty(payload.riskLevel, "medium");
      const paymentAdvice = firstNonEmpty(payload.paymentAdvice, "Deposit required before production release");
      const record = {
        id: createId("crd"),
        workflowCaseId: workflowCase.id,
        customerId: workflowCase.customerId,
        riskLevel,
        paymentAdvice,
        note: payload.note || "",
        reviewedByRole: role,
        reviewedAt: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.customerCreditChecks.push(record);
      completeAgentTask(store, task, {
        status: "completed",
        result: payload.note || `Credit reviewed with ${riskLevel} risk.`,
        recommendedNextStep: "Quotation can be prepared."
      });
      queueWorkflowTransition(
        store,
        workflowCase,
        "customer_credit_reviewed",
        payload.note || `Customer credit reviewed with ${riskLevel} risk.`,
        "Prepare quotation based on approved customer context."
      );
      pushTimeline(store, {
        entityType: "inquiry",
        entityId: workflowCase.inquiryId,
        visibility: "internal",
        type: "customer_credit_reviewed",
        message: payload.note || `Credit review finished with ${riskLevel} risk.`
      });
      saveStore(store);
      return sendJson(res, 200, { creditCheck: record, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const quotationDetailMatch = pathname.match(/^\/api\/internal\/quotations\/([^/]+)$/);
  if (req.method === "GET" && quotationDetailMatch) {
    if (!roleCan(role, "quotationWorkspace", "read")) {
      return sendJson(res, 403, { error: "Role cannot access quotation details" });
    }
    const store = loadStore();
    const payload = internalQuotationDetail(store, quotationDetailMatch[1]);
    if (!payload) return notFound(res);
    if (!roleCanSeeField(role, "quotationWorkspace", "pricing")) {
      payload.quotation.currency = "";
      payload.quotation.items = (payload.quotation.items || []).map((item) => ({
        model: item.model || item.name || "",
        quantity: item.quantity || item.qty || ""
      }));
    }
    return sendJson(res, 200, {
      roleAccess: buildRoleAccess(role),
      detail: payload
    });
  }

  const poDetailMatch = pathname.match(/^\/api\/internal\/customer-pos\/([^/]+)$/);
  if (req.method === "GET" && poDetailMatch) {
    if (!roleCan(role, "poReviewQueue", "read")) {
      return sendJson(res, 403, { error: "Role cannot access PO review details" });
    }
    const store = loadStore();
    const payload = internalPOReviewDetail(store, poDetailMatch[1]);
    if (!payload) return notFound(res);
    if (!roleCanSeeField(role, "poReviewQueue", "pricingComparison")) {
      payload.customerPO.priceNotes = "";
      if (payload.quotation) {
        payload.quotation.currency = "";
        payload.quotation.items = (payload.quotation.items || []).map((item) => ({
          model: item.model || item.name || "",
          quantity: item.quantity || item.qty || ""
        }));
      }
    }
    return sendJson(res, 200, {
      roleAccess: buildRoleAccess(role),
      detail: payload
    });
  }

  const poDecisionMatch = pathname.match(/^\/api\/internal\/customer-pos\/([^/]+)\/decision$/);
  if (req.method === "POST" && poDecisionMatch) {
    if (!roleCan(role, "poReviewQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot make PO review decisions" });
    }
    return readJson(req).then((payload) => {
      const decision = String(payload.decision || "").trim().toLowerCase();
      if (!["approve", "hold", "reject"].includes(decision)) {
        return badRequest(res, "Decision must be approve, hold, or reject");
      }
      const store = loadStore();
      const customerPO = store.customerPOs.find((entry) => entry.id === poDecisionMatch[1]);
      if (!customerPO) return notFound(res);
      const order = store.orders.find((entry) => entry.id === customerPO.orderId) || null;
      const quotation = store.quotations.find((entry) => entry.id === customerPO.quotationId) || null;
      const pi = store.proformaInvoices.find((entry) => entry.id === customerPO.piId) || null;
      const workflowCase = findWorkflowCaseByRefs(store, {
        customerPoId: customerPO.id,
        orderId: order ? order.id : null,
        piId: pi ? pi.id : null,
        quotationId: quotation ? quotation.id : null
      });
      const note = firstNonEmpty(payload.note, payload.reason);
      const executionLocked = order && ["confirmed", "in_production", "ready_to_ship", "shipped", "completed"].includes(order.status);

      if (executionLocked) {
        return badRequest(res, "PO review is locked because execution has already started");
      }

      let result = { customerPO, order };

      if (decision === "approve") {
        if (!workflowCase) return badRequest(res, "Linked workflow case not found");
        customerPO.status = "approved";
        customerPO.updatedAt = nowIso();
        if (order) {
          order.status = "draft";
          order.customerVisibleStatus = "PO Approved";
          order.updatedAt = nowIso();
        }
        if (quotation) {
          quotation.status = "approved";
          quotation.updatedAt = nowIso();
        }
        if (pi) {
          pi.status = "confirmed";
          pi.updatedAt = nowIso();
        }
        const reviewTask = findPendingAgentTask(store, workflowCase.id, "po_review");
        if (reviewTask) {
          completeAgentTask(store, reviewTask, {
            status: "completed",
            result: note || "PO matches commercial documents and can move to deposit confirmation.",
            recommendedNextStep: "Wait for deposit confirmation before production release."
          });
        }
        queueWorkflowTransition(
          store,
          workflowCase,
          "po_approved",
          note || "PO reviewed and approved as matching the quotation and PI.",
          "Confirm deposit receipt and archive proof before manager release."
        );
        pushTimeline(store, {
          entityType: "customer_po",
          entityId: customerPO.id,
          visibility: "internal",
          type: "po_review_approved",
          message: note || "PO approved for deposit confirmation and later production release"
        });
      }

      if (decision === "hold") {
        customerPO.status = "revised";
        customerPO.updatedAt = nowIso();
        if (order) {
          order.status = "draft";
          order.customerVisibleStatus = "PO Under Review";
          order.updatedAt = nowIso();
        }
        if (quotation) {
          quotation.status = "pending_customer_confirmation";
          quotation.updatedAt = nowIso();
        }
        if (pi) {
          pi.status = "pending_customer_confirmation";
          pi.updatedAt = nowIso();
        }
        if (workflowCase) {
          setWorkflowBlocking(workflowCase, [note || "PO held for clarification or revision"], "blocked");
          const reviewTask = findPendingAgentTask(store, workflowCase.id, "po_review");
          if (reviewTask) {
            completeAgentTask(store, reviewTask, {
              status: "blocked",
              result: note || "PO held pending clarification.",
              blockingIssues: [note || "Clarification required before approval."]
            });
          }
          pushAuditEvent(store, createId, workflowCase.id, "po_review_hold", note || "PO held for clarification.");
        }
        pushTimeline(store, {
          entityType: "customer_po",
          entityId: customerPO.id,
          visibility: "internal",
          type: "po_review_hold",
          message: note || "PO held for clarification or revision"
        });
      }

      if (decision === "reject") {
        customerPO.status = "rejected";
        customerPO.updatedAt = nowIso();
        if (order) {
          order.status = "draft";
          order.customerVisibleStatus = "PO Review Pending";
          order.updatedAt = nowIso();
        }
        if (workflowCase) {
          setWorkflowBlocking(workflowCase, [note || "PO rejected and needs customer resubmission"], "blocked");
          const reviewTask = findPendingAgentTask(store, workflowCase.id, "po_review");
          if (reviewTask) {
            completeAgentTask(store, reviewTask, {
              status: "blocked",
              result: note || "PO rejected.",
              blockingIssues: [note || "Customer PO rejected."]
            });
          }
          pushAuditEvent(store, createId, workflowCase.id, "po_review_rejected", note || "PO rejected.");
        }
        pushTimeline(store, {
          entityType: "customer_po",
          entityId: customerPO.id,
          visibility: "internal",
          type: "po_review_rejected",
          message: note || "PO rejected and not released to execution"
        });
      }

      saveStore(store);
      return sendJson(res, 200, {
        decision,
        note,
        detail: internalPOReviewDetail(store, customerPO.id),
        roleAccess: buildRoleAccess(role)
      });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderExecutionMatch = pathname.match(/^\/api\/orders\/([^/]+)\/execution$/);
  if (req.method === "GET" && orderExecutionMatch) {
    const store = loadStore();
    const payload = executionPayloadForOrder(store, orderExecutionMatch[1]);
    if (!payload) return notFound(res);
    return sendJson(res, 200, payload);
  }

  const orderConfirmMatch = pathname.match(/^\/api\/orders\/([^/]+)\/confirm$/);
  if (req.method === "POST" && orderConfirmMatch) {
    if (!roleCan(role, "financeSignoffQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot directly confirm order execution" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderConfirmMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      if (workflowCase.internalWorkflowStage !== "finance_signoff_completed") {
        return badRequest(res, "Finance sign-off must be completed before execution can be confirmed");
      }
      const result = confirmOrderExecution(store, order, payload.note);
      saveStore(store);
      return sendJson(res, 200, result);
    }).catch((error) => badRequest(res, error.message));
  }

  const depositConfirmMatch = pathname.match(/^\/api\/orders\/([^/]+)\/deposit-confirm$/);
  if (req.method === "POST" && depositConfirmMatch) {
    if (!roleCan(role, "depositConfirmationQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot confirm deposit" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === depositConfirmMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const depositTask = findPendingAgentTask(store, workflowCase.id, "finance_deposit");
      if (!depositTask) return badRequest(res, "No pending deposit confirmation task");
      const payment = createPaymentRecord(store, createId, workflowCase, {
        kind: "deposit",
        amount: payload.amount || "",
        currency: payload.currency || "USD",
        status: "confirmed",
        confirmedByRole: role,
        note: payload.note || ""
      });
      completeAgentTask(store, depositTask, {
        status: "completed",
        result: payload.note || "Deposit confirmed and archived.",
        recommendedNextStep: "Request manager production release."
      });
      order.customerVisibleStatus = "Deposit Confirmed";
      order.updatedAt = nowIso();
      stageWorkflow(store, workflowCase, "deposit_confirmed", payload.note || "Deposit confirmed by finance.");
      ensureApprovalTask(
        store,
        workflowCase,
        "manager_release",
        "Deposit confirmed. Manager release is required before production planning.",
        { orderId: order.id }
      );
      pushAuditEvent(store, createId, workflowCase.id, "deposit_confirmed", "Deposit confirmation recorded.", {
        paymentRecordId: payment.id
      });
      saveStore(store);
      return sendJson(res, 200, { paymentRecord: payment, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const managerReleaseMatch = pathname.match(/^\/api\/orders\/([^/]+)\/manager-release$/);
  if (req.method === "POST" && managerReleaseMatch) {
    if (!roleCan(role, "managerReleaseQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot release production" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === managerReleaseMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const approval = findPendingApprovalTask(store, workflowCase.id, "manager_release");
      if (!approval) return badRequest(res, "No pending manager release approval");
      approval.status = "approved";
      approval.note = payload.note || "";
      approval.updatedAt = nowIso();
      approval.completedAt = nowIso();
      queueWorkflowTransition(
        store,
        workflowCase,
        "production_released",
        payload.note || "Manager approved release to production planning.",
        "Match inventory and generate any material gap list."
      );
      pushAuditEvent(store, createId, workflowCase.id, "manager_release_approved", "Manager release approved.", {
        approvalTaskId: approval.id
      });
      saveStore(store);
      return sendJson(res, 200, { approvalTask: approval, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const inventoryMatch = pathname.match(/^\/api\/orders\/([^/]+)\/inventory-match$/);
  if (req.method === "POST" && inventoryMatch) {
    if (!roleCan(role, "inventoryMaterialQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot submit inventory match results" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === inventoryMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const planningTask = findPendingAgentTask(store, workflowCase.id, "production_planning");
      if (!planningTask) return badRequest(res, "No pending production planning task");
      const inventoryRecord = {
        id: createId("inv"),
        workflowCaseId: workflowCase.id,
        orderId: order.id,
        stockMatchStatus: payload.stockMatchStatus || "partial",
        note: payload.note || "",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.inventoryMatches.push(inventoryRecord);
      const materials = Array.isArray(payload.materials) ? payload.materials : [];
      materials.forEach((item) => {
        store.materialRequests.push({
          id: createId("mat"),
          workflowCaseId: workflowCase.id,
          orderId: order.id,
          materialName: item.materialName || item.name || "",
          quantity: item.quantity || "",
          status: item.status || "pending_review",
          note: item.note || "",
          createdAt: nowIso(),
          updatedAt: nowIso()
        });
      });
      completeAgentTask(store, planningTask, {
        status: "completed",
        result: payload.note || "Inventory checked and material list prepared.",
        recommendedNextStep: "Manager cost review is required.",
        attachments: materials.map((item) => item.materialName || item.name || "").filter(Boolean)
      });
      stageWorkflow(store, workflowCase, "inventory_matched_material_gap_identified", payload.note || "Inventory matched and material gap list recorded.");
      ensureApprovalTask(
        store,
        workflowCase,
        "cost_review",
        "Inventory and material requirements are ready for cost review.",
        { orderId: order.id }
      );
      pushAuditEvent(store, createId, workflowCase.id, "inventory_match_recorded", "Inventory match completed.", {
        inventoryMatchId: inventoryRecord.id
      });
      saveStore(store);
      return sendJson(res, 200, { inventoryMatch: inventoryRecord, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const costReviewMatch = pathname.match(/^\/api\/orders\/([^/]+)\/cost-review$/);
  if (req.method === "POST" && costReviewMatch) {
    if (!roleCan(role, "costReviewQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot submit cost review" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === costReviewMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const approval = findPendingApprovalTask(store, workflowCase.id, "cost_review");
      if (!approval) return badRequest(res, "No pending cost review approval");
      const review = {
        id: createId("cost"),
        workflowCaseId: workflowCase.id,
        orderId: order.id,
        decision: payload.decision || "approved",
        note: payload.note || "",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.costReviews.push(review);
      approval.status = payload.decision === "return" ? "returned" : "approved";
      approval.note = payload.note || "";
      approval.updatedAt = nowIso();
      approval.completedAt = nowIso();
      if (payload.decision === "return") {
        setWorkflowBlocking(workflowCase, [payload.note || "Cost review returned for revision"], "blocked");
      } else {
        stageWorkflow(store, workflowCase, "cost_reviewed", payload.note || "Cost review approved.");
        ensureApprovalTask(
          store,
          workflowCase,
          "finance_signoff",
          "Cost review completed. Finance sign-off is required before execution opens.",
          { orderId: order.id }
        );
      }
      pushAuditEvent(store, createId, workflowCase.id, "cost_review_completed", "Cost review updated.", {
        costReviewId: review.id
      });
      saveStore(store);
      return sendJson(res, 200, { costReview: review, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const financeSignoffMatch = pathname.match(/^\/api\/orders\/([^/]+)\/finance-signoff$/);
  if (req.method === "POST" && financeSignoffMatch) {
    if (!roleCan(role, "financeSignoffQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot complete finance sign-off" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === financeSignoffMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const approval = findPendingApprovalTask(store, workflowCase.id, "finance_signoff");
      if (!approval) return badRequest(res, "No pending finance sign-off approval");
      const signoff = {
        id: createId("fap"),
        workflowCaseId: workflowCase.id,
        orderId: order.id,
        note: payload.note || "",
        pdfName: payload.pdfName || "",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.financeApprovals.push(signoff);
      approval.status = "approved";
      approval.note = payload.note || "";
      approval.updatedAt = nowIso();
      approval.completedAt = nowIso();
      stageWorkflow(store, workflowCase, "finance_signoff_completed", payload.note || "Finance sign-off completed.");
      const executionResult = confirmOrderExecution(store, order, payload.note || "Finance sign-off completed. Order released to execution.");
      createAgentTask(
        store,
        createId,
        workflowCase,
        "production_execution",
        "finance_signoff_completed",
        "Production may start after finance sign-off and internal release."
      );
      createDocumentVersion(store, createId, workflowCase, {
        relatedEntityType: "finance_signoff",
        relatedEntityId: signoff.id,
        kind: "finance_signoff_pdf",
        fileName: payload.pdfName || `finance-signoff-${order.id}.pdf`,
        visibility: "internal",
        deliveryChannel: "internal"
      });
      pushAuditEvent(store, createId, workflowCase.id, "finance_signoff_completed", "Finance sign-off completed and execution opened.", {
        financeApprovalId: signoff.id
      });
      saveStore(store);
      return sendJson(res, 200, { financeApproval: signoff, execution: executionResult, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const balanceConfirmMatch = pathname.match(/^\/api\/orders\/([^/]+)\/balance-confirm$/);
  if (req.method === "POST" && balanceConfirmMatch) {
    if (!roleCan(role, "balanceReleaseQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot confirm balance payment" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === balanceConfirmMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const balanceTask = findPendingAgentTask(store, workflowCase.id, "balance_collection");
      if (!balanceTask) return badRequest(res, "No pending balance collection task");
      const payment = createPaymentRecord(store, createId, workflowCase, {
        kind: "balance",
        amount: payload.amount || "",
        currency: payload.currency || "USD",
        status: "confirmed",
        confirmedByRole: role,
        note: payload.note || ""
      });
      completeAgentTask(store, balanceTask, {
        status: "completed",
        result: payload.note || "Balance confirmed.",
        recommendedNextStep: "Approve BL release."
      });
      order.customerVisibleStatus = "Balance Confirmed";
      order.updatedAt = nowIso();
      stageWorkflow(store, workflowCase, "balance_confirmed", payload.note || "Balance payment confirmed.");
      ensureApprovalTask(store, workflowCase, "bl_release", "Balance confirmed. BL release approval is now open.", {
        orderId: order.id
      });
      saveStore(store);
      return sendJson(res, 200, { paymentRecord: payment, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const blReleaseMatch = pathname.match(/^\/api\/orders\/([^/]+)\/bl-release$/);
  if (req.method === "POST" && blReleaseMatch) {
    if (!roleCan(role, "balanceReleaseQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot release BL" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === blReleaseMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const approval = findPendingApprovalTask(store, workflowCase.id, "bl_release");
      if (!approval) return badRequest(res, "No pending BL release approval");
      approval.status = "approved";
      approval.note = payload.note || "";
      approval.updatedAt = nowIso();
      approval.completedAt = nowIso();
      stageWorkflow(store, workflowCase, "bl_released", payload.note || "BL release approved after balance confirmation.");
      order.status = "completed";
      order.customerVisibleStatus = "Completed";
      order.updatedAt = nowIso();
      createDocumentVersion(store, createId, workflowCase, {
        relatedEntityType: "order",
        relatedEntityId: order.id,
        kind: "bl_release",
        fileName: payload.fileName || `bl-${order.id}.pdf`,
        visibility: "customer",
        deliveryChannel: "email"
      });
      createNotificationJob(store, createId, workflowCase, {
        channel: "email",
        type: "bl_release",
        recipientRole: "customer",
        subject: `BL release for order ${order.id}`,
        bodyPreview: "Balance confirmed and BL release approved.",
        status: "queued",
        triggeredByAgent: "bl_release"
      });
      closeWorkflowCase(store, workflowCase, "Order closed after BL release and final payment settlement.");
      pushAuditEvent(store, createId, workflowCase.id, "order_closed", "Workflow closed after final settlement and BL release.", {
        orderId: order.id,
        approvalTaskId: approval.id
      });
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: "customer",
        type: "order_closed",
        message: payload.note || "Final payment cleared and BL release completed."
      });
      saveStore(store);
      return sendJson(res, 200, { approvalTask: approval, workflowCase, order });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (req.method === "PATCH" && orderStatusMatch) {
    if (!roleCan(role, "orderExecution", "update")) {
      return sendJson(res, 403, { error: "Role cannot update order status" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderStatusMatch[1]);
      if (!order) return notFound(res);
      if (!ORDER_STATUSES.has(payload.status)) {
        return badRequest(res, "Invalid order status");
      }
      if (["confirmed", "in_production", "ready_to_ship", "shipped", "completed"].includes(payload.status)) {
        return badRequest(res, "Use the workflow-controlled order endpoints for execution, shipment, and settlement status changes");
      }
      order.status = payload.status;
      order.customerVisibleStatus = payload.customerVisibleStatus || order.customerVisibleStatus || payload.status;
      if (payload.docsStatus && DOC_STATUSES.has(payload.docsStatus)) {
        order.docsStatus = payload.docsStatus;
      }
      order.updatedAt = nowIso();
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: payload.customerVisible ? "customer" : "internal",
        type: "order_status_updated",
        message: payload.note || `Order status updated to ${payload.status}`
      });
      saveStore(store);
      return sendJson(res, 200, { order });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderProductionMatch = pathname.match(/^\/api\/orders\/([^/]+)\/production$/);
  if (req.method === "PATCH" && orderProductionMatch) {
    if (!roleCan(role, "productionQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot update production progress" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderProductionMatch[1]);
      if (!order) return notFound(res);
      if (!PRODUCTION_STATUSES.has(payload.status)) {
        return badRequest(res, "Invalid production status");
      }
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      if (payload.status === "in_progress" && !["finance_signoff_completed", "production_in_progress"].includes(workflowCase.internalWorkflowStage)) {
        return badRequest(res, "Finance sign-off must be completed before production can start");
      }
      if (payload.status === "completed" && workflowCase.internalWorkflowStage !== "production_in_progress") {
        return badRequest(res, "Production must be in progress before it can be completed");
      }
      const execution = ensureExecutionArtifacts(store, order);
      execution.productionTask.status = payload.status;
      execution.productionTask.plannedStartDate = payload.plannedStartDate || execution.productionTask.plannedStartDate;
      execution.productionTask.plannedFinishDate = payload.plannedFinishDate || execution.productionTask.plannedFinishDate;
      execution.productionTask.notes = payload.notes || execution.productionTask.notes;
      execution.productionTask.updatedAt = nowIso();
      order.productionStatus = payload.status;
      order.updatedAt = nowIso();
      if (workflowCase) {
        const productionTask = findPendingAgentTask(store, workflowCase.id, "production_execution");
        if (payload.status === "in_progress") {
          if (productionTask) {
            productionTask.status = "in_progress";
            productionTask.updatedAt = nowIso();
          }
          stageWorkflow(store, workflowCase, "production_in_progress", payload.timelineMessage || "Production moved into progress.");
          order.status = "in_production";
          order.customerVisibleStatus = "In Production";
        }
        if (payload.status === "completed") {
          if (productionTask) {
            completeAgentTask(store, productionTask, {
              status: "completed",
              result: payload.timelineMessage || "Production completed.",
              recommendedNextStep: "Prepare shipment, booking, and customs documents."
            });
          }
          stageWorkflow(store, workflowCase, "production_completed", payload.timelineMessage || "Production completed.");
          stageWorkflow(store, workflowCase, "ready_to_ship", "Order is ready to move into shipping and customs preparation.");
          order.status = "ready_to_ship";
          order.customerVisibleStatus = "Ready to Ship";
          queueNextAgentTask(
            store,
            workflowCase,
            "ready_to_ship",
            "Arrange booking, trucking, customs documents, and shipment readiness."
          );
        }
      }
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: payload.customerVisible ? "customer" : "internal",
        type: "production_status_updated",
        message: payload.timelineMessage || `Production status updated to ${payload.status}`
      });
      saveStore(store);
      return sendJson(res, 200, {
        order,
        productionTask: execution.productionTask
      });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderDocsMatch = pathname.match(/^\/api\/orders\/([^/]+)\/docs$/);
  if (req.method === "PATCH" && orderDocsMatch) {
    if (!roleCan(role, "shippingCustomsQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot update export document status" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderDocsMatch[1]);
      if (!order) return notFound(res);
      if (!DOC_STATUSES.has(payload.status)) {
        return badRequest(res, "Invalid docs status");
      }
      const execution = ensureExecutionArtifacts(store, order);
      execution.exportDocumentPack.status = payload.status;
      execution.exportDocumentPack.notes = payload.notes || execution.exportDocumentPack.notes;
      if (Array.isArray(payload.preparedDocuments)) {
        execution.exportDocumentPack.preparedDocuments = payload.preparedDocuments;
      }
      execution.exportDocumentPack.updatedAt = nowIso();
      order.docsStatus = payload.status;
      order.updatedAt = nowIso();
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (workflowCase && Array.isArray(payload.preparedDocuments) && payload.preparedDocuments.length) {
        payload.preparedDocuments.forEach((kind) => {
          createDocumentVersion(store, createId, workflowCase, {
            relatedEntityType: "order",
            relatedEntityId: order.id,
            kind,
            fileName: `${kind}-${order.id}.pdf`,
            visibility: payload.customerVisible ? "customer" : "internal",
            deliveryChannel: "internal"
          });
        });
      }
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: payload.customerVisible ? "customer" : "internal",
        type: "docs_status_updated",
        message: payload.timelineMessage || `Document status updated to ${payload.status}`
      });
      saveStore(store);
      return sendJson(res, 200, {
        order,
        exportDocumentPack: execution.exportDocumentPack
      });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderShippingMatch = pathname.match(/^\/api\/orders\/([^/]+)\/shipping$/);
  if (req.method === "PATCH" && orderShippingMatch) {
    if (!roleCan(role, "shippingCustomsQueue", "update")) {
      return sendJson(res, 403, { error: "Role cannot update shipment status" });
    }
    return readJson(req).then((payload) => {
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderShippingMatch[1]);
      if (!order) return notFound(res);
      if (!SHIPPING_STATUSES.has(payload.status)) {
        return badRequest(res, "Invalid shipping status");
      }
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      if (payload.status === "shipped" && workflowCase.internalWorkflowStage !== "ready_to_ship") {
        return badRequest(res, "Order must be ready to ship before it can be marked on board");
      }
      const execution = ensureExecutionArtifacts(store, order);
      execution.shippingPlan.status = payload.status;
      execution.shippingPlan.shipmentWindow = payload.shipmentWindow || execution.shippingPlan.shipmentWindow;
      execution.shippingPlan.bookingReference = payload.bookingReference || execution.shippingPlan.bookingReference;
      execution.shippingPlan.notes = payload.notes || execution.shippingPlan.notes;
      if (typeof payload.packagingConfirmed === "boolean") {
        execution.shippingPlan.packagingConfirmed = payload.packagingConfirmed;
      }
      if (typeof payload.marksConfirmed === "boolean") {
        execution.shippingPlan.marksConfirmed = payload.marksConfirmed;
      }
      execution.shippingPlan.updatedAt = nowIso();
      order.updatedAt = nowIso();
      if (workflowCase && payload.status === "shipped") {
        const shippingTask = findPendingAgentTask(store, workflowCase.id, "shipping_customs");
        if (shippingTask) {
          completeAgentTask(store, shippingTask, {
            status: "completed",
            result: payload.timelineMessage || "Goods are on board and shipping execution has started.",
            recommendedNextStep: "Open balance collection and BL release control."
          });
        }
        stageWorkflow(store, workflowCase, "on_board", payload.timelineMessage || "Goods are on board.");
        stageWorkflow(store, workflowCase, "balance_collection_open", "Open balance collection before BL release.");
        order.status = "shipped";
        order.customerVisibleStatus = "On Board";
        order.updatedAt = nowIso();
        queueNextAgentTask(
          store,
          workflowCase,
          "on_board",
          "Collect balance, notify finance and management, and keep BL release blocked until payment clears."
        );
        createNotificationJob(store, createId, workflowCase, {
          channel: "email",
          type: "on_board_notice",
          recipientRole: "finance",
          subject: `Goods on board for order ${order.id}`,
          bodyPreview: "Shipment is on board. Balance collection should now be monitored.",
          status: "queued",
          triggeredByAgent: "shipping_customs"
        });
      }
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: payload.customerVisible ? "customer" : "internal",
        type: "shipping_status_updated",
        message: payload.timelineMessage || `Shipping status updated to ${payload.status}`
      });
      saveStore(store);
      return sendJson(res, 200, {
        order,
        shippingPlan: execution.shippingPlan
      });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderFilesMatch = pathname.match(/^\/api\/orders\/([^/]+)\/files$/);
  if (req.method === "POST" && orderFilesMatch) {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, payload.uploadId ? ["kind", "name"] : ["kind", "name", "url"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderFilesMatch[1]);
      if (!order) return notFound(res);
      let resolvedUrl = payload.url;
      if (!resolvedUrl && payload.uploadId) {
        const upload = store.uploads.find((entry) => entry.id === payload.uploadId);
        if (!upload) return badRequest(res, "Upload not found");
        resolvedUrl = upload.publicPath;
      }
      const fileRecord = {
        id: createId("file"),
        orderId: order.id,
        customerId: order.customerId,
        kind: payload.kind,
        name: payload.name,
        url: resolvedUrl,
        visibility: payload.visibility === "customer" ? "customer" : "internal",
        uploadId: payload.uploadId || null,
        createdAt: nowIso()
      };
      store.files.push(fileRecord);
      pushTimeline(store, {
        entityType: "order",
        entityId: order.id,
        visibility: fileRecord.visibility,
        type: "file_attached",
        message: `${fileRecord.kind} file attached`
      });
      saveStore(store);
      return sendJson(res, 201, { file: fileRecord });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderDocumentsSendMatch = pathname.match(/^\/api\/orders\/([^/]+)\/documents\/send$/);
  if (req.method === "POST" && orderDocumentsSendMatch) {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["kind"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderDocumentsSendMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const documentVersion = createDocumentVersion(store, createId, workflowCase, {
        relatedEntityType: "order",
        relatedEntityId: order.id,
        kind: payload.kind,
        fileName: payload.fileName || `${payload.kind}-${order.id}.pdf`,
        url: payload.url || "",
        visibility: payload.visibility || "customer",
        deliveryChannel: payload.deliveryChannel || "email",
        sentTo: Array.isArray(payload.sentTo) ? payload.sentTo : [],
        emailSubject: payload.emailSubject || ""
      });
      saveStore(store);
      return sendJson(res, 201, { documentVersion });
    }).catch((error) => badRequest(res, error.message));
  }

  const orderNotificationSendMatch = pathname.match(/^\/api\/orders\/([^/]+)\/notifications\/send$/);
  if (req.method === "POST" && orderNotificationSendMatch) {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["type"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const order = store.orders.find((entry) => entry.id === orderNotificationSendMatch[1]);
      if (!order) return notFound(res);
      const workflowCase = findWorkflowCaseByRefs(store, { orderId: order.id });
      if (!workflowCase) return badRequest(res, "Workflow case not found");
      const notification = createNotificationJob(store, createId, workflowCase, {
        channel: payload.channel || "email",
        type: payload.type,
        recipientRole: payload.recipientRole || "",
        recipientEmail: payload.recipientEmail || "",
        subject: payload.subject || "",
        bodyPreview: payload.bodyPreview || "",
        status: payload.status || "queued",
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        triggeredByAgent: payload.triggeredByAgent || workflowCase.currentAgentKey || "orchestrator"
      });
      saveStore(store);
      return sendJson(res, 201, { notification });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "POST" && pathname === "/api/uploads") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["fileName", "contentBase64"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const upload = writeBase64Upload(payload);
      store.uploads.push(upload);
      saveStore(store);
      return sendJson(res, 201, { upload });
    }).catch((error) => badRequest(res, error.message));
  }

  const portalMatch = pathname.match(/^\/portal\/orders\/([^/]+)$/);
  if (req.method === "GET" && portalMatch) {
    const store = loadStore();
    const payload = publicPortalPayload(store, portalMatch[1]);
    if (!payload) return notFound(res);
    return sendJson(res, 200, payload);
  }

  const portalPoMatch = pathname.match(/^\/portal\/orders\/([^/]+)\/po$/);
  if (req.method === "POST" && portalPoMatch) {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["poNumber"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const access = resolvePortalAccess(store, portalPoMatch[1]);
      if (!access) return notFound(res);
      const result = createCustomerPO(store, {
        quotationId: access.quotation ? access.quotation.id : null,
        piId: access.pi ? access.pi.id : null,
        poNumber: payload.poNumber,
        version: payload.version,
        quantitySummary: payload.quantitySummary,
        packagingNotes: payload.packagingNotes,
        priceNotes: payload.priceNotes,
        leadTimeNotes: payload.leadTimeNotes,
        tradeTerms: payload.tradeTerms,
        attachments: payload.attachments,
        note: payload.note
      }, "customer_portal");
      if (result.error) return badRequest(res, result.error);
      saveStore(store);
      return sendJson(res, 201, result);
    }).catch((error) => badRequest(res, error.message));
  }

  const portalMessageMatch = pathname.match(/^\/portal\/orders\/([^/]+)\/messages$/);
  if (req.method === "POST" && portalMessageMatch) {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["message"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const access = resolvePortalAccess(store, portalMessageMatch[1]);
      if (!access) return notFound(res);
      const message = {
        id: createId("msg"),
        customerId: access.customer.id,
        quotationId: access.quotation ? access.quotation.id : null,
        orderId: access.order ? access.order.id : null,
        channel: "customer_portal",
        authorRole: "customer",
        message: payload.message,
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        createdAt: nowIso()
      };
      store.messages.push(message);
      pushTimeline(store, {
        entityType: access.order ? "order" : "quotation",
        entityId: access.order ? access.order.id : access.quotation.id,
        visibility: "internal",
        type: "customer_message_received",
        message: "Customer left a portal message"
      });
      saveStore(store);
      return sendJson(res, 201, { message });
    }).catch((error) => badRequest(res, error.message));
  }

  const portalFilesMatch = pathname.match(/^\/portal\/orders\/([^/]+)\/files$/);
  if (req.method === "GET" && portalFilesMatch) {
    const store = loadStore();
    const access = resolvePortalAccess(store, portalFilesMatch[1]);
    if (!access) return notFound(res);
    return sendJson(res, 200, { files: access.files });
  }

  if (req.method === "GET" && pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "richland-ops-backend" });
  }

  if (req.method === "POST" && pathname === "/api/inquiries") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, [
        "targetCategory",
        "estimatedQuantity",
        "destinationMarket",
        "cooperationMode",
        "companyName",
        "email",
        "contactPerson",
        "message"
      ]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const inquiry = createInquiry(store, payload);
      saveStore(store);
      return sendJson(res, 201, { inquiry });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "GET" && pathname === "/api/inquiries") {
    const store = loadStore();
    return sendJson(res, 200, { inquiries: store.inquiries });
  }

  if (req.method === "GET" && pathname === "/api/internal/ops-overview") {
    const store = loadStore();
    return sendJson(res, 200, summarizeInternalOverview(store, role));
  }

  if (req.method === "GET" && pathname === "/api/internal/roles") {
    return sendJson(res, 200, {
      activeRole: buildRoleAccess(role),
      availableRoles: listRoles()
    });
  }

  if (req.method === "GET" && pathname === "/api/workflows") {
    const store = loadStore();
    return sendJson(res, 200, {
      workflowCases: store.workflowCases || [],
      workflowStages: store.workflowStages || [],
      agentTasks: store.agentTasks || [],
      approvalTasks: store.approvalTasks || [],
      paymentRecords: store.paymentRecords || [],
      documentVersions: store.documentVersions || [],
      notificationJobs: store.notificationJobs || [],
      auditEvents: store.auditEvents || []
    });
  }

  const workflowDispatchMatch = pathname.match(/^\/api\/workflows\/([^/]+)\/dispatch$/);
  if (req.method === "POST" && workflowDispatchMatch) {
    return readJson(req).then((payload) => {
      const store = loadStore();
      const workflowCase = findWorkflowCaseByRefs(store, { workflowCaseId: workflowDispatchMatch[1] });
      if (!workflowCase) return notFound(res);
      const agentKey = payload.agentKey || resolveNextAgent(workflowCase.internalWorkflowStage);
      if (!agentKey || !AGENTS[agentKey]) {
        return badRequest(res, "No dispatchable next agent for this workflow stage");
      }
      const task = createAgentTask(
        store,
        createId,
        workflowCase,
        agentKey,
        workflowCase.internalWorkflowStage,
        payload.inputSummary || `Dispatch from ${workflowCase.internalWorkflowStage}`
      );
      pushAuditEvent(store, createId, workflowCase.id, "agent_dispatched", `Workflow dispatched to ${agentKey}.`, {
        agentTaskId: task.id
      });
      saveStore(store);
      return sendJson(res, 201, { agentTask: task, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const agentTaskCompleteMatch = pathname.match(/^\/api\/agent-tasks\/([^/]+)\/complete$/);
  if (req.method === "POST" && agentTaskCompleteMatch) {
    return readJson(req).then((payload) => {
      const store = loadStore();
      const task = (store.agentTasks || []).find((entry) => entry.id === agentTaskCompleteMatch[1]);
      if (!task) return notFound(res);
      completeAgentTask(store, task, {
        status: payload.status || "completed",
        result: payload.result || "",
        recommendedNextStep: payload.recommendedNextStep || "",
        blockingIssues: payload.blockingIssues || [],
        requiresHumanApproval: payload.requiresHumanApproval,
        attachments: payload.attachments || []
      });
      const workflowCase = findWorkflowCaseByRefs(store, { workflowCaseId: task.workflowCaseId });
      if (workflowCase && payload.blockingIssues && payload.blockingIssues.length) {
        setWorkflowBlocking(workflowCase, payload.blockingIssues, "blocked");
      }
      saveStore(store);
      return sendJson(res, 200, { agentTask: task, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  const approvalApproveMatch = pathname.match(/^\/api\/approval-tasks\/([^/]+)\/approve$/);
  if (req.method === "POST" && approvalApproveMatch) {
    return readJson(req).then((payload) => {
      const store = loadStore();
      const task = (store.approvalTasks || []).find((entry) => entry.id === approvalApproveMatch[1]);
      if (!task) return notFound(res);
      task.status = "approved";
      task.note = payload.note || "";
      task.updatedAt = nowIso();
      task.completedAt = nowIso();
      saveStore(store);
      return sendJson(res, 200, { approvalTask: task });
    }).catch((error) => badRequest(res, error.message));
  }

  const approvalRejectMatch = pathname.match(/^\/api\/approval-tasks\/([^/]+)\/reject$/);
  if (req.method === "POST" && approvalRejectMatch) {
    return readJson(req).then((payload) => {
      const store = loadStore();
      const task = (store.approvalTasks || []).find((entry) => entry.id === approvalRejectMatch[1]);
      if (!task) return notFound(res);
      task.status = "rejected";
      task.note = payload.note || "";
      task.updatedAt = nowIso();
      task.completedAt = nowIso();
      const workflowCase = findWorkflowCaseByRefs(store, { workflowCaseId: task.workflowCaseId });
      if (workflowCase) {
        setWorkflowBlocking(workflowCase, [payload.note || `${task.title} rejected`], "blocked");
      }
      saveStore(store);
      return sendJson(res, 200, { approvalTask: task, workflowCase });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "GET" && pathname === "/api/quotations") {
    const store = loadStore();
    return sendJson(res, 200, { quotations: store.quotations });
  }

  if (req.method === "GET" && pathname === "/api/orders") {
    const store = loadStore();
    return sendJson(res, 200, { orders: store.orders });
  }

  if (req.method === "GET" && pathname === "/api/customer-pos") {
    const store = loadStore();
    return sendJson(res, 200, { customerPOs: store.customerPOs });
  }

  if (req.method === "GET" && pathname === "/api/production-tasks") {
    const store = loadStore();
    return sendJson(res, 200, { productionTasks: store.productionTasks });
  }

  if (req.method === "GET" && pathname === "/api/shipping-plans") {
    const store = loadStore();
    return sendJson(res, 200, { shippingPlans: store.shippingPlans });
  }

  if (req.method === "GET" && pathname === "/api/export-document-packs") {
    const store = loadStore();
    return sendJson(res, 200, { exportDocumentPacks: store.exportDocumentPacks });
  }

  if (req.method === "GET" && pathname === "/api/uploads") {
    const store = loadStore();
    return sendJson(res, 200, { uploads: store.uploads });
  }

  if (req.method === "POST" && pathname === "/api/job-contacts") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["name", "phoneOrWechat", "interestedDirection", "currentBackground", "message"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const jobContact = createJobContact(store, payload);
      saveStore(store);
      return sendJson(res, 201, { jobContact });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "POST" && pathname === "/api/quotations") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["inquiryId"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const quotation = createQuotation(store, payload);
      if (quotation.error) return badRequest(res, quotation.error);
      saveStore(store);
      return sendJson(res, 201, {
        quotation,
        portalPath: `/portal/orders/${quotation.portalToken}`
      });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "POST" && pathname === "/api/pi") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["quotationId"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const pi = createPI(store, payload);
      if (pi.error) return badRequest(res, pi.error);
      saveStore(store);
      return sendJson(res, 201, { pi });
    }).catch((error) => badRequest(res, error.message));
  }

  if (req.method === "POST" && pathname === "/api/customer-pos") {
    return readJson(req).then((payload) => {
      const missing = requireFields(payload, ["poNumber"]);
      if (missing.length) return badRequest(res, `Missing fields: ${missing.join(", ")}`);
      const store = loadStore();
      const result = createCustomerPO(store, payload, "internal_api");
      if (result.error) return badRequest(res, result.error);
      saveStore(store);
      return sendJson(res, 201, result);
    }).catch((error) => badRequest(res, error.message));
  }

  return notFound(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  routeRequest(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`RichLand ops backend listening on http://localhost:${PORT}`);
});
