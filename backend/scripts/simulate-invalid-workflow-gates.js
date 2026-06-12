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
        data = { raw: text };
      }
      if ([503, 504].includes(response.status) && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        continue;
      }
      return { response, data };
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}

async function expectOk(label, path, options) {
  const result = await request(path, options);
  if (!result.response.ok) {
    throw new Error(`${label} failed: ${result.response.status} ${JSON.stringify(result.data)}`);
  }
  process.stdout.write(`[gates] ${label} ok\n`);
  return result.data;
}

async function expectBlocked(label, path, options, expectedMessage) {
  const result = await request(path, options);
  if (result.response.ok) {
    throw new Error(`${label} should have been blocked`);
  }
  const message = result.data && result.data.error ? result.data.error : "";
  if (expectedMessage && !message.includes(expectedMessage)) {
    throw new Error(`${label} blocked with wrong message: ${message}`);
  }
  process.stdout.write(`[gates] ${label} blocked: ${message}\n`);
}

async function login(email, password) {
  const data = await expectOk(`login ${email}`, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  return data.token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function main() {
  await expectOk("health", "/health");
  const salesToken = await login("sales@richland.local", "Richland#Sales2026");
  const financeToken = await login("finance@richland.local", "Richland#Finance2026");
  const managerToken = await login("manager@richland.local", "Richland#Manager2026");
  const productionToken = await login("production@richland.local", "Richland#Production2026");
  const docsToken = await login("docs@richland.local", "Richland#Docs2026");
  const suffix = Date.now();

  const inquiryResult = await expectOk("create inquiry", "/api/inquiries", {
    method: "POST",
    body: JSON.stringify({
      source: "website",
      targetCategory: "Pedestal Fans",
      estimatedQuantity: "800 pcs",
      destinationMarket: "Chile",
      cooperationMode: "OEM",
      companyName: "Gate Test Appliances LLC",
      website: "https://gate-test.example.com",
      email: `buyer+${suffix}@gate-test.example.com`,
      contactPerson: "Gate Tester",
      phone: "+1 555 0100",
      message: "Gate test inquiry for order workflow."
    })
  });

  const inquiry = inquiryResult.inquiry;
  await expectOk("qualify inquiry", `/api/internal/inquiries/${inquiry.id}/qualify`, {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({ note: "Gate test qualified." })
  });
  await expectOk("credit check", `/api/internal/customers/${inquiry.customerId}/credit-check`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({
      workflowCaseId: inquiryResult.workflowCaseId,
      riskLevel: "medium",
      paymentAdvice: "30% deposit before production release",
      note: "Gate test credit reviewed."
    })
  });
  const quotationResult = await expectOk("create quotation", "/api/quotations", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      inquiryId: inquiry.id,
      version: 1,
      currency: "USD",
      validUntil: "2026-07-31",
      moq: "500 pcs",
      leadTime: "35 days after deposit",
      incoterm: "FOB Shunde",
      salesOwner: "Zhihai",
      items: [{ model: "A52", quantity: "800", price: "12.80" }],
      status: "draft"
    })
  });
  const piResult = await expectOk("create pi", "/api/pi", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      quotationId: quotationResult.quotation.id,
      paymentTerms: "30% deposit, 70% before BL release",
      tradeTerms: "FOB Shunde"
    })
  });
  const poResult = await expectOk("create customer po", "/api/customer-pos", {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({
      piId: piResult.pi.id,
      poNumber: `GATE-PO-${suffix}`,
      quantitySummary: "A52 x 800 pcs",
      tradeTerms: "FOB Shunde",
      attachments: [{ name: `GATE-PO-${suffix}.pdf`, url: "https://files.example.com/gate.pdf" }]
    })
  });

  await expectBlocked("production before PO approval", `/api/orders/${poResult.order.id}/production`, {
    method: "PATCH",
    headers: authHeaders(productionToken),
    body: JSON.stringify({ status: "in_progress" })
  }, "Finance sign-off");

  await expectOk("approve po", `/api/internal/customer-pos/${poResult.po.id}/decision`, {
    method: "POST",
    headers: authHeaders(salesToken),
    body: JSON.stringify({ decision: "approve", note: "Gate test PO approved." })
  });
  await expectBlocked("manager release before deposit", `/api/orders/${poResult.order.id}/manager-release`, {
    method: "POST",
    headers: authHeaders(managerToken),
    body: JSON.stringify({ note: "Should not release before deposit." })
  }, "No pending manager release approval");
  await expectBlocked("generic jump to production", `/api/orders/${poResult.order.id}/status`, {
    method: "PATCH",
    headers: authHeaders(managerToken),
    body: JSON.stringify({ status: "in_production" })
  }, "workflow-controlled");

  await expectOk("confirm deposit", `/api/orders/${poResult.order.id}/deposit-confirm`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({ amount: "3072", currency: "USD", note: "Gate test deposit confirmed." })
  });
  await expectOk("manager release", `/api/orders/${poResult.order.id}/manager-release`, {
    method: "POST",
    headers: authHeaders(managerToken),
    body: JSON.stringify({ note: "Gate test manager release." })
  });
  await expectBlocked("production after manager release before signoff", `/api/orders/${poResult.order.id}/production`, {
    method: "PATCH",
    headers: authHeaders(productionToken),
    body: JSON.stringify({ status: "in_progress" })
  }, "Finance sign-off");

  await expectOk("inventory match", `/api/orders/${poResult.order.id}/inventory-match`, {
    method: "POST",
    headers: authHeaders(productionToken),
    body: JSON.stringify({ stockMatchStatus: "matched", note: "Gate test inventory matched.", materials: [] })
  });
  await expectOk("cost review", `/api/orders/${poResult.order.id}/cost-review`, {
    method: "POST",
    headers: authHeaders(managerToken),
    body: JSON.stringify({ decision: "approved", note: "Gate test cost approved." })
  });
  await expectOk("finance signoff", `/api/orders/${poResult.order.id}/finance-signoff`, {
    method: "POST",
    headers: authHeaders(financeToken),
    body: JSON.stringify({ note: "Gate test finance sign-off.", pdfName: "gate-finance-signoff.pdf" })
  });
  await expectBlocked("ship before production complete", `/api/orders/${poResult.order.id}/shipping`, {
    method: "PATCH",
    headers: authHeaders(docsToken),
    body: JSON.stringify({ status: "shipped" })
  }, "ready to ship");

  const workflows = await expectOk("load workflows", "/api/workflows", {
    headers: authHeaders(managerToken)
  });
  const workflowCase = workflows.workflowCases.find((entry) => entry.orderId === poResult.order.id);
  const stageWithoutAudit = workflows.workflowStages.find((entry) => {
    return entry.workflowCaseId === workflowCase.id && (!entry.status || !entry.owningRole || !entry.enteredAt || !entry.completedAt || !Array.isArray(entry.attachments));
  });
  if (stageWithoutAudit) {
    throw new Error(`Workflow stage is missing audit fields: ${stageWithoutAudit.stageKey}`);
  }

  process.stdout.write("Invalid gate simulation completed successfully.\n");
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
