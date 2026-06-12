(function () {
  const shell = document.querySelector("[data-detail-shell]");
  const refreshButton = document.querySelector("[data-detail-refresh]");
  const logoutButton = document.querySelector("[data-detail-logout]");
  const sessionRole = document.querySelector("[data-session-role]");
  const params = new URLSearchParams(window.location.search);
  const poId = params.get("poId");
  const i18n = window.RichlandInternalI18n;
  let activeSession = null;

  function t(key, args) {
    return i18n ? i18n.t(key, args) : key;
  }

  function roleLabel(value) {
    return i18n ? i18n.translateRoleLabel(value) : value;
  }

  function statusLabel(value) {
    return i18n ? i18n.translateStatus(value) : value;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
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

  function renderMessage(kind, message) {
    const node = shell.querySelector("[data-decision-message]");
    if (!node) return;
    node.className = `message-box is-visible is-${kind}`;
    node.textContent = message;
  }

  async function loadDetail() {
    const response = await window.RichlandInternalAuth.fetchInternal(`/api/internal/customer-pos/${encodeURIComponent(poId)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : t("poReview.loadError"));
    }
    return payload;
  }

  function metaRow(label, value) {
    return `<div class="meta-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value || "-")}</span></div>`;
  }

  function buildTimeline(items) {
    if (!items || !items.length) {
      return `<div class="empty-state">${escapeHtml(t("detail.noTimeline"))}</div>`;
    }
    return `
      <div class="timeline">
        ${items.map((item) => `
          <article class="timeline-item">
            <strong>${escapeHtml(item.type || t("detail.update"))}</strong>
            <p>${escapeHtml(item.message || "")}</p>
            <span>${escapeHtml(formatDate(item.createdAt))}</span>
          </article>
        `).join("")}
      </div>
    `;
  }

  function canUpdate(roleAccess) {
    return !!(roleAccess && roleAccess.modules && roleAccess.modules.poReviewQueue && roleAccess.modules.poReviewQueue.update);
  }

  function renderDetail(payload) {
    const roleAccess = payload.roleAccess || {};
    const detail = payload.detail || {};
    const po = detail.customerPO || {};
    const quotation = detail.quotation || {};
    const pi = detail.pi || {};
    const order = detail.order || {};
    const customer = detail.customer || {};
    const contact = detail.contact || {};
    const execution = detail.execution || {};
    const canTakeAction = canUpdate(roleAccess);
    if (sessionRole && activeSession && activeSession.user) {
      sessionRole.textContent = `${activeSession.user.name} · ${roleLabel(roleAccess.role || activeSession.user.role) || roleAccess.label || activeSession.user.role}`;
    }

    shell.innerHTML = `
      <section class="panel hero-panel">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="section-kicker">${escapeHtml(t("poReview.kicker"))}</span>
            <h1>${escapeHtml(po.poNumber || "PO without number")}</h1>
            <p>${escapeHtml(t("poReview.heroText"))}</p>
          </div>
          <aside class="hero-meta">
            <div class="hero-meta-row"><span>${escapeHtml(t("detail.company"))}</span><span>${escapeHtml(customer.companyName || "-")}</span></div>
            <div class="hero-meta-row"><span>${escapeHtml(t("detail.currentRole"))}</span><span>${escapeHtml(roleLabel(roleAccess.role) || roleAccess.label || (activeSession && activeSession.user && activeSession.user.role) || "-")}</span></div>
            <div class="hero-meta-row"><span>${escapeHtml(t("poReview.poStatus"))}</span><span>${escapeHtml(statusLabel(po.status) || "-")}</span></div>
            <div class="hero-meta-row"><span>${escapeHtml(t("poReview.orderStatus"))}</span><span>${escapeHtml(order.customerVisibleStatus || statusLabel(order.status) || "-")}</span></div>
          </aside>
        </div>
      </section>

      <section class="detail-grid">
        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("poReview.commercialCheck"))}</span>
              <h2>${escapeHtml(t("poReview.alignmentHeading"))}</h2>
              <p>${escapeHtml(t("poReview.alignmentText"))}</p>
            </div>
            <div class="meta-list">
              ${metaRow(t("poReview.poNumber"), po.poNumber)}
              ${metaRow(t("poReview.quantitySummary"), po.quantitySummary)}
              ${metaRow(t("poReview.packagingNotes"), po.packagingNotes)}
              ${metaRow(t("poReview.tradeTerms"), po.tradeTerms)}
              ${metaRow(t("quotationDetail.quotationId"), quotation.id)}
              ${metaRow(t("quotationDetail.statusLabel"), statusLabel(quotation.status))}
              ${metaRow("PI", pi.id)}
              ${metaRow(t("poReview.piStatus"), statusLabel(pi.status))}
              ${metaRow(t("detail.contact"), contact.name || contact.email || "-")}
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("poReview.executionContext"))}</span>
              <h2>${escapeHtml(t("poReview.executionHeading"))}</h2>
              <p>${escapeHtml(t("poReview.executionText"))}</p>
            </div>
            <div class="line-grid">
              <div class="mini-card">
                <strong>${escapeHtml(t("poReview.production"))}</strong>
                <p>${escapeHtml(execution.productionTasks && execution.productionTasks[0] ? statusLabel(execution.productionTasks[0].status) : t("detail.notOpenedYet"))}</p>
              </div>
              <div class="mini-card">
                <strong>${escapeHtml(t("poReview.shipping"))}</strong>
                <p>${escapeHtml(execution.shippingPlans && execution.shippingPlans[0] ? statusLabel(execution.shippingPlans[0].status) : t("detail.notOpenedYet"))}</p>
              </div>
              <div class="mini-card">
                <strong>${escapeHtml(t("poReview.exportDocs"))}</strong>
                <p>${escapeHtml(execution.exportDocumentPacks && execution.exportDocumentPacks[0] ? statusLabel(execution.exportDocumentPacks[0].status) : t("detail.notOpenedYet"))}</p>
              </div>
              <div class="mini-card">
                <strong>${escapeHtml(t("poReview.customerMessage"))}</strong>
                <p>${escapeHtml(po.note || t("poReview.noPoNote"))}</p>
              </div>
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("detail.internalTimeline"))}</span>
              <h2>${escapeHtml(t("poReview.timelineHeading"))}</h2>
              <p>${escapeHtml(t("poReview.timelineText"))}</p>
            </div>
            ${buildTimeline(detail.timeline || [])}
          </article>
        </div>

        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="decision-box">
              <h2>${escapeHtml(t("poReview.decision"))}</h2>
              <p>${canTakeAction
                ? escapeHtml(t("poReview.canTakeAction"))
                : escapeHtml(t("poReview.cannotTakeAction"))}</p>
              <textarea data-decision-note placeholder="${escapeHtml(t("poReview.notePlaceholder"))}"></textarea>
              <div class="decision-actions">
                <button type="button" data-decision="approve"${canTakeAction ? "" : " disabled"}>${escapeHtml(t("poReview.confirm"))}</button>
                <button type="button" data-decision="hold"${canTakeAction ? "" : " disabled"}>${escapeHtml(t("poReview.hold"))}</button>
                <button type="button" data-decision="reject"${canTakeAction ? "" : " disabled"}>${escapeHtml(t("poReview.reject"))}</button>
              </div>
              <div class="message-box" data-decision-message></div>
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("poReview.buyerSnapshot"))}</span>
              <h2>${escapeHtml(t("poReview.customerBackgroundHeading"))}</h2>
              <p>${escapeHtml(t("poReview.customerBackgroundText"))}</p>
            </div>
            <div class="meta-list">
              ${metaRow(t("detail.customer"), customer.companyName)}
              ${metaRow(t("detail.email"), customer.primaryEmail)}
              ${metaRow(t("detail.destinationMarket"), customer.destinationMarket)}
              ${metaRow(t("poReview.inquiryCategory"), detail.inquiry && detail.inquiry.targetCategory)}
              ${metaRow(t("detail.estimatedQuantity"), detail.inquiry && detail.inquiry.estimatedQuantity)}
              ${metaRow(t("portal.order"), order.id)}
            </div>
          </article>
        </div>
      </section>
    `;

    shell.querySelectorAll("[data-decision]").forEach((button) => {
      button.addEventListener("click", () => submitDecision(button.getAttribute("data-decision")));
    });
  }

  async function submitDecision(decision) {
    const noteField = shell.querySelector("[data-decision-note]");
    const note = noteField ? noteField.value.trim() : "";
    try {
      const authResponse = await window.RichlandInternalAuth.fetchInternal(`/api/internal/customer-pos/${encodeURIComponent(poId)}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, note })
      });
      const payload = await authResponse.json();
      if (!authResponse.ok) {
        throw new Error(payload && payload.error ? payload.error : "Decision failed");
      }
      renderDetail(payload);
      renderMessage(decision === "reject" ? "danger" : decision === "hold" ? "warning" : "good", t("poReview.updated", [decision]));
    } catch (error) {
      renderMessage("danger", error.message || t("poReview.submitError"));
    }
  }

  async function renderPage() {
    activeSession = await window.RichlandInternalAuth.requireSession();
    if (!poId) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(t("poReview.missingId"))}</div>`;
      return;
    }
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = t("ui.refreshing");
    }
    try {
      const payload = await loadDetail();
      renderDetail(payload);
    } catch (error) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(error.message || t("poReview.loadError"))}</div>`;
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = t("ui.refresh");
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", renderPage);
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      window.RichlandInternalAuth.logout();
    });
  }

  if (i18n) i18n.onChange(function () { renderPage().catch(() => {}); });
  renderPage().catch(() => {});
})();
