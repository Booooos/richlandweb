const BASE_URL = (process.env.BASE_URL || "http://localhost:8787").replace(/\/$/, "");

async function request(path, options = {}) {
  const maxAttempts = Number(process.env.SIMULATE_HTTP_ATTEMPTS || 5);
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (error) {
        throw new Error(`Non-JSON response from ${path}: ${text}`);
      }

      if (!response.ok) {
        const canRetry = [503, 504].includes(response.status);
        if (canRetry && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
          continue;
        }
        throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}

async function login(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  return data.token;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function step(label, run) {
  process.stdout.write(`[simulate] ${label}\n`);
  const result = await run();
  process.stdout.write(`[simulate] ${label} ok\n`);
  return result;
}

async function main() {
  await step("health", () => request("/health"));

  const salesToken = await step("login sales", () => login("sales@richland.local", "Richland#Sales2026"));
  const financeToken = await step("login finance", () => login("finance@richland.local", "Richland#Finance2026"));
  const managerToken = await step("login manager", () => login("manager@richland.local", "Richland#Manager2026"));
  const productionToken = await step("login production", () => login("production@richland.local", "Richland#Production2026"));
  const docsToken = await step("login docs", () => login("docs@richland.local", "Richland#Docs2026"));

  const suffix = Date.now();
  const inquiryPayload = {
    source: "website",
    targetCategory: "Pedestal Fans",
    estimatedQuantity: "1 x 40HQ trial order",
    destinationMarket: "UAE",
    cooperationMode: "OEM",
    companyName: "North Gulf Appliances LLC",
    website: "https://north-gulf.example.com",
    email: `procurement+${suffix}@north-gulf.example.com`,
    contactPerson: "Lina Hassan",
    phone: "+971555000111",
    message: "We need pedestal fan quotation with OEM packaging and export carton confirmation."
  };

  const inquiryResult = await step("create inquiry", () => request("/api/inquiries", {
    method: "POST",
    body: JSON.stringify(inquiryPayload)
  }));

  const inquiries = await step("reload inquiries", () => request("/api/inquiries", {
    headers: authHeaders(salesToken)
  }));
  const inquiryRecord = inquiries.inquiries.find((entry) => entry.id === inquiryResult.inquiry.id);
  assert(inquiryRecord, "Created inquiry could not be reloaded.");

  await step("qualify inquiry", () => request(`/api/internal/inquiries/${inquiryRecord.id}/qualify`, {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      note: "Category, market, quantity, and OEM path are clear enough to move into credit review."
    })
  }));

  await step("credit check", () => request(`/api/internal/customers/${inquiryRecord.customerId}/credit-check`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({
      riskLevel: "medium",
      paymentAdvice: "30% deposit before release to production",
      note: "New customer. Deposit must clear before manager release."
    })
  }));

  const quotationResult = await step("create quotation", () => request("/api/quotations", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      inquiryId: inquiryRecord.id,
      version: 1,
      currency: "USD",
      validUntil: "2026-07-31",
      moq: "500 pcs",
      leadTime: "35 days after deposit and artwork confirmation",
      incoterm: "FOB Shunde",
      salesOwner: "Zhihai",
      notes: "OEM color box, English carton marks, UAE market voltage label.",
      items: [
        { model: "A52", quantity: "500 pcs", price: "12.80" },
        { model: "A55", quantity: "300 pcs", price: "13.40" }
      ],
      status: "draft"
    })
  }));

  const piResult = await step("create pi", () => request("/api/pi", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      quotationId: quotationResult.quotation.id,
      paymentTerms: "30% deposit, 70% before BL release",
      tradeTerms: "FOB Shunde",
      notes: "Proceed after sample, carton artwork, and shipping marks confirmation."
    })
  }));

  const poResult = await step("create customer po", () => request("/api/customer-pos", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      piId: piResult.pi.id,
      poNumber: `NGA-PO-${suffix}`,
      version: 1,
      quantitySummary: "A52 x 500 pcs, A55 x 300 pcs",
      packagingNotes: "OEM color box, 5-ply export carton, English shipping marks",
      priceNotes: "As quoted in version 1",
      leadTimeNotes: "35 days after deposit and artwork confirmation",
      tradeTerms: "FOB Shunde",
      attachments: [
        { name: `NGA-PO-${suffix}.pdf`, url: `https://files.example.com/NGA-PO-${suffix}.pdf` }
      ],
      note: "Customer PO submitted after PI review."
    })
  }));

  await step("approve po", () => request(`/api/internal/customer-pos/${poResult.po.id}/decision`, {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      decision: "approve",
      note: "PO matches quotation, PI, quantity, packaging, and trade terms."
    })
  }));

  await step("confirm deposit", () => request(`/api/orders/${poResult.order.id}/deposit-confirm`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({
      amount: "5328",
      currency: "USD",
      note: "Deposit received and archived by finance."
    })
  }));

  await step("manager release", () => request(`/api/orders/${poResult.order.id}/manager-release`, {
    method: "POST",
    headers: authHeaders(managerToken),
    body: JSON.stringify({
      note: "Released to production planning after deposit confirmation."
    })
  }));

  await step("inventory match", () => request(`/api/orders/${poResult.order.id}/inventory-match`, {
    method: "POST",
    headers: authHeaders(productionToken),
    body: JSON.stringify({
      stockMatchStatus: "partial",
      note: "Motor stock is available. Guard mesh and cartons require purchase.",
      materials: [
        { materialName: "Guard mesh", quantity: "800 pcs", note: "Purchase required" },
        { materialName: "Carton box", quantity: "800 sets", note: "Purchase required" }
      ]
    })
  }));

  await step("cost review", () => request(`/api/orders/${poResult.order.id}/cost-review`, {
    method: "POST",
    headers: authHeaders(managerToken),
    body: JSON.stringify({
      decision: "approved",
      note: "Material gap and supporting purchase value approved."
    })
  }));

  await step("finance signoff", () => request(`/api/orders/${poResult.order.id}/finance-signoff`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({
      note: "Finance sign-off completed. Execution can open.",
      pdfName: "finance-signoff.pdf"
    })
  }));

  await step("production in progress", () => request(`/api/orders/${poResult.order.id}/production`, {
    method: "PATCH",
    headers: authHeaders(productionToken),
    body: JSON.stringify({
      status: "in_progress",
      timelineMessage: "Production started on the assembly line."
    })
  }));

  await step("production completed", () => request(`/api/orders/${poResult.order.id}/production`, {
    method: "PATCH",
    headers: authHeaders(productionToken),
    body: JSON.stringify({
      status: "completed",
      timelineMessage: "Production completed and the order is ready for shipment."
    })
  }));

  await step("docs ready", () => request(`/api/orders/${poResult.order.id}/docs`, {
    method: "PATCH",
    headers: authHeaders(docsToken),
    body: JSON.stringify({
      status: "ready",
      preparedDocuments: ["PI", "CI", "PL", "BL draft"],
      notes: "CI, PL, and BL draft are ready for shipment execution."
    })
  }));

  await step("shipping on board", () => request(`/api/orders/${poResult.order.id}/shipping`, {
    method: "PATCH",
    headers: authHeaders(docsToken),
    body: JSON.stringify({
      status: "shipped",
      shipmentWindow: "2026-08-05 to 2026-08-08",
      bookingReference: `BK-HT-${suffix}`,
      packagingConfirmed: true,
      marksConfirmed: true,
      notes: "Container loaded and goods are on board.",
      timelineMessage: "Goods loaded and on board."
    })
  }));

  await step("balance confirm", () => request(`/api/orders/${poResult.order.id}/balance-confirm`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({
      amount: "12432",
      currency: "USD",
      note: "Balance received before BL release."
    })
  }));

  await step("bl release", () => request(`/api/orders/${poResult.order.id}/bl-release`, {
    method: "POST",
    headers: authHeaders(docsToken),
    body: JSON.stringify({
      note: "BL released after balance settlement.",
      fileName: "bl-original.pdf"
    })
  }));

  const workflows = await step("load workflows", () => request("/api/workflows", {
    headers: authHeaders(salesToken)
  }));
  const orders = await step("load orders", () => request("/api/orders", {
    headers: authHeaders(salesToken)
  }));
  const executionView = await step("load execution", () => request(`/api/orders/${poResult.order.id}/execution`, {
    headers: authHeaders(salesToken)
  }));
  const portalView = await step("load portal view", () => request(`/portal/orders/${quotationResult.quotation.portalToken}`));

  const workflowCase = workflows.workflowCases.find((entry) => entry.orderId === poResult.order.id);
  const stages = workflows.workflowStages.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const agentTasks = workflows.agentTasks.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const approvalTasks = workflows.approvalTasks.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const payments = workflows.paymentRecords.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const documents = workflows.documentVersions.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const notifications = workflows.notificationJobs.filter((entry) => entry.workflowCaseId === workflowCase.id);
  const savedOrder = orders.orders.find((entry) => entry.id === poResult.order.id);

  assert(workflowCase, "Workflow case was not created for the order.");
  assert(savedOrder && savedOrder.status === "completed", "Order did not reach completed status.");
  assert(savedOrder.customerVisibleStatus === "Completed", "Customer-visible order status did not close cleanly.");
  assert(workflowCase.internalWorkflowStage === "order_closed", "Workflow did not reach order_closed.");
  assert(workflowCase.status === "closed", "Workflow case did not close.");
  assert(workflowCase.customerMilestoneStatus === "Completed", "Customer milestone did not reach Completed.");
  assert(agentTasks.filter((entry) => ["pending", "blocked", "in_progress"].includes(entry.status)).length === 0, "Pending agent tasks remain.");
  assert(approvalTasks.filter((entry) => entry.status === "pending").length === 0, "Pending approval tasks remain.");
  assert(payments.some((entry) => entry.kind === "deposit" && entry.status === "confirmed"), "Confirmed deposit record missing.");
  assert(payments.some((entry) => entry.kind === "balance" && entry.status === "confirmed"), "Confirmed balance record missing.");
  assert(stages.some((entry) => entry.stageKey === "customer_credit_reviewed"), "Credit review stage missing.");
  assert(stages.some((entry) => entry.stageKey === "finance_signoff_completed"), "Finance sign-off stage missing.");
  assert(stages.some((entry) => entry.stageKey === "on_board"), "On-board stage missing.");
  assert(stages.some((entry) => entry.stageKey === "bl_released"), "BL release stage missing.");
  assert(stages.some((entry) => entry.stageKey === "order_closed"), "Order closed stage missing.");
  assert(documents.some((entry) => entry.kind === "finance_signoff_pdf"), "Finance sign-off document version missing.");
  assert(documents.some((entry) => entry.kind === "bl_release"), "BL release document version missing.");
  assert(notifications.some((entry) => entry.type === "on_board_notice"), "On-board notification record missing.");
  assert(notifications.some((entry) => entry.type === "bl_release"), "BL release notification record missing.");
  assert(Array.isArray(executionView.productionTasks) && executionView.productionTasks[0] && executionView.productionTasks[0].status === "completed", "Production task did not reach completed.");
  assert(Array.isArray(executionView.shippingPlans) && executionView.shippingPlans[0] && executionView.shippingPlans[0].status === "shipped", "Shipping plan did not reach shipped.");
  assert(portalView.order && portalView.order.customerVisibleStatus === "Completed", "Portal did not show the completed customer-facing status.");

  const summary = {
    inquiryId: inquiryRecord.id,
    quotationId: quotationResult.quotation.id,
    piId: piResult.pi.id,
    poId: poResult.po.id,
    orderId: poResult.order.id,
    workflowCaseId: workflowCase.id,
    workflowStage: workflowCase.internalWorkflowStage,
    workflowStatus: workflowCase.status,
    customerMilestoneStatus: workflowCase.customerMilestoneStatus,
    paymentKinds: payments.map((entry) => `${entry.kind}:${entry.status}`),
    approvalStates: approvalTasks.map((entry) => `${entry.approvalType}:${entry.status}`),
    documentKinds: documents.map((entry) => `${entry.kind}:v${entry.version}`),
    notificationTypes: notifications.map((entry) => `${entry.type}:${entry.status}`)
  };

  console.log("Quote-to-settlement simulation completed successfully.");
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
