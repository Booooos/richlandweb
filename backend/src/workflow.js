const { nowIso } = require("./store-shared");

const WORKFLOW_STAGES = {
  inquiry_received: { key: "inquiry_received", label: "Inquiry Received", customerMilestone: "Inquiry Received" },
  inquiry_qualified: { key: "inquiry_qualified", label: "Inquiry Qualified", customerMilestone: "Under Review" },
  customer_credit_reviewed: { key: "customer_credit_reviewed", label: "Customer Credit Reviewed", customerMilestone: "Under Review" },
  quotation_prepared_sent: { key: "quotation_prepared_sent", label: "Quotation Prepared / Sent", customerMilestone: "Quotation Sent" },
  pi_prepared_sent: { key: "pi_prepared_sent", label: "PI Prepared / Sent", customerMilestone: "PI Sent" },
  customer_po_uploaded: { key: "customer_po_uploaded", label: "Customer PO Uploaded", customerMilestone: "PO Under Review" },
  po_approved: { key: "po_approved", label: "PO Approved", customerMilestone: "PO Under Review" },
  deposit_confirmed: { key: "deposit_confirmed", label: "Deposit Confirmed", customerMilestone: "Deposit Confirmed" },
  production_released: { key: "production_released", label: "Production Released", customerMilestone: "Deposit Confirmed" },
  inventory_matched_material_gap_identified: { key: "inventory_matched_material_gap_identified", label: "Inventory Matched / Material Gap Identified", customerMilestone: "Deposit Confirmed" },
  cost_reviewed: { key: "cost_reviewed", label: "Cost Reviewed", customerMilestone: "Deposit Confirmed" },
  finance_signoff_completed: { key: "finance_signoff_completed", label: "Finance Sign-off Completed", customerMilestone: "Deposit Confirmed" },
  production_in_progress: { key: "production_in_progress", label: "Production In Progress", customerMilestone: "In Production" },
  production_completed: { key: "production_completed", label: "Production Completed", customerMilestone: "In Production" },
  ready_to_ship: { key: "ready_to_ship", label: "Ready to Ship", customerMilestone: "Ready to Ship" },
  on_board: { key: "on_board", label: "On Board", customerMilestone: "On Board" },
  balance_collection_open: { key: "balance_collection_open", label: "Balance Collection Open", customerMilestone: "Waiting for Balance" },
  balance_confirmed: { key: "balance_confirmed", label: "Balance Confirmed", customerMilestone: "Balance Confirmed" },
  bl_released: { key: "bl_released", label: "BL Released", customerMilestone: "BL Ready for Release" },
  order_closed: { key: "order_closed", label: "Order Closed", customerMilestone: "Completed" }
};

const AGENTS = {
  orchestrator: { key: "orchestrator", label: "Workflow Orchestrator Agent", owningRole: "admin", queue: "orchestratorOverview" },
  inquiry_intake: { key: "inquiry_intake", label: "Inquiry Intake Agent", owningRole: "sales", queue: "inquiryInbox" },
  sales_qualification: { key: "sales_qualification", label: "Sales Qualification Agent", owningRole: "sales", queue: "inquiryInbox" },
  credit_check: { key: "credit_check", label: "Credit Check Agent", owningRole: "finance", queue: "creditReviewQueue" },
  quotation_preparation: { key: "quotation_preparation", label: "Quotation Agent", owningRole: "sales", queue: "quotationWorkspace" },
  pi_preparation: { key: "pi_preparation", label: "PI Agent", owningRole: "sales", queue: "quotationWorkspace" },
  po_review: { key: "po_review", label: "PO Review Agent", owningRole: "sales", queue: "poReviewQueue" },
  finance_deposit: { key: "finance_deposit", label: "Finance Deposit Agent", owningRole: "finance", queue: "depositConfirmationQueue" },
  manager_release: { key: "manager_release", label: "Manager Release Agent", owningRole: "manager", queue: "managerReleaseQueue" },
  production_planning: { key: "production_planning", label: "Production Planning Agent", owningRole: "production", queue: "inventoryMaterialQueue" },
  cost_review: { key: "cost_review", label: "Cost Review Agent", owningRole: "manager", queue: "costReviewQueue" },
  finance_signoff: { key: "finance_signoff", label: "Finance Sign-off Agent", owningRole: "finance", queue: "financeSignoffQueue" },
  production_execution: { key: "production_execution", label: "Production Execution Agent", owningRole: "production", queue: "productionQueue" },
  shipping_customs: { key: "shipping_customs", label: "Shipping & Customs Agent", owningRole: "documentation", queue: "shippingCustomsQueue" },
  balance_collection: { key: "balance_collection", label: "Balance Collection Agent", owningRole: "finance", queue: "balanceReleaseQueue" },
  bl_release: { key: "bl_release", label: "BL Release Agent", owningRole: "documentation", queue: "balanceReleaseQueue" }
};

const APPROVAL_TYPES = {
  po_approval: { type: "po_approval", title: "PO Approval", owningRole: "sales" },
  manager_release: { type: "manager_release", title: "Manager Production Release", owningRole: "manager" },
  cost_review: { type: "cost_review", title: "Manager Cost Review", owningRole: "manager" },
  finance_signoff: { type: "finance_signoff", title: "Finance Sign-off", owningRole: "finance" },
  bl_release: { type: "bl_release", title: "BL Release Approval", owningRole: "finance" }
};

const STAGE_OWNERS = {
  inquiry_received: { owningRole: "sales", ownerLabel: "Inquiry Intake" },
  inquiry_qualified: { owningRole: "sales", ownerLabel: "Sales Qualification" },
  customer_credit_reviewed: { owningRole: "finance", ownerLabel: "Finance Credit Review" },
  quotation_prepared_sent: { owningRole: "sales", ownerLabel: "Quotation Preparation" },
  pi_prepared_sent: { owningRole: "sales", ownerLabel: "PI Preparation" },
  customer_po_uploaded: { owningRole: "customer", ownerLabel: "Customer PO Upload" },
  po_approved: { owningRole: "sales", ownerLabel: "PO Review" },
  deposit_confirmed: { owningRole: "finance", ownerLabel: "Deposit Confirmation" },
  production_released: { owningRole: "manager", ownerLabel: "Manager Production Release" },
  inventory_matched_material_gap_identified: { owningRole: "production", ownerLabel: "Inventory & Material Planning" },
  cost_reviewed: { owningRole: "manager", ownerLabel: "Cost Review" },
  finance_signoff_completed: { owningRole: "finance", ownerLabel: "Finance Sign-off" },
  production_in_progress: { owningRole: "production", ownerLabel: "Production Execution" },
  production_completed: { owningRole: "production", ownerLabel: "Production Execution" },
  ready_to_ship: { owningRole: "documentation", ownerLabel: "Shipping & Customs" },
  on_board: { owningRole: "documentation", ownerLabel: "Shipping & Customs" },
  balance_collection_open: { owningRole: "finance", ownerLabel: "Balance Collection" },
  balance_confirmed: { owningRole: "finance", ownerLabel: "Balance Confirmation" },
  bl_released: { owningRole: "documentation", ownerLabel: "BL Release" },
  order_closed: { owningRole: "documentation", ownerLabel: "Order Closure" }
};

function getStage(stageKey) {
  return WORKFLOW_STAGES[stageKey] || WORKFLOW_STAGES.inquiry_received;
}

function getAgent(agentKey) {
  return AGENTS[agentKey] || AGENTS.orchestrator;
}

function findWorkflowCase(store, refs) {
  return store.workflowCases.find((entry) => {
    return (
      (refs.workflowCaseId && entry.id === refs.workflowCaseId) ||
      (refs.inquiryId && entry.inquiryId === refs.inquiryId) ||
      (refs.quotationId && entry.quotationId === refs.quotationId) ||
      (refs.piId && entry.piId === refs.piId) ||
      (refs.customerPoId && entry.customerPoId === refs.customerPoId) ||
      (refs.orderId && entry.orderId === refs.orderId)
    );
  }) || null;
}

function createWorkflowCase(store, createId, refs) {
  const workflowCase = {
    id: createId("wf"),
    customerId: refs.customerId || null,
    contactId: refs.contactId || null,
    inquiryId: refs.inquiryId || null,
    quotationId: refs.quotationId || null,
    piId: refs.piId || null,
    customerPoId: refs.customerPoId || null,
    orderId: refs.orderId || null,
    internalWorkflowStage: "inquiry_received",
    customerMilestoneStatus: "Inquiry Received",
    currentAgentKey: "inquiry_intake",
    currentTaskId: null,
    status: "active",
    blockingIssues: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    closedAt: null
  };
  store.workflowCases.push(workflowCase);
  return workflowCase;
}

function linkWorkflowRefs(workflowCase, refs) {
  Object.keys(refs || {}).forEach((key) => {
    if (refs[key]) {
      workflowCase[key] = refs[key];
    }
  });
  workflowCase.updatedAt = nowIso();
}

function pushAuditEvent(store, createId, workflowCaseId, eventType, message, extras) {
  const event = {
    id: createId("audit"),
    workflowCaseId,
    type: eventType,
    message,
    createdAt: nowIso(),
    ...(extras || {})
  };
  store.auditEvents.push(event);
  return event;
}

function createWorkflowStageRecord(store, createId, workflowCase, stageKey, note, extras) {
  const stage = getStage(stageKey);
  const owner = STAGE_OWNERS[stage.key] || {};
  const record = {
    id: createId("wfs"),
    workflowCaseId: workflowCase.id,
    stageKey: stage.key,
    stageLabel: stage.label,
    customerMilestoneStatus: stage.customerMilestone,
    ownerAgentKey: owner.ownerAgentKey || "",
    owningRole: owner.owningRole || "",
    ownerLabel: owner.ownerLabel || "",
    enteredAt: nowIso(),
    completedAt: nowIso(),
    note: note || "",
    attachments: [],
    status: "completed"
  };
  Object.assign(record, extras || {});
  if (!Array.isArray(record.attachments)) {
    record.attachments = [];
  }
  store.workflowStages.push(record);
  workflowCase.internalWorkflowStage = stage.key;
  workflowCase.customerMilestoneStatus = stage.customerMilestone;
  workflowCase.updatedAt = nowIso();
  return record;
}

function createAgentTask(store, createId, workflowCase, agentKey, stageKey, inputSummary, extras) {
  const agent = getAgent(agentKey);
  const task = {
    id: createId("agt"),
    workflowCaseId: workflowCase.id,
    customerId: workflowCase.customerId || null,
    orderId: workflowCase.orderId || null,
    stageKey: stageKey || workflowCase.internalWorkflowStage,
    agentKey: agent.key,
    agentLabel: agent.label,
    queueKey: agent.queue,
    owningRole: agent.owningRole,
    status: "pending",
    inputSummary: inputSummary || "",
    result: "",
    recommendedNextStep: "",
    blockingIssues: [],
    requiresHumanApproval: false,
    attachments: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
    ...(extras || {})
  };
  store.agentTasks.push(task);
  workflowCase.currentAgentKey = task.agentKey;
  workflowCase.currentTaskId = task.id;
  workflowCase.updatedAt = nowIso();
  return task;
}

function completeAgentTask(store, task, payload) {
  task.status = payload.status || "completed";
  task.result = payload.result || task.result || "";
  task.recommendedNextStep = payload.recommendedNextStep || task.recommendedNextStep || "";
  task.blockingIssues = Array.isArray(payload.blockingIssues) ? payload.blockingIssues : [];
  task.requiresHumanApproval = !!payload.requiresHumanApproval;
  task.attachments = Array.isArray(payload.attachments) ? payload.attachments : task.attachments || [];
  task.updatedAt = nowIso();
  task.completedAt = nowIso();
  return task;
}

function createApprovalTask(store, createId, workflowCase, approvalType, summary, extras) {
  const meta = APPROVAL_TYPES[approvalType] || {
    type: approvalType,
    title: approvalType,
    owningRole: "admin"
  };
  const task = {
    id: createId("apv"),
    workflowCaseId: workflowCase.id,
    customerId: workflowCase.customerId || null,
    orderId: workflowCase.orderId || null,
    approvalType: meta.type,
    title: meta.title,
    owningRole: meta.owningRole,
    status: "pending",
    summary: summary || "",
    note: "",
    attachments: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
    ...(extras || {})
  };
  store.approvalTasks.push(task);
  workflowCase.updatedAt = nowIso();
  return task;
}

function resolveNextAgent(stageKey) {
  switch (stageKey) {
    case "inquiry_received":
      return "sales_qualification";
    case "inquiry_qualified":
      return "credit_check";
    case "customer_credit_reviewed":
      return "quotation_preparation";
    case "quotation_prepared_sent":
      return "pi_preparation";
    case "customer_po_uploaded":
      return "po_review";
    case "po_approved":
      return "finance_deposit";
    case "deposit_confirmed":
      return "manager_release";
    case "production_released":
      return "production_planning";
    case "inventory_matched_material_gap_identified":
      return "cost_review";
    case "cost_reviewed":
      return "finance_signoff";
    case "finance_signoff_completed":
      return "production_execution";
    case "ready_to_ship":
      return "shipping_customs";
    case "on_board":
      return "balance_collection";
    case "balance_confirmed":
      return "bl_release";
    default:
      return null;
  }
}

function createNotificationJob(store, createId, workflowCase, payload) {
  const job = {
    id: createId("ntf"),
    workflowCaseId: workflowCase.id,
    customerId: workflowCase.customerId || null,
    orderId: workflowCase.orderId || null,
    channel: payload.channel || "email",
    type: payload.type || "generic",
    recipientRole: payload.recipientRole || "",
    recipientEmail: payload.recipientEmail || "",
    subject: payload.subject || "",
    bodyPreview: payload.bodyPreview || "",
    status: payload.status || "queued",
    triggeredByAgent: payload.triggeredByAgent || workflowCase.currentAgentKey || "orchestrator",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    createdAt: nowIso(),
    sentAt: payload.status === "sent" ? nowIso() : null
  };
  store.notificationJobs.push(job);
  return job;
}

function createDocumentVersion(store, createId, workflowCase, payload) {
  const versionCount = store.documentVersions.filter((entry) => {
    return entry.workflowCaseId === workflowCase.id && entry.kind === payload.kind;
  }).length;
  const entry = {
    id: createId("docv"),
    workflowCaseId: workflowCase.id,
    customerId: workflowCase.customerId || null,
    orderId: workflowCase.orderId || null,
    relatedEntityType: payload.relatedEntityType || "",
    relatedEntityId: payload.relatedEntityId || null,
    kind: payload.kind,
    version: versionCount + 1,
    fileName: payload.fileName || `${payload.kind}-${versionCount + 1}.pdf`,
    url: payload.url || "",
    visibility: payload.visibility || "internal",
    deliveryChannel: payload.deliveryChannel || "internal",
    sentTo: Array.isArray(payload.sentTo) ? payload.sentTo : [],
    emailSubject: payload.emailSubject || "",
    createdAt: nowIso()
  };
  store.documentVersions.push(entry);
  return entry;
}

function createPaymentRecord(store, createId, workflowCase, payload) {
  const payment = {
    id: createId("pay"),
    workflowCaseId: workflowCase.id,
    customerId: workflowCase.customerId || null,
    orderId: workflowCase.orderId || null,
    kind: payload.kind,
    amount: payload.amount || "",
    currency: payload.currency || "USD",
    status: payload.status || "pending",
    confirmedByRole: payload.confirmedByRole || "",
    confirmedByUserId: payload.confirmedByUserId || null,
    proofFileId: payload.proofFileId || null,
    note: payload.note || "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    confirmedAt: payload.status === "confirmed" ? nowIso() : null
  };
  store.paymentRecords.push(payment);
  return payment;
}

function summarizeAgentQueue(store, agentKey) {
  return store.agentTasks.filter((entry) => entry.agentKey === agentKey && ["pending", "blocked", "in_progress"].includes(entry.status));
}

module.exports = {
  WORKFLOW_STAGES,
  AGENTS,
  APPROVAL_TYPES,
  getStage,
  getAgent,
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
  createPaymentRecord,
  summarizeAgentQueue
};
