(function () {
  "use strict";

  // Synthetic, deterministic records used only to demonstrate metric logic.
  const snapshotDate = new Date("2026-06-30T12:00:00Z");
  const data = {
    quotations: [
      { id: "Q-001", status: "ACCEPTED", createdAt: "2026-01-12", value: 18400 },
      { id: "Q-002", status: "EXPIRED", createdAt: "2026-01-24", value: 9600 },
      { id: "Q-003", status: "ACCEPTED", createdAt: "2026-02-08", value: 27100 },
      { id: "Q-004", status: "SENT", createdAt: "2026-03-16", value: 14200 },
      { id: "Q-005", status: "ACCEPTED", createdAt: "2026-04-05", value: 32600 },
      { id: "Q-006", status: "DRAFT", createdAt: "2026-05-09", value: 11750 },
      { id: "Q-007", status: "SENT", createdAt: "2026-06-02", value: 22400 },
      { id: "Q-008", status: "UNDER_REVIEW", createdAt: "2026-06-18", value: 16900 }
    ],
    followUps: [
      { id: "F-001", status: "DONE", dueAt: "2026-06-10" },
      { id: "F-002", status: "OPEN", dueAt: "2026-06-24" },
      { id: "F-003", status: "OPEN", dueAt: "2026-06-29" },
      { id: "F-004", status: "OPEN", dueAt: "2026-07-02" },
      { id: "F-005", status: "OPEN", dueAt: "2026-07-06" },
      { id: "F-006", status: "DONE", dueAt: "2026-06-19" },
      { id: "F-007", status: "OPEN", dueAt: "2026-07-08" }
    ],
    orders: [
      { id: "O-001", status: "SHIPPED", createdAt: "2026-01-18", value: 18400 },
      { id: "O-002", status: "IN_PRODUCTION", createdAt: "2026-02-14", value: 27100 },
      { id: "O-003", status: "PO_REVIEW", createdAt: "2026-04-11", value: 32600 },
      { id: "O-004", status: "READY_TO_SHIP", createdAt: "2026-04-28", value: 15800 },
      { id: "O-005", status: "IN_PRODUCTION", createdAt: "2026-05-20", value: 24100 },
      { id: "O-006", status: "CONFIRMED", createdAt: "2026-06-12", value: 22400 }
    ]
  };

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const openQuotationStatuses = new Set(["DRAFT", "SENT", "UNDER_REVIEW"]);
  const pendingFollowUps = data.followUps.filter((item) => item.status === "OPEN");
  const overdueFollowUps = pendingFollowUps.filter((item) => new Date(item.dueAt + "T23:59:59Z") < snapshotDate);
  const issuedQuotationStatuses = new Set(["SENT", "ACCEPTED", "REJECTED", "EXPIRED"]);
  const issuedQuotations = data.quotations.filter((item) => issuedQuotationStatuses.has(item.status));
  const acceptedQuotations = data.quotations.filter((item) => item.status === "ACCEPTED");
  const conversionRate = issuedQuotations.length
    ? (acceptedQuotations.length / issuedQuotations.length) * 100
    : 0;

  const monthlyOrderValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => {
    const value = data.orders
      .filter((order) => new Date(order.createdAt + "T00:00:00Z").getUTCMonth() === index)
      .reduce((total, order) => total + order.value, 0);
    return { month, value };
  });

  const latestMonthValue = monthlyOrderValues[monthlyOrderValues.length - 1].value;
  const kpis = [
    {
      label: "Open quotations",
      value: data.quotations.filter((item) => openQuotationStatuses.has(item.status)).length,
      note: "Draft, sent, or under review"
    },
    {
      label: "Pending follow-ups",
      value: pendingFollowUps.length,
      note: "Open actions across sales owners"
    },
    {
      label: "Active orders",
      value: data.orders.filter((item) => item.status !== "SHIPPED").length,
      note: "Confirmed through ready to ship"
    },
    {
      label: "June order value",
      value: money.format(latestMonthValue),
      note: "Synthetic monthly total"
    },
    {
      label: "Quote-to-order conversion",
      value: conversionRate.toFixed(1) + "%",
      note: "Accepted ÷ issued quotations"
    },
    {
      label: "Overdue follow-ups",
      value: overdueFollowUps.length,
      note: "Open and due before Jun 30"
    }
  ];

  const kpiGrid = document.querySelector("[data-kpi-grid]");
  if (kpiGrid) {
    kpiGrid.innerHTML = kpis.map((kpi) => `
      <article class="kpi">
        <span class="kpi-label">${kpi.label}</span>
        <strong class="kpi-value">${kpi.value}</strong>
        <span class="kpi-note">${kpi.note}</span>
      </article>
    `).join("");
  }

  const maxMonthlyValue = Math.max(...monthlyOrderValues.map((item) => item.value), 1);
  const orderValueChart = document.querySelector("[data-order-value-chart]");
  if (orderValueChart) {
    orderValueChart.innerHTML = monthlyOrderValues.map((item) => {
      const height = item.value ? Math.max(12, Math.round((item.value / maxMonthlyValue) * 100)) : 4;
      const label = item.value ? "$" + Math.round(item.value / 1000) + "k" : "$0";
      return `<div class="bar-col"><div class="bar" style="--h:${height}%" data-value="${label}" aria-label="${item.month}: ${money.format(item.value)}"></div><span>${item.month}</span></div>`;
    }).join("");
  }

  const statusCounts = data.orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, {});
  const statusLabels = {
    CONFIRMED: "Confirmed",
    PO_REVIEW: "PO review",
    IN_PRODUCTION: "In production",
    READY_TO_SHIP: "Ready to ship",
    SHIPPED: "Shipped"
  };
  const statusChart = document.querySelector("[data-status-chart]");
  if (statusChart) {
    statusChart.innerHTML = Object.entries(statusCounts).map(([status, count]) => {
      const width = Math.round((count / data.orders.length) * 100);
      return `
        <div class="status-row">
          <span>${statusLabels[status] || status}</span>
          <div class="status-track"><div class="status-fill" style="--w:${width}%"></div></div>
          <strong>${count}</strong>
        </div>
      `;
    }).join("");
  }

  const orderTotal = document.querySelector("[data-order-total]");
  if (orderTotal) orderTotal.textContent = data.orders.length + " total orders";
})();
