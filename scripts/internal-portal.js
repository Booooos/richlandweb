(function () {
  const summaryKeys = [
    "inquiryActionCount",
    "quotationActionCount",
    "poReviewCount",
    "activeOrderCount",
    "workflowActionCount",
    "approvalActionCount",
    "blockedCaseCount"
  ];
  const refreshButton = document.querySelector("[data-portal-refresh]");
  const logoutButton = document.querySelector("[data-portal-logout]");
  const syncStatus = document.querySelector("[data-portal-sync-status]");
  const sessionRole = document.querySelector("[data-session-role]");
  const roleLabelNode = document.querySelector("[data-role-label]");
  const roleScope = document.querySelector("[data-role-scope]");
  const roleBadges = document.querySelector("[data-role-badges]");
  const roleAccessList = document.querySelector("[data-role-access-list]");
  const inquiryRoot = document.querySelector("[data-workspace='inquiries']");
  const quotationRoot = document.querySelector("[data-workspace='quotations']");
  const poRoot = document.querySelector("[data-workspace='pos']");
  const orchestratorRoot = document.querySelector("[data-orchestrator-overview]");
  const managerDashboardSection = document.querySelector("[data-manager-dashboard-section]");
  const managerDashboardRoot = document.querySelector("[data-manager-dashboard]");
  const queueRoots = {
    creditReviewQueue: document.querySelector("[data-workspace='credit-review']"),
    depositConfirmationQueue: document.querySelector("[data-workspace='deposit-confirmation']"),
    managerReleaseQueue: document.querySelector("[data-workspace='manager-release']"),
    inventoryMaterialQueue: document.querySelector("[data-workspace='inventory-material']"),
    costReviewQueue: document.querySelector("[data-workspace='cost-review']"),
    financeSignoffQueue: document.querySelector("[data-workspace='finance-signoff']"),
    productionQueue: document.querySelector("[data-workspace='production']"),
    shippingCustomsQueue: document.querySelector("[data-workspace='shipping-customs']"),
    balanceReleaseQueue: document.querySelector("[data-workspace='balance-release']")
  };
  const apiBaseUrl =
    (window.RICHLAND_CONFIG && window.RICHLAND_CONFIG.apiBaseUrl) ||
    "http://localhost:8787";
  const i18n = window.RichlandInternalI18n;
  let activeSession = null;
  let refreshTimer = null;
  let isRendering = false;
  let lastOverview = null;

  function setSyncStatus(text) {
    if (!syncStatus) return;
    syncStatus.textContent = text;
  }

  function t(key, args) {
    return i18n ? i18n.t(key, args) : key;
  }

  function getRoleLabel(role) {
    return i18n ? i18n.translateRoleLabel(role) : role;
  }

  function statusLabel(status) {
    return i18n ? i18n.translateStatus(status) : status;
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) return "-";
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function renderEmpty(root, message) {
    root.innerHTML = `<div class="workspace-empty">${escapeHtml(message)}</div>`;
  }

  function moduleCanUpdate(moduleKey) {
    const modules = lastOverview && lastOverview.roleAccess && lastOverview.roleAccess.modules;
    return !!(modules && modules[moduleKey] && modules[moduleKey].update);
  }

  function renderActionBox(inner) {
    if (!inner) return "";
    return `<div class="ticket-actionbox">${inner}<div class="ticket-feedback" data-ticket-feedback></div></div>`;
  }

  function getTicketActionMarkup(type, item) {
    if (type === "inquiry") {
      if (item.status !== "new") return "";
      if (!moduleCanUpdate("inquiryInbox")) return "";
      return renderActionBox(`
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="qualify-inquiry" data-inquiry-id="${escapeHtml(item.id)}">${escapeHtml(t("portal.qualifyInquiry"))}</button>
        </div>
      `);
    }
    if (type === "quotation") {
      if (item.status !== "draft") return "";
      if (!moduleCanUpdate("quotationWorkspace")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="paymentTerms" placeholder="${escapeHtml(t("portal.paymentTermsPlaceholder"))}" value="30% deposit, 70% before BL release">
          <input data-field="tradeTerms" placeholder="${escapeHtml(t("portal.tradeTermsPlaceholder"))}" value="${escapeHtml(item.incoterm || "FOB")}">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.piNotePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="create-pi" data-quotation-id="${escapeHtml(item.id)}">${escapeHtml(t("portal.createPi"))}</button>
        </div>
      `);
    }
    if (type === "po") {
      if (!moduleCanUpdate("poReviewQueue")) return "";
      return renderActionBox(`
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="po-approve" data-po-id="${escapeHtml(item.id)}">${escapeHtml(t("portal.approve"))}</button>
          <button class="ticket-actionbtn is-warn" type="button" data-queue-action="po-hold" data-po-id="${escapeHtml(item.id)}">${escapeHtml(t("portal.hold"))}</button>
          <button class="ticket-actionbtn is-danger" type="button" data-queue-action="po-reject" data-po-id="${escapeHtml(item.id)}">${escapeHtml(t("portal.reject"))}</button>
        </div>
      `);
    }
    if (type !== "workflow") return "";

    if (item.queueKey === "creditReviewQueue") {
      if (!moduleCanUpdate("creditReviewQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <select data-field="riskLevel">
            <option value="low">${escapeHtml(t("portal.riskLow"))}</option>
            <option value="medium" selected>${escapeHtml(t("portal.riskMedium"))}</option>
            <option value="high">${escapeHtml(t("portal.riskHigh"))}</option>
          </select>
          <input data-field="paymentAdvice" placeholder="${escapeHtml(t("portal.paymentAdvicePlaceholder"))}" value="30% deposit before production release">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="credit-check" data-customer-id="${escapeHtml(item.customerId)}" data-workflow-case-id="${escapeHtml(item.workflowCaseId)}">${escapeHtml(t("portal.submitCredit"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "depositConfirmationQueue") {
      if (!moduleCanUpdate("depositConfirmationQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="amount" placeholder="${escapeHtml(t("portal.amountPlaceholder"))}">
          <input data-field="currency" placeholder="USD" value="USD">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="deposit-confirm" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.confirmDeposit"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "managerReleaseQueue") {
      if (!moduleCanUpdate("managerReleaseQueue")) return "";
      return renderActionBox(`
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="manager-release" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.releasePlanning"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "inventoryMaterialQueue") {
      if (!moduleCanUpdate("inventoryMaterialQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <select data-field="stockMatchStatus">
            <option value="matched">${escapeHtml(t("portal.stockMatched"))}</option>
            <option value="partial" selected>${escapeHtml(t("portal.stockPartial"))}</option>
            <option value="gap">${escapeHtml(t("portal.stockGap"))}</option>
          </select>
          <input data-field="materialTemplate" placeholder="${escapeHtml(t("portal.materialQuickPlaceholder"))}" value="Guard mesh | 800 pcs | Purchase required">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.inventoryNotePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="inventory-match" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.submitInventory"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "costReviewQueue") {
      if (!moduleCanUpdate("costReviewQueue")) return "";
      return renderActionBox(`
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="cost-approve" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.approveCost"))}</button>
          <button class="ticket-actionbtn is-warn" type="button" data-queue-action="cost-return" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.returnForRevision"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "financeSignoffQueue") {
      if (!moduleCanUpdate("financeSignoffQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="pdfName" placeholder="${escapeHtml(t("portal.pdfNamePlaceholder"))}" value="finance-signoff.pdf">
          <input data-field="noteShort" placeholder="${escapeHtml(t("portal.signoffSummaryPlaceholder"))}" value="Finance sign-off completed.">
        </div>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="finance-signoff" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.completeSignoff"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "productionQueue") {
      if (!moduleCanUpdate("productionQueue")) return "";
      const actionLabel = item.status === "in_progress" || item.stageKey === "production_in_progress"
        ? t("portal.markProductionCompleted")
        : t("portal.startProduction");
      const actionName = item.status === "in_progress" || item.stageKey === "production_in_progress"
        ? "production-complete"
        : "production-start";
      return renderActionBox(`
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.productionNotePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="${escapeHtml(actionName)}" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(actionLabel)}</button>
        </div>
      `);
    }
    if (item.queueKey === "shippingCustomsQueue") {
      if (!moduleCanUpdate("shippingCustomsQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="bookingReference" placeholder="${escapeHtml(t("portal.bookingReferencePlaceholder"))}">
          <input data-field="shipmentWindow" placeholder="${escapeHtml(t("portal.shipmentWindowPlaceholder"))}">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.shippingNotePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="shipping-onboard" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.markOnBoard"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "balanceReleaseQueue" && item.taskKind === "agent" && item.agentKey === "balance_collection") {
      if (!moduleCanUpdate("balanceReleaseQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="amount" placeholder="${escapeHtml(t("portal.amountPlaceholder"))}">
          <input data-field="currency" placeholder="USD" value="USD">
        </div>
        <textarea data-field="note" placeholder="${escapeHtml(t("portal.notePlaceholder"))}"></textarea>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="balance-confirm" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.confirmBalance"))}</button>
        </div>
      `);
    }
    if (item.queueKey === "balanceReleaseQueue" && item.taskKind === "approval" && item.approvalType === "bl_release") {
      if (!moduleCanUpdate("balanceReleaseQueue")) return "";
      return renderActionBox(`
        <div class="ticket-actiongrid">
          <input data-field="fileName" placeholder="${escapeHtml(t("portal.fileNamePlaceholder"))}" value="bl-original.pdf">
          <input data-field="noteShort" placeholder="${escapeHtml(t("portal.blReleaseNotePlaceholder"))}" value="BL released after settlement.">
        </div>
        <div class="ticket-actionrow">
          <button class="ticket-actionbtn is-primary" type="button" data-queue-action="bl-release" data-order-id="${escapeHtml(item.orderId)}">${escapeHtml(t("portal.releaseBl"))}</button>
        </div>
      `);
    }
    return "";
  }

  function getCardField(target, fieldName) {
    const card = target.closest("[data-card]");
    const input = card ? card.querySelector(`[data-field='${fieldName}']`) : null;
    return input ? String(input.value || "").trim() : "";
  }

  function setCardFeedback(target, kind, message) {
    const card = target.closest("[data-card]");
    const node = card ? card.querySelector("[data-ticket-feedback]") : null;
    if (!node) {
      setSyncStatus(message);
      return;
    }
    node.className = `ticket-feedback is-visible is-${kind}`;
    node.textContent = message;
  }

  function parseMaterialTemplate(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    const parts = raw.split("|").map((item) => item.trim());
    return [{
      materialName: parts[0] || "Material item",
      quantity: parts[1] || "",
      note: parts[2] || ""
    }];
  }

  function renderRoleBoundary(data) {
    const activeRole = data && data.roleAccess;
    const roles = (data && data.availableRoles) || [];
    if (!activeRole) return;

    if (sessionRole) {
      const roleText = activeSession && activeSession.user
        ? `${activeSession.user.name} · ${getRoleLabel(activeRole.role) || activeRole.label || activeRole.role}`
        : (getRoleLabel(activeRole.role) || activeRole.label || activeRole.role);
      sessionRole.textContent = roleText;
    }
    if (roleLabelNode) {
      roleLabelNode.textContent = getRoleLabel(activeRole.role) || activeRole.label || activeRole.role;
    }
    if (roleScope) {
      roleScope.textContent = activeRole.scope || "";
    }
    if (roleBadges) {
      roleBadges.innerHTML = roles
        .filter((role) => role.key !== "customer")
        .map((role) => {
          const isActive = role.key === activeRole.role;
          return `<span class="role-badge${isActive ? " is-active" : ""}">${escapeHtml(role.label)}</span>`;
        })
        .join("");
    }
    if (roleAccessList) {
      const moduleAccess = activeRole.modules || {};
      const points = [];

      if (moduleAccess.inquiryInbox && moduleAccess.inquiryInbox.read) {
        points.push(moduleAccess.inquiryInbox.update ? t("portal.rolePointInquiryUpdate") : t("portal.rolePointInquiryRead"));
      }
      if (moduleAccess.quotationWorkspace && moduleAccess.quotationWorkspace.read) {
        points.push(moduleAccess.quotationWorkspace.fields && moduleAccess.quotationWorkspace.fields.pricing
          ? t("portal.rolePointQuotationPricing")
          : t("portal.rolePointQuotationHidden"));
      } else {
        points.push(t("portal.rolePointQuotationUnavailable"));
      }
      if (moduleAccess.poReviewQueue && moduleAccess.poReviewQueue.read) {
        points.push(moduleAccess.poReviewQueue.update
          ? t("portal.rolePointPoUpdate")
          : t("portal.rolePointPoRead"));
      } else {
        points.push(t("portal.rolePointPoUnavailable"));
      }

      roleAccessList.innerHTML = points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    }
  }

  function inquiryCard(item) {
    return `
      <article class="ticket" data-card data-card-type="inquiry" data-card-id="${escapeHtml(item.id)}">
        <div class="ticket-top">
          <div class="ticket-title">
            <h3>${escapeHtml(item.companyName || "Unknown company")}</h3>
            <p>${escapeHtml(item.targetCategory || t("portal.noCategory"))} · ${escapeHtml(item.destinationMarket || t("portal.noMarket"))}</p>
          </div>
          <span class="status-badge" data-tone="${escapeHtml(item.tone)}">${escapeHtml(statusLabel(item.status))}</span>
        </div>
        <div class="ticket-meta">
          <div class="ticket-row"><span>${escapeHtml(t("portal.quantity"))}</span><span>${escapeHtml(item.estimatedQuantity || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.mode"))}</span><span>${escapeHtml(item.cooperationMode || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.received"))}</span><span>${escapeHtml(formatDate(item.createdAt))}</span></div>
        </div>
        <div class="ticket-actions">
          <span class="ticket-note">${escapeHtml(item.id)}</span>
          <a class="ticket-link" href="internal-inquiry.html?inquiryId=${encodeURIComponent(item.id)}">${escapeHtml(t("portal.inquiryDetail"))}</a>
        </div>
        ${getTicketActionMarkup("inquiry", item)}
      </article>
    `;
  }

  function quotationCard(item) {
    const portalLink = item.portalPath
      ? `<a class="ticket-link" href="${escapeHtml(apiBaseUrl.replace(/\/$/, "") + item.portalPath)}" target="_blank" rel="noreferrer">${escapeHtml(t("portal.portalLink"))}</a>`
      : "";
    return `
      <article class="ticket" data-card data-card-type="quotation" data-card-id="${escapeHtml(item.id)}">
        <div class="ticket-top">
          <div class="ticket-title">
            <h3>${escapeHtml(item.companyName || "Unknown customer")}</h3>
            <p>${escapeHtml(t("portal.version"))} ${escapeHtml(item.version)}${item.currency ? ` · ${escapeHtml(item.currency)}` : ""} · ${escapeHtml(item.itemCount)} ${escapeHtml(t("portal.items"))}</p>
          </div>
          <span class="status-badge" data-tone="${escapeHtml(item.tone)}">${escapeHtml(statusLabel(item.status))}</span>
        </div>
        <div class="ticket-meta">
          <div class="ticket-row"><span>${escapeHtml(t("portal.owner"))}</span><span>${escapeHtml(item.salesOwner || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.validUntil"))}</span><span>${escapeHtml(item.validUntil || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.created"))}</span><span>${escapeHtml(formatDate(item.createdAt))}</span></div>
        </div>
        <div class="ticket-actions">
          <span class="ticket-note">${escapeHtml(item.id)}</span>
          <a class="ticket-link" href="internal-quotation.html?quotationId=${encodeURIComponent(item.id)}">${escapeHtml(t("portal.quotationDetail"))}</a>
          ${portalLink}
        </div>
        ${getTicketActionMarkup("quotation", item)}
      </article>
    `;
  }

  function poCard(item) {
    return `
      <article class="ticket" data-card data-card-type="po" data-card-id="${escapeHtml(item.id)}">
        <div class="ticket-top">
          <div class="ticket-title">
            <h3>${escapeHtml(item.poNumber || "PO without number")}</h3>
            <p>${escapeHtml(item.companyName || t("portal.unknownCustomer"))} · ${escapeHtml(item.tradeTerms || t("portal.noTradeTerm"))}</p>
          </div>
          <span class="status-badge" data-tone="${escapeHtml(item.tone)}">${escapeHtml(statusLabel(item.status))}</span>
        </div>
        <div class="ticket-meta">
          <div class="ticket-row"><span>${escapeHtml(t("portal.quantity"))}</span><span>${escapeHtml(item.quantitySummary || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.packaging"))}</span><span>${escapeHtml(item.packagingNotes || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.order"))}</span><span>${escapeHtml(item.customerVisibleStatus || item.orderStatus || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.uploaded"))}</span><span>${escapeHtml(formatDate(item.createdAt))}</span></div>
        </div>
        <div class="ticket-actions">
          <span class="ticket-note">${escapeHtml(item.id)}</span>
          <a class="ticket-link" href="internal-po-review.html?poId=${encodeURIComponent(item.id)}">${escapeHtml(t("portal.reviewDetail"))}</a>
        </div>
        ${getTicketActionMarkup("po", item)}
      </article>
    `;
  }

  function workflowCard(item) {
    return `
      <article class="ticket" data-card data-card-type="workflow" data-card-id="${escapeHtml(item.id)}">
        <div class="ticket-top">
          <div class="ticket-title">
            <h3>${escapeHtml(item.title || t("portal.workflowTask"))}</h3>
            <p>${escapeHtml(item.companyName || t("portal.unknownCustomer"))}</p>
          </div>
          <span class="status-badge" data-tone="${escapeHtml(item.tone || "neutral")}">${escapeHtml(statusLabel(item.status || "pending"))}</span>
        </div>
        <div class="ticket-meta">
          <div class="ticket-row"><span>${escapeHtml(t("portal.stage"))}</span><span>${escapeHtml(item.stageKey || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.ownerRole"))}</span><span>${escapeHtml(getRoleLabel(item.owningRole || ""))}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.summary"))}</span><span>${escapeHtml(item.summary || "-")}</span></div>
          <div class="ticket-row"><span>${escapeHtml(t("portal.created"))}</span><span>${escapeHtml(formatDate(item.createdAt))}</span></div>
        </div>
        <div class="ticket-actions">
          <span class="ticket-note">${escapeHtml(item.id || "")}</span>
        </div>
        ${getTicketActionMarkup("workflow", item)}
      </article>
    `;
  }

  function renderList(root, items, cardBuilder, emptyMessage) {
    if (!items || !items.length) {
      renderEmpty(root, emptyMessage);
      return;
    }
    root.innerHTML = items.map(cardBuilder).join("");
  }

  function renderOrchestrator(data) {
    if (!orchestratorRoot) return;
    const overview = (data && data.orchestratorOverview) || {};
    const items = [
      { label: t("portal.activeCases"), value: overview.activeWorkflowCount || 0 },
      { label: t("portal.blockedCases"), value: overview.blockedCaseCount || 0 },
      { label: t("portal.agentTasks"), value: overview.pendingAgentTasks || 0 },
      { label: t("portal.approvals"), value: overview.pendingApprovals || 0 }
    ];
    orchestratorRoot.innerHTML = items.map((item) => `
      <article class="orchestrator-stat">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(String(item.value))}</strong>
      </article>
    `).join("");
  }

  function managerItem(title, meta) {
    return `
      <div class="manager-item">
        <strong>${escapeHtml(title || "-")}</strong>
        <span>${escapeHtml(meta || "-")}</span>
      </div>
    `;
  }

  function renderPipeline(pipeline) {
    const rows = [
      ["Inquiry", "inquiry"],
      ["Quotation", "quotation"],
      ["PO Review", "poReview"],
      ["Deposit / Release", "depositRelease"],
      ["Production", "production"],
      ["Shipment", "shipment"],
      ["Balance / BL", "balanceRelease"],
      ["Completed", "completed"]
    ];
    const total = rows.reduce((sum, row) => sum + Number((pipeline && pipeline[row[1]]) || 0), 0) || 1;
    return rows.map(([label, key]) => {
      const value = Number((pipeline && pipeline[key]) || 0);
      const width = Math.max(2, Math.round((value / total) * 100));
      return `
        <div class="pipeline-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
          <div class="pipeline-track"><span class="pipeline-fill" style="width:${width}%"></span></div>
        </div>
      `;
    }).join("");
  }

  function renderManagerDashboard(data) {
    if (!managerDashboardRoot || !managerDashboardSection) return;
    const dashboard = data && data.managerDashboard;
    if (!dashboard) {
      managerDashboardSection.hidden = true;
      return;
    }
    managerDashboardSection.hidden = false;

    const approvals = dashboard.todayNeedsApproval || [];
    const blockedOrders = dashboard.blockedOrders || [];
    const snapshot = dashboard.productionShipmentSnapshot || {};
    const metrics = dashboard.businessMetrics || {};
    const productionItems = (snapshot.productionActive || []).slice(0, 3).map((item) => {
      return managerItem(
        item.companyName || item.orderId || "Production order",
        `${item.status || "-"} · ${item.quantitySummary || item.stageKey || "-"}`
      );
    }).join("");
    const shipmentItems = (snapshot.shipmentActive || []).slice(0, 3).map((item) => {
      return managerItem(
        item.companyName || item.orderId || "Shipment order",
        `${item.status || "-"} · ${item.shipmentWindow || item.bookingReference || item.stageKey || "-"}`
      );
    }).join("");

    managerDashboardRoot.innerHTML = `
      <article class="manager-block">
        <h3>Today Needs Approval</h3>
        <p>Production release, cost review, finance sign-off, or BL release decisions waiting at a human gate.</p>
        <div class="manager-list">
          ${approvals.length ? approvals.map((item) => managerItem(
            item.title || item.approvalType,
            `${item.companyName || "Unknown customer"} · ${item.stageKey || "-"} · ${formatDate(item.createdAt)}`
          )).join("") : managerItem("No pending approval", "The manager queue is clear.")}
        </div>
      </article>
      <article class="manager-block">
        <h3>Order Pipeline</h3>
        <p>Where active cases are sitting across the inquiry-to-settlement line.</p>
        <div class="pipeline-list">${renderPipeline(dashboard.orderPipeline || {})}</div>
      </article>
      <article class="manager-block">
        <h3>Blocked Orders</h3>
        <p>Cases stopped by missing documents, payment, clarification, or returned review.</p>
        <div class="manager-list">
          ${blockedOrders.length ? blockedOrders.map((item) => managerItem(
            item.companyName || item.orderId || item.workflowCaseId,
            `${item.stageKey || "-"} · ${(item.blockingIssues || []).join("; ") || "Blocked"}`
          )).join("") : managerItem("No blocked orders", "No workflow case is currently blocked.")}
        </div>
      </article>
      <article class="manager-block">
        <h3>Production & Shipment</h3>
        <p>Active factory-side and shipment-side work that may need management attention.</p>
        <div class="manager-metric-grid">
          <div class="manager-metric"><span>Production</span><strong>${escapeHtml(String(snapshot.productionActiveCount || 0))}</strong></div>
          <div class="manager-metric"><span>Ready</span><strong>${escapeHtml(String(snapshot.readyToShipCount || 0))}</strong></div>
          <div class="manager-metric"><span>Shipped</span><strong>${escapeHtml(String(snapshot.shippedCount || 0))}</strong></div>
          <div class="manager-metric"><span>Blocked</span><strong>${escapeHtml(String(blockedOrders.length || 0))}</strong></div>
        </div>
        <div class="manager-list">
          ${productionItems || shipmentItems ? productionItems + shipmentItems : managerItem("No active execution items", "Production and shipment queues are quiet.")}
        </div>
      </article>
      <article class="manager-block">
        <h3>Business Metrics</h3>
        <p>Current-month operating indicators from inquiry, quotation, PO, and order records.</p>
        <div class="manager-metric-grid">
          <div class="manager-metric"><span>Inquiries</span><strong>${escapeHtml(String(metrics.monthInquiryCount || 0))}</strong></div>
          <div class="manager-metric"><span>Quotes</span><strong>${escapeHtml(String(metrics.monthQuotationCount || 0))}</strong></div>
          <div class="manager-metric"><span>POs</span><strong>${escapeHtml(String(metrics.monthPoCount || 0))}</strong></div>
          <div class="manager-metric"><span>Orders</span><strong>${escapeHtml(String(metrics.monthOrderCount || 0))}</strong></div>
          <div class="manager-metric"><span>Booked</span><strong>${escapeHtml(formatMoney(metrics.monthBookedValue))}</strong></div>
          <div class="manager-metric"><span>Avg Days</span><strong>${escapeHtml(String(metrics.avgProgressDays || 0))}</strong></div>
          <div class="manager-metric"><span>Delayed</span><strong>${escapeHtml(String(metrics.delayedOrderCount || 0))}</strong></div>
        </div>
      </article>
    `;
  }

  async function loadOverview() {
    const response = await window.RichlandInternalAuth.fetchInternal("/api/internal/ops-overview");
    if (!response.ok) {
      throw new Error("Failed to load ops overview");
    }
    return response.json();
  }

  async function postInternal(path, body) {
    const response = await window.RichlandInternalAuth.fetchInternal(path, {
      method: "POST",
      body: JSON.stringify(body || {})
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : "Request failed");
    }
    return payload;
  }

  async function patchInternal(path, body) {
    const response = await window.RichlandInternalAuth.fetchInternal(path, {
      method: "PATCH",
      body: JSON.stringify(body || {})
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : "Request failed");
    }
    return payload;
  }

  async function executeQueueAction(action, button) {
    const inquiryId = button.getAttribute("data-inquiry-id");
    const quotationId = button.getAttribute("data-quotation-id");
    const poId = button.getAttribute("data-po-id");
    const customerId = button.getAttribute("data-customer-id");
    const orderId = button.getAttribute("data-order-id");
    const workflowCaseId = button.getAttribute("data-workflow-case-id");
    const note = getCardField(button, "note");

    if (action === "qualify-inquiry") {
      return postInternal(`/api/internal/inquiries/${encodeURIComponent(inquiryId)}/qualify`, {
        note: note || "Inquiry qualified from internal queue."
      });
    }
    if (action === "create-pi") {
      return postInternal("/api/pi", {
        quotationId,
        paymentTerms: getCardField(button, "paymentTerms"),
        tradeTerms: getCardField(button, "tradeTerms"),
        notes: note || getCardField(button, "note")
      });
    }
    if (action === "po-approve" || action === "po-hold" || action === "po-reject") {
      return postInternal(`/api/internal/customer-pos/${encodeURIComponent(poId)}/decision`, {
        decision: action === "po-approve" ? "approve" : action === "po-hold" ? "hold" : "reject",
        note
      });
    }
    if (action === "credit-check") {
      return postInternal(`/api/internal/customers/${encodeURIComponent(customerId)}/credit-check`, {
        workflowCaseId,
        riskLevel: getCardField(button, "riskLevel") || "medium",
        paymentAdvice: getCardField(button, "paymentAdvice") || "30% deposit before production release",
        note: note || "Credit reviewed from internal queue."
      });
    }
    if (action === "deposit-confirm") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/deposit-confirm`, {
        amount: getCardField(button, "amount"),
        currency: getCardField(button, "currency") || "USD",
        note: note || "Deposit confirmed from internal queue."
      });
    }
    if (action === "manager-release") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/manager-release`, {
        note: note || "Released to production planning."
      });
    }
    if (action === "inventory-match") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/inventory-match`, {
        stockMatchStatus: getCardField(button, "stockMatchStatus") || "partial",
        note: note || "Inventory match submitted from queue.",
        materials: parseMaterialTemplate(getCardField(button, "materialTemplate"))
      });
    }
    if (action === "cost-approve" || action === "cost-return") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/cost-review`, {
        decision: action === "cost-return" ? "return" : "approved",
        note: note || (action === "cost-return" ? "Returned for revision." : "Cost review approved.")
      });
    }
    if (action === "finance-signoff") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/finance-signoff`, {
        note: getCardField(button, "noteShort") || "Finance sign-off completed.",
        pdfName: getCardField(button, "pdfName") || "finance-signoff.pdf"
      });
    }
    if (action === "production-start") {
      return patchInternal(`/api/orders/${encodeURIComponent(orderId)}/production`, {
        status: "in_progress",
        timelineMessage: note || "Production started from internal queue."
      });
    }
    if (action === "production-complete") {
      return patchInternal(`/api/orders/${encodeURIComponent(orderId)}/production`, {
        status: "completed",
        timelineMessage: note || "Production completed from internal queue."
      });
    }
    if (action === "shipping-onboard") {
      return patchInternal(`/api/orders/${encodeURIComponent(orderId)}/shipping`, {
        status: "shipped",
        bookingReference: getCardField(button, "bookingReference"),
        shipmentWindow: getCardField(button, "shipmentWindow"),
        notes: note || "Shipment marked on board from internal queue.",
        timelineMessage: note || "Goods loaded and on board."
      });
    }
    if (action === "balance-confirm") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/balance-confirm`, {
        amount: getCardField(button, "amount"),
        currency: getCardField(button, "currency") || "USD",
        note: note || "Balance confirmed from internal queue."
      });
    }
    if (action === "bl-release") {
      return postInternal(`/api/orders/${encodeURIComponent(orderId)}/bl-release`, {
        note: getCardField(button, "noteShort") || "BL released from internal queue.",
        fileName: getCardField(button, "fileName") || "bl-original.pdf"
      });
    }
    throw new Error(`Unsupported action: ${action}`);
  }

  async function renderOverview() {
    if (isRendering) return;
    isRendering = true;
    activeSession = await window.RichlandInternalAuth.requireSession();
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = t("ui.refreshing");
    }
    setSyncStatus(t("ui.syncing"));

    try {
      const data = await loadOverview();
      lastOverview = data;
      renderRoleBoundary(data);
      summaryKeys.forEach((key) => {
        const node = document.querySelector(`[data-summary='${key}']`);
        if (node) node.textContent = String((data.summary && data.summary[key]) || 0);
      });
      renderOrchestrator(data);
      renderManagerDashboard(data);
      renderList(inquiryRoot, data.inquiryInbox, inquiryCard, "No inquiry records yet.");
      renderList(quotationRoot, data.quotationWorkspace, quotationCard, "No quotations created yet.");
      renderList(poRoot, data.poReviewQueue, poCard, "No customer PO files waiting for review.");
      Object.keys(queueRoots).forEach((key) => {
        renderList(
          queueRoots[key],
          data.agentQueues && data.agentQueues[key],
          workflowCard,
          t("portal.noQueueItems")
        );
      });
      setSyncStatus(t("ui.lastSynced", [formatDate(new Date().toISOString())]));
    } catch (error) {
      [inquiryRoot, quotationRoot, poRoot].concat(Object.values(queueRoots)).forEach((root) => {
        if (!root) return;
        renderEmpty(root, "The internal overview could not be loaded. Check that the ops backend is running and apiBaseUrl is set correctly.");
      });
      renderOrchestrator(null);
      renderManagerDashboard(null);
      setSyncStatus(t("ui.syncFailed"));
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = t("ui.refresh");
      }
      isRendering = false;
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", renderOverview);
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-queue-action]");
    if (!button) return;
    const action = button.getAttribute("data-queue-action");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = t("ui.refreshing");
    try {
      await executeQueueAction(action, button);
      setSyncStatus(t("portal.actionCompleted"));
      await renderOverview();
    } catch (error) {
      setCardFeedback(button, "danger", error.message || t("portal.actionFailed"));
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      if (refreshTimer) window.clearInterval(refreshTimer);
      window.RichlandInternalAuth.logout();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      renderOverview().catch(() => {});
    }
  });

  window.addEventListener("focus", () => {
    renderOverview().catch(() => {});
  });

  refreshTimer = window.setInterval(() => {
    renderOverview().catch(() => {});
  }, 15000);

  if (i18n) {
    i18n.onChange(function () {
      if (refreshButton) refreshButton.textContent = t("ui.refresh");
      if (logoutButton) logoutButton.textContent = t("ui.logout");
      renderOverview().catch(() => {});
    });
  }

  renderOverview().catch(() => {});
})();
