(function () {
  const shell = document.querySelector("[data-detail-shell]");
  const refreshButton = document.querySelector("[data-detail-refresh]");
  const logoutButton = document.querySelector("[data-detail-logout]");
  const sessionRole = document.querySelector("[data-session-role]");
  const params = new URLSearchParams(window.location.search);
  const inquiryId = params.get("inquiryId");
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
    const response = await window.RichlandInternalAuth.fetchInternal(`/api/internal/inquiries/${encodeURIComponent(inquiryId)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : t("inquiryDetail.loadError"));
    }
    return payload;
  }

  function renderDetail(payload) {
    const detail = payload.detail || {};
    const inquiry = detail.inquiry || {};
    const customer = detail.customer || {};
    const contact = detail.contact || {};
    const quotations = detail.quotations || [];
    const roleAccess = payload.roleAccess || {};

    if (sessionRole && activeSession && activeSession.user) {
      sessionRole.textContent = `${activeSession.user.name} · ${roleLabel(roleAccess.role || activeSession.user.role) || roleAccess.label || activeSession.user.role}`;
    }

    shell.innerHTML = `
      <section class="panel hero-panel">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="section-kicker">${escapeHtml(t("inquiryDetail.kicker"))}</span>
            <h1>${escapeHtml(customer.companyName || t("inquiryDetail.buyerInquiry"))}</h1>
            <p>${escapeHtml(t("inquiryDetail.heroText"))}</p>
          </div>
          <aside class="hero-meta">
            ${metaRow(t("detail.currentRole"), roleLabel(roleAccess.role) || roleAccess.label || "-")}
            ${metaRow(t("inquiryDetail.inquiryStatus"), statusLabel(inquiry.status))}
            ${metaRow(t("detail.category"), inquiry.targetCategory)}
            ${metaRow(t("portal.received"), formatDate(inquiry.createdAt))}
          </aside>
        </div>
      </section>

      <section class="detail-grid">
        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("inquiryDetail.buyerContext"))}</span>
              <h2>${escapeHtml(t("inquiryDetail.customerContactHeading"))}</h2>
              <p>${escapeHtml(t("inquiryDetail.customerContactText"))}</p>
            </div>
            <div class="meta-list">
              ${metaRow(t("detail.customer"), customer.companyName)}
              ${metaRow(t("detail.website"), customer.website)}
              ${metaRow(t("detail.destinationMarket"), inquiry.destinationMarket)}
              ${metaRow(t("detail.cooperationMode"), inquiry.cooperationMode)}
              ${metaRow(t("detail.contact"), contact.name)}
              ${metaRow(t("detail.email"), contact.email)}
              ${metaRow(t("detail.phone"), contact.phone)}
            </div>
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("inquiryDetail.inquiryContent"))}</span>
              <h2>${escapeHtml(t("inquiryDetail.categoryQuantityHeading"))}</h2>
              <p>${escapeHtml(t("inquiryDetail.categoryQuantityText"))}</p>
            </div>
            <div class="line-grid">
              <div class="mini-card">
                <strong>${escapeHtml(t("detail.targetCategory"))}</strong>
                <p>${escapeHtml(inquiry.targetCategory || "-")}</p>
              </div>
              <div class="mini-card">
                <strong>${escapeHtml(t("detail.estimatedQuantity"))}</strong>
                <p>${escapeHtml(inquiry.estimatedQuantity || "-")}</p>
              </div>
              <div class="mini-card" style="grid-column:1 / -1">
                <strong>${escapeHtml(t("detail.buyerMessage"))}</strong>
                <p>${escapeHtml(inquiry.message || t("detail.noMessage"))}</p>
              </div>
            </div>
          </article>
        </div>

        <div class="detail-stack">
          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("inquiryDetail.quotationProgress"))}</span>
              <h2>${escapeHtml(t("inquiryDetail.linkedQuotationHeading"))}</h2>
              <p>${escapeHtml(t("inquiryDetail.linkedQuotationText"))}</p>
            </div>
            ${quotations.length ? `
              <div class="line-grid">
                ${quotations.map((quotation) => `
                  <div class="mini-card">
                    <strong>${escapeHtml(quotation.id)}</strong>
                    <p>${escapeHtml(t("detail.status"))}: ${escapeHtml(statusLabel(quotation.status) || "-")}<br>${escapeHtml(t("portal.version"))}: ${escapeHtml(quotation.version || "-")}<br>${escapeHtml(t("portal.owner"))}: ${escapeHtml(quotation.salesOwner || "-")}</p>
                    <p style="margin-top:10px"><a href="internal-quotation.html?quotationId=${encodeURIComponent(quotation.id)}">${escapeHtml(t("inquiryDetail.openQuotationDetail"))}</a></p>
                  </div>
                `).join("")}
              </div>
            ` : `<div class="empty-state">${escapeHtml(t("inquiryDetail.noQuotation"))}</div>`}
          </article>

          <article class="panel card-panel">
            <div class="card-head">
              <span class="section-kicker">${escapeHtml(t("detail.internalTimeline"))}</span>
              <h2>${escapeHtml(t("inquiryDetail.inquiryMovementHeading"))}</h2>
              <p>${escapeHtml(t("inquiryDetail.inquiryMovementText"))}</p>
            </div>
            ${buildTimeline(detail.timeline || [])}
          </article>
        </div>
      </section>
    `;
  }

  async function renderPage() {
    activeSession = await window.RichlandInternalAuth.requireSession();
    if (!inquiryId) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(t("inquiryDetail.missingId"))}</div>`;
      return;
    }
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = t("ui.refreshing");
    }
    try {
      renderDetail(await loadDetail());
    } catch (error) {
      shell.innerHTML = `<div class="empty-state">${escapeHtml(error.message || t("inquiryDetail.loadError"))}</div>`;
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
