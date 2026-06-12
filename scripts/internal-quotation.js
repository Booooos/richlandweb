(function () {
  const shell = document.querySelector("[data-detail-shell]");
  const refreshButton = document.querySelector("[data-detail-refresh]");
  const logoutButton = document.querySelector("[data-detail-logout]");
  const sessionRole = document.querySelector("[data-session-role]");
  const params = new URLSearchParams(window.location.search);
  const quotationId = params.get("quotationId");
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

  async function loadDetail() {
    const response = await window.RichlandInternalAuth.fetchInternal(`/api/internal/quotations/${encodeURIComponent(quotationId)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : t("quotationDetail.loadError"));
    }
    return payload;
  }

  function renderDetail(payload) {
    const detail = payload.detail || {};
    const quotation = detail.quotation || {};
    const inquiry = detail.inquiry || {};
    const customer = detail.customer || {};
    const contact = detail.contact || {};
    const pi = detail.pi || {};
    const order = detail.order || {};
    const customerPOs = detail.customerPOs || [];
    const roleAccess = payload.roleAccess || {};

    if (sessionRole && activeSession && activeSession.user) {
      sessionRole.textContent = `${activeSession.user.name} · ${roleLabel(roleAccess.role || activeSession.user.role) || roleAccess.label || activeSession.user.role}`;
    }

    shell.innerHTML = `
      <section class="panel hero-panel">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="section-kicker">${escapeHtml(t("quotationDetail.kicker"))}</span>
            <h1>${escapeHtml(customer.companyName || t("quotationDetail.titleFallback"))}</h1>
            <p>${escapeHtml(t("quotationDetail.heroText"))}</p>
          </div>
          <aside class="hero-meta">
            ${metaRow(t("detail.currentRole"), roleLabel(roleAccess.role) || roleAccess.label || "-")}
            ${metaRow(t("quotationDetail.statusLabel"), statusLabel(quotation.status))}
            ${metaRow(t("portal.owner"), quotation.salesOwner)}
            ${metaRow(t("portal.validUntil"), quotation.validUntil)}
          </aside>
        </div>
      </section>

      <section class="detail-grid">
        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("quotationDetail.commercialPackage"))}</span>
              <h2>${escapeHtml(t("quotationDetail.basisHeading"))}</h2>
              <p>${escapeHtml(t("quotationDetail.basisText"))}</p>
            </div>
            <div class="meta-list">
              ${metaRow(t("quotationDetail.quotationId"), quotation.id)}
              ${metaRow(t("quotationDetail.inquiry"), inquiry.id)}
              ${metaRow(t("detail.customer"), customer.companyName)}
              ${metaRow(t("detail.contact"), contact.name || contact.email)}
              ${metaRow(t("detail.targetCategory"), inquiry.targetCategory)}
              ${metaRow(t("detail.estimatedQuantity"), inquiry.estimatedQuantity)}
              ${metaRow(t("quotationDetail.incoterm"), quotation.incoterm)}
              ${metaRow(t("quotationDetail.leadTime"), quotation.leadTime)}
              ${metaRow(t("quotationDetail.moq"), quotation.moq)}
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("quotationDetail.quotedItems"))}</span>
              <h2>${escapeHtml(t("quotationDetail.modelMixHeading"))}</h2>
              <p>${escapeHtml(t("quotationDetail.modelMixText"))}</p>
            </div>
            ${(quotation.items && quotation.items.length) ? `
              <div class="line-grid">
                ${quotation.items.map((item) => `
                  <div class="mini-card">
                    <strong>${escapeHtml(item.model || item.name || t("quotationDetail.quotedItem"))}</strong>
                    <p>${escapeHtml(t("portal.quantity"))}: ${escapeHtml(item.quantity || item.qty || "-")}<br>${item.price ? `${escapeHtml(t("quotationDetail.price"))}: ${escapeHtml(item.price)}` : escapeHtml(t("quotationDetail.priceHidden"))}</p>
                  </div>
                `).join("")}
              </div>
            ` : `<div class="empty-state">${escapeHtml(t("quotationDetail.noItems"))}</div>`}
          </article>
        </div>

        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("quotationDetail.followUpStatus"))}</span>
              <h2>${escapeHtml(t("quotationDetail.piHeading"))}</h2>
              <p>${escapeHtml(t("quotationDetail.piText"))}</p>
            </div>
            <div class="line-grid">
              <div class="mini-card">
                <strong>PI</strong>
                <p>${escapeHtml(pi.id || t("detail.notCreated"))}<br>${escapeHtml(t("detail.status"))}: ${escapeHtml(statusLabel(pi.status) || "-")}</p>
              </div>
              <div class="mini-card">
                <strong>${escapeHtml(t("portal.order"))}</strong>
                <p>${escapeHtml(order.id || t("detail.notCreated"))}<br>${escapeHtml(t("detail.status"))}: ${escapeHtml(order.customerVisibleStatus || statusLabel(order.status) || "-")}</p>
              </div>
              <div class="mini-card" style="grid-column:1 / -1">
                <strong>${escapeHtml(t("quotationDetail.customerPOs"))}</strong>
                <p>${customerPOs.length ? customerPOs.map((item) => `${item.poNumber} (${statusLabel(item.status)})`).join(", ") : escapeHtml(t("quotationDetail.noCustomerPO"))}</p>
              </div>
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("detail.internalTimeline"))}</span>
              <h2>${escapeHtml(t("quotationDetail.timelineHeading"))}</h2>
              <p>${escapeHtml(t("quotationDetail.timelineText"))}</p>
            </div>
            ${buildTimeline(detail.timeline || [])}
          </article>
        </div>
      </section>
    `;
  }

  async function renderPage() {
    activeSession = await window.RichlandInternalAuth.requireSession();
    if (!quotationId) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(t("quotationDetail.missingId"))}</div>`;
      return;
    }
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = t("ui.refreshing");
    }
    try {
      renderDetail(await loadDetail());
    } catch (error) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(error.message || t("quotationDetail.loadError"))}</div>`;
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = t("ui.refresh");
      }
    }
  }

  if (refreshButton) refreshButton.addEventListener("click", renderPage);
  if (logoutButton) logoutButton.addEventListener("click", () => window.RichlandInternalAuth.logout());
  if (i18n) i18n.onChange(function () { renderPage().catch(() => {}); });
  renderPage().catch(() => {});
})();
