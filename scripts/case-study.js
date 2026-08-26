(function () {
  "use strict";

  // Aggregate snapshot synchronized with backend/data/synthetic-orders-2025.json.
  // Every underlying record is marked synthetically_generated.
  const monthlyOrderValues = [
    ["Jan", 13.80], ["Feb", 14.50], ["Mar", 15.21], ["Apr", 15.81],
    ["May", 16.20], ["Jun", 16.50], ["Jul", 16.79], ["Aug", 17.01],
    ["Sep", 17.20], ["Oct", 17.40], ["Nov", 17.59], ["Dec", 22.01]
  ];
  const orderStatuses = [
    ["Completed", 30], ["Shipped", 3], ["Confirmed", 2], ["In production", 1]
  ];
  const kpis = [
    { label: "2025 simulated sales", value: "¥200.02M", note: "36 reconciled orders" },
    { label: "Open quotations", value: "3", note: "Synthetic opportunity queue" },
    { label: "Pending follow-ups", value: "3", note: "Open actions with owners" },
    { label: "December order value", value: "¥22.01M", note: "Highest simulated month" },
    { label: "Quote-to-order conversion", value: "87.8%", note: "36 converted ÷ 41 closed quotes" },
    { label: "Overdue follow-ups", value: "3", note: "Action required" }
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

  const maxMonthlyValue = Math.max(...monthlyOrderValues.map((item) => item[1]));
  const orderValueChart = document.querySelector("[data-order-value-chart]");
  if (orderValueChart) {
    orderValueChart.innerHTML = monthlyOrderValues.map(([month, value]) => {
      const height = Math.max(12, Math.round((value / maxMonthlyValue) * 100));
      return `<div class="bar-col"><div class="bar" style="--h:${height}%" data-value="¥${value.toFixed(1)}M" aria-label="${month}: CNY ${value.toFixed(2)} million"></div><span>${month}</span></div>`;
    }).join("");
  }

  const statusChart = document.querySelector("[data-status-chart]");
  if (statusChart) {
    statusChart.innerHTML = orderStatuses.map(([status, count]) => {
      const width = Math.round((count / 36) * 100);
      return `
        <div class="status-row">
          <span>${status}</span>
          <div class="status-track"><div class="status-fill" style="--w:${width}%"></div></div>
          <strong>${count}</strong>
        </div>
      `;
    }).join("");
  }

  const orderTotal = document.querySelector("[data-order-total]");
  if (orderTotal) orderTotal.textContent = "36 total orders";
})();