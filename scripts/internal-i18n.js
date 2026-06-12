(function () {
  var STORAGE_KEY = "richland-site-language";
  var DEFAULT_LANG = "en";
  var body = document.body;

  if (!body) return;

  function normalizeLang(value) {
    return value === "zh" ? "zh" : "en";
  }

  function getStoredLang() {
    try {
      return normalizeLang(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
    } catch (error) {
      return DEFAULT_LANG;
    }
  }

  function setStoredLang(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalizeLang(value));
    } catch (error) {
      return;
    }
  }

  var currentLang = getStoredLang();
  var page = body.getAttribute("data-page") || "";
  var listeners = [];

  var TEXT = {
    ui: {
      signedIn: { en: "Signed in", zh: "已登录" },
      refresh: { en: "Refresh", zh: "刷新" },
      refreshing: { en: "Refreshing...", zh: "刷新中..." },
      logout: { en: "Logout", zh: "退出登录" },
      website: { en: "Website", zh: "官网首页" },
      backToQueue: { en: "Back to Queue", zh: "返回队列" },
      waitingForSync: { en: "Waiting for sync…", zh: "等待同步…" },
      syncing: { en: "Syncing…", zh: "同步中…" },
      syncFailed: { en: "Sync failed", zh: "同步失败" },
      lastSynced: {
        en: function (value) { return "Last synced " + value; },
        zh: function (value) { return "最近同步 " + value; }
      },
      loading: { en: "Loading…", zh: "加载中…" },
      loginToOps: { en: "Login to Ops", zh: "登录内部系统" },
      signingIn: { en: "Signing in...", zh: "登录中..." },
      backToWebsite: { en: "Back to website", zh: "返回网站" }
    },
    login: {
      error: { en: "Login failed.", zh: "登录失败。" }
    },
    portal: {
      rolePointInquiryUpdate: { en: "Can read and take action on inquiry inbox.", zh: "可以查看并处理询盘队列。" },
      rolePointInquiryRead: { en: "Can read inquiry inbox, but cannot make commercial decisions.", zh: "可以查看询盘队列，但不能做商务决策。" },
      rolePointQuotationPricing: { en: "Can view quotation pricing and portal handoff details.", zh: "可以查看报价价格与 portal 交接信息。" },
      rolePointQuotationHidden: { en: "Quotation pricing and portal handoff links are hidden.", zh: "报价价格和 portal 链接对该角色隐藏。" },
      rolePointQuotationUnavailable: { en: "Quotation workspace is not available for this role.", zh: "该角色不可访问报价工作区。" },
      rolePointPoUpdate: { en: "Can review PO content before internal handoff.", zh: "可以在内部交接前审核 PO 内容。" },
      rolePointPoRead: { en: "Can monitor PO readiness, but cannot approve or reject.", zh: "可以查看 PO 就绪状态，但不能批准或拒绝。" },
      rolePointPoUnavailable: { en: "PO review queue is not available for this role.", zh: "该角色不可访问 PO 审核队列。" },
      noCategory: { en: "No category", zh: "未填写品类" },
      noMarket: { en: "No market", zh: "未填写市场" },
      quantity: { en: "Quantity", zh: "数量" },
      mode: { en: "Mode", zh: "合作方式" },
      received: { en: "Received", zh: "接收时间" },
      inquiryDetail: { en: "Inquiry Detail", zh: "询盘详情" },
      portalLink: { en: "Portal Link", zh: "Portal 链接" },
      version: { en: "Version", zh: "版本" },
      items: { en: "item(s)", zh: "项" },
      owner: { en: "Owner", zh: "负责人" },
      validUntil: { en: "Valid Until", zh: "有效期至" },
      created: { en: "Created", zh: "创建时间" },
      quotationDetail: { en: "Quotation Detail", zh: "报价详情" },
      unknownCustomer: { en: "Unknown customer", zh: "未知客户" },
      noTradeTerm: { en: "No trade term", zh: "未填写贸易条款" },
      packaging: { en: "Packaging", zh: "包装" },
      order: { en: "Order", zh: "订单" },
      uploaded: { en: "Uploaded", zh: "上传时间" },
      reviewDetail: { en: "Review Detail", zh: "审核详情" },
      workflowTask: { en: "Workflow Task", zh: "流程任务" },
      stage: { en: "Stage", zh: "阶段" },
      ownerRole: { en: "Owner Role", zh: "负责角色" },
      summary: { en: "Summary", zh: "摘要" },
      noQueueItems: { en: "No pending items in this queue.", zh: "这个队列当前没有待处理项目。" },
      activeCases: { en: "Active Cases", zh: "进行中案例" },
      blockedCases: { en: "Blocked Cases", zh: "阻塞案例" },
      agentTasks: { en: "Agent Tasks", zh: "Agent 任务" },
      approvals: { en: "Approvals", zh: "审批" },
      notePlaceholder: { en: "Add a short internal note...", zh: "填写简短内部备注…" },
      paymentTermsPlaceholder: { en: "Payment terms", zh: "付款条款" },
      tradeTermsPlaceholder: { en: "Trade terms", zh: "贸易条款" },
      piNotePlaceholder: { en: "Add PI note if needed...", zh: "如有需要可填写 PI 备注…" },
      qualifyInquiry: { en: "Qualify Inquiry", zh: "确认可跟进" },
      createPi: { en: "Create PI", zh: "创建 PI" },
      approve: { en: "Approve", zh: "批准" },
      hold: { en: "Hold", zh: "暂缓" },
      reject: { en: "Reject", zh: "拒绝" },
      riskLow: { en: "Low Risk", zh: "低风险" },
      riskMedium: { en: "Medium Risk", zh: "中风险" },
      riskHigh: { en: "High Risk", zh: "高风险" },
      paymentAdvicePlaceholder: { en: "Payment advice", zh: "付款建议" },
      submitCredit: { en: "Submit Credit Review", zh: "提交信用审核" },
      amountPlaceholder: { en: "Amount", zh: "金额" },
      confirmDeposit: { en: "Confirm Deposit", zh: "确认定金" },
      releasePlanning: { en: "Release to Planning", zh: "放行到生产规划" },
      stockMatched: { en: "Matched", zh: "库存已匹配" },
      stockPartial: { en: "Partial Match", zh: "部分匹配" },
      stockGap: { en: "Material Gap", zh: "存在缺料" },
      materialQuickPlaceholder: { en: "Material | Qty | Note", zh: "物料 | 数量 | 备注" },
      inventoryNotePlaceholder: { en: "Inventory and material note...", zh: "填写库存与物料说明…" },
      submitInventory: { en: "Submit Inventory Match", zh: "提交库存匹配" },
      approveCost: { en: "Approve Cost Review", zh: "通过成本评估" },
      returnForRevision: { en: "Return for Revision", zh: "退回修改" },
      pdfNamePlaceholder: { en: "PDF file name", zh: "PDF 文件名" },
      signoffSummaryPlaceholder: { en: "Short sign-off note", zh: "简短签字备注" },
      completeSignoff: { en: "Complete Sign-off", zh: "完成签字" },
      startProduction: { en: "Start Production", zh: "开始生产" },
      markProductionCompleted: { en: "Mark Completed", zh: "标记完工" },
      productionNotePlaceholder: { en: "Production update note...", zh: "填写生产更新备注…" },
      bookingReferencePlaceholder: { en: "Booking reference", zh: "订舱号" },
      shipmentWindowPlaceholder: { en: "Shipment window", zh: "出货时间窗" },
      shippingNotePlaceholder: { en: "Shipping / on-board note...", zh: "填写出货 / 上船备注…" },
      markOnBoard: { en: "Mark On Board", zh: "标记已上船" },
      confirmBalance: { en: "Confirm Balance", zh: "确认尾款" },
      fileNamePlaceholder: { en: "File name", zh: "文件名" },
      blReleaseNotePlaceholder: { en: "BL release note", zh: "BL 放单备注" },
      releaseBl: { en: "Release BL", zh: "放单 BL" },
      actionCompleted: { en: "Queue action completed.", zh: "队列动作已完成。" },
      actionFailed: { en: "Queue action failed.", zh: "队列动作执行失败。" }
    },
    detail: {
      noTimeline: { en: "No internal timeline records yet.", zh: "暂时没有内部时间线记录。" },
      update: { en: "update", zh: "更新" },
      currentRole: { en: "Current Role", zh: "当前角色" },
      category: { en: "Category", zh: "品类" },
      customer: { en: "Customer", zh: "客户" },
      website: { en: "Website", zh: "网址" },
      destinationMarket: { en: "Destination Market", zh: "目标市场" },
      cooperationMode: { en: "Cooperation Mode", zh: "合作方式" },
      contact: { en: "Contact", zh: "联系人" },
      email: { en: "Email", zh: "邮箱" },
      phone: { en: "Phone", zh: "电话" },
      targetCategory: { en: "Target category", zh: "目标品类" },
      estimatedQuantity: { en: "Estimated quantity", zh: "预估数量" },
      buyerMessage: { en: "Buyer message", zh: "客户留言" },
      noMessage: { en: "No message.", zh: "没有留言。" },
      internalTimeline: { en: "Internal Timeline", zh: "内部时间线" },
      status: { en: "Status", zh: "状态" },
      notCreated: { en: "Not created", zh: "未创建" },
      notOpenedYet: { en: "Not opened yet", zh: "尚未开启" },
      company: { en: "Company", zh: "公司" }
    },
    inquiryDetail: {
      loadError: { en: "The inquiry detail could not be loaded.", zh: "无法加载询盘详情。" },
      kicker: { en: "Inquiry Detail", zh: "询盘详情" },
      buyerInquiry: { en: "Buyer inquiry", zh: "买家询盘" },
      heroText: { en: "This screen keeps the first commercial facts together: buyer contact, category direction, market, quantity expectation, and whether the inquiry has already moved into quotation work.", zh: "这个页面把最初的商务信息集中展示：买家联系方式、品类方向、市场、数量预期，以及询盘是否已经进入报价阶段。" },
      inquiryStatus: { en: "Inquiry Status", zh: "询盘状态" },
      buyerContext: { en: "Buyer Context", zh: "买家背景" },
      customerContactHeading: { en: "Customer, contact, and market direction", zh: "客户、联系人与市场方向" },
      customerContactText: { en: "The first commercial judgment usually depends on who is asking, where the goods are going, how the buyer wants to cooperate, and whether the inquiry is specific enough to quote.", zh: "最初的商务判断通常取决于是谁在询盘、货物去往哪里、客户希望怎样合作，以及询盘信息是否足够明确到可以报价。" },
      inquiryContent: { en: "Inquiry Content", zh: "询盘内容" },
      categoryQuantityHeading: { en: "Category, quantity, and message", zh: "品类、数量与留言" },
      categoryQuantityText: { en: "This block keeps the commercial input concise, so sales can judge whether it is ready for quotation or still needs clarification on model mix, MOQ, or market-specific packaging.", zh: "这部分会把商务输入压缩成易读的信息，方便销售判断是否已经可以报价，或是否还需要补充型号组合、MOQ 或特定市场包装要求。" },
      quotationProgress: { en: "Quotation Progress", zh: "报价进度" },
      linkedQuotationHeading: { en: "Linked quotation records", zh: "关联报价记录" },
      linkedQuotationText: { en: "If the inquiry has already been quoted, use this block to jump into quotation handling and check whether PI or customer confirmation is already in progress.", zh: "如果这条询盘已经发过报价，可以在这里继续查看报价处理情况，并确认 PI 或客户确认是否已经开始。" },
      openQuotationDetail: { en: "Open quotation detail", zh: "打开报价详情" },
      noQuotation: { en: "No quotation has been created from this inquiry yet.", zh: "这条询盘还没有生成报价。" },
      inquiryMovementHeading: { en: "Inquiry movement", zh: "询盘流转" },
      inquiryMovementText: { en: "This timeline shows whether the inquiry is still untouched, already quoted, or already connected to the next commercial steps.", zh: "这条时间线会显示询盘是仍未处理、已经报价，还是已经进入下一步商务动作。" },
      missingId: { en: "Missing inquiryId in the URL. Open this page from Inquiry Inbox.", zh: "URL 中缺少 inquiryId，请从询盘队列进入本页。" }
    },
    quotationDetail: {
      loadError: { en: "The quotation detail could not be loaded.", zh: "无法加载报价详情。" },
      kicker: { en: "Quotation Detail", zh: "报价详情" },
      titleFallback: { en: "Quotation", zh: "报价单" },
      heroText: { en: "This screen keeps the commercial package together: inquiry source, quoted model mix, owner, validity, PI progress, and whether the quotation has already moved into customer PO and order execution.", zh: "这个页面把报价相关的商务信息集中起来：询盘来源、报价型号组合、负责人、有效期、PI 进度，以及是否已经进入客户 PO 和订单执行。" },
      statusLabel: { en: "Quotation Status", zh: "报价状态" },
      commercialPackage: { en: "Commercial Package", zh: "商务包" },
      basisHeading: { en: "Quotation basis and buyer context", zh: "报价依据与买家背景" },
      basisText: { en: "Use this block to confirm whether category, market, quantity, and buyer communication were clear enough before the quotation was released.", zh: "用这一块确认在发出报价前，品类、市场、数量和客户沟通信息是否已经足够明确。" },
      quotationId: { en: "Quotation ID", zh: "报价 ID" },
      inquiry: { en: "Inquiry", zh: "询盘" },
      incoterm: { en: "Incoterm", zh: "贸易术语" },
      leadTime: { en: "Lead Time", zh: "交期" },
      moq: { en: "MOQ", zh: "最小起订量" },
      quotedItems: { en: "Quoted Items", zh: "报价项目" },
      modelMixHeading: { en: "Model mix and quoted scope", zh: "型号组合与报价范围" },
      modelMixText: { en: "Quoted items stay readable here so the team can compare them against PI and later against the customer PO without reopening separate spreadsheets.", zh: "这里把报价项目保持在可读状态，方便团队直接和 PI、后续客户 PO 做对照，不需要额外打开表格。" },
      quotedItem: { en: "Quoted item", zh: "报价项目" },
      price: { en: "Price", zh: "价格" },
      priceHidden: { en: "Price hidden for this role", zh: "该角色不可见价格" },
      noItems: { en: "No quotation items recorded yet.", zh: "尚未记录报价项目。" },
      followUpStatus: { en: "Follow-up Status", zh: "跟进状态" },
      piHeading: { en: "PI, customer PO, and execution", zh: "PI、客户 PO 与执行状态" },
      piText: { en: "This area shows whether the quotation is still in customer review, already turned into PI, or already linked to PO and order execution.", zh: "这一块用于查看报价是仍在客户审核中、已经转成 PI，还是已经关联到 PO 和订单执行。" },
      customerPOs: { en: "Customer POs", zh: "客户 PO" },
      noCustomerPO: { en: "No customer PO uploaded yet.", zh: "客户还没有上传 PO。" },
      timelineHeading: { en: "Quotation movement", zh: "报价流转" },
      timelineText: { en: "This timeline shows how the quotation progressed from inquiry into PI, customer feedback, and later order readiness.", zh: "这条时间线会显示报价如何从询盘推进到 PI、客户反馈以及后续订单就绪。" },
      missingId: { en: "Missing quotationId in the URL. Open this page from Quotation Workspace.", zh: "URL 中缺少 quotationId，请从报价工作区进入本页。" }
    },
    poReview: {
      loadError: { en: "The PO review detail could not be loaded.", zh: "无法加载 PO 审核详情。" },
      kicker: { en: "PO Review Detail", zh: "PO 审核详情" },
      heroText: { en: "This review screen pulls together quotation, PI, packaging, order, and execution context before the customer PO is released to production, shipping, and export documentation.", zh: "这个审核页面把报价、PI、包装、订单和执行上下文集中展示，用于在客户 PO 正式下发到生产、出货和单证之前做最后确认。" },
      poStatus: { en: "PO Status", zh: "PO 状态" },
      orderStatus: { en: "Order Status", zh: "订单状态" },
      commercialCheck: { en: "Commercial Check", zh: "商务核对" },
      alignmentHeading: { en: "PO, quotation, and PI alignment", zh: "PO、报价与 PI 对齐情况" },
      alignmentText: { en: "Use this block to compare the submitted PO against the latest quotation, PI terms, quantity summary, and packaging direction before releasing the order.", zh: "用这部分对照客户提交的 PO 与最新报价、PI 条款、数量摘要和包装方向，再决定是否释放订单。" },
      poNumber: { en: "PO Number", zh: "PO 编号" },
      quantitySummary: { en: "Quantity Summary", zh: "数量摘要" },
      packagingNotes: { en: "Packaging Notes", zh: "包装备注" },
      tradeTerms: { en: "Trade Terms", zh: "贸易条款" },
      piStatus: { en: "PI Status", zh: "PI 状态" },
      executionContext: { en: "Execution Context", zh: "执行上下文" },
      executionHeading: { en: "What will be opened after approval", zh: "批准后将开启的执行项" },
      executionText: { en: "This section shows whether execution objects already exist and how far the order has moved into production, shipping, and documentation.", zh: "这部分用于查看执行对象是否已经创建，以及订单在生产、出货和单证方面推进到了哪一步。" },
      production: { en: "Production", zh: "生产" },
      shipping: { en: "Shipping", zh: "出货" },
      exportDocs: { en: "Export Docs", zh: "出口单证" },
      customerMessage: { en: "Customer Message", zh: "客户备注" },
      noPoNote: { en: "No PO note attached.", zh: "没有附带 PO 备注。" },
      timelineHeading: { en: "Review and handoff record", zh: "审核与交接记录" },
      timelineText: { en: "The internal timeline keeps track of quotation issue, PI creation, PO upload, review notes, and later execution handoff.", zh: "内部时间线会记录报价发出、PI 创建、PO 上传、审核备注和后续执行交接。" },
      decision: { en: "Decision", zh: "审核动作" },
      canTakeAction: { en: "Use one of these actions to approve the PO for execution, hold it for clarification, or reject it if the submitted document cannot be accepted.", zh: "你可以在这里批准 PO 进入执行、暂缓等待补充说明，或在文档不合格时直接拒绝。" },
      cannotTakeAction: { en: "This role can read PO detail, but cannot make review decisions. Use Sales or Admin to approve, hold, or reject.", zh: "该角色只能查看 PO 详情，不能做审核决定。请由销售或管理员进行批准、暂缓或拒绝。" },
      notePlaceholder: { en: "Add an internal review note or revision reason...", zh: "填写内部审核备注或修改原因…" },
      confirm: { en: "Confirm", zh: "确认" },
      hold: { en: "Hold", zh: "暂缓" },
      reject: { en: "Reject", zh: "拒绝" },
      buyerSnapshot: { en: "Buyer Snapshot", zh: "买家概览" },
      customerBackgroundHeading: { en: "Customer and order background", zh: "客户与订单背景" },
      customerBackgroundText: { en: "Keep the buyer context close at hand while reviewing model mix, packaging, quantity, and delivery execution.", zh: "在审核型号组合、包装、数量和交付执行时，把买家背景保持在可快速查看的位置。" },
      inquiryCategory: { en: "Inquiry Category", zh: "询盘品类" },
      updated: {
        en: function (decision) { return "PO review updated: " + decision + "."; },
        zh: function (decision) { return "PO 审核已更新：" + decision + "。"; }
      },
      submitError: { en: "The decision could not be submitted.", zh: "无法提交这次审核动作。" },
      missingId: { en: "Missing poId in the URL. Open this page from the PO Review Queue.", zh: "URL 中缺少 poId，请从 PO 审核队列进入本页。" }
    },
    roleLabels: {
      sales: { en: "Sales / Foreign Trade", zh: "销售 / 外贸" },
      merchandiser: { en: "Merchandiser / Order Follow-up", zh: "跟单 / 订单跟进" },
      production: { en: "Production", zh: "生产" },
      documentation: { en: "Documentation / Shipping", zh: "单证 / 出货" },
      finance: { en: "Finance", zh: "财务" },
      manager: { en: "Manager", zh: "经理部" },
      admin: { en: "Admin / Manager", zh: "管理 / 主管" },
      customer: { en: "Customer", zh: "客户" }
    },
    status: {
      new: { en: "New", zh: "新建" },
      reviewing: { en: "Reviewing", zh: "审核中" },
      quoted: { en: "Quoted", zh: "已报价" },
      closed: { en: "Closed", zh: "已关闭" },
      draft: { en: "Draft", zh: "草稿" },
      pending_customer_confirmation: { en: "Pending Customer Confirmation", zh: "待客户确认" },
      approved: { en: "Approved", zh: "已批准" },
      uploaded: { en: "Uploaded", zh: "已上传" },
      under_review: { en: "Under Review", zh: "审核中" },
      rejected: { en: "Rejected", zh: "已拒绝" },
      revised: { en: "Revised", zh: "已修改" },
      confirmed: { en: "Confirmed", zh: "已确认" },
      in_production: { en: "In Production", zh: "生产中" },
      ready_to_ship: { en: "Ready to Ship", zh: "待出货" },
      shipped: { en: "Shipped", zh: "已出货" },
      completed: { en: "Completed", zh: "已完成" },
      pending: { en: "Pending", zh: "待处理" },
      preparing: { en: "Preparing", zh: "准备中" },
      ready: { en: "Ready", zh: "已准备" },
      sent: { en: "Sent", zh: "已发送" },
      not_started: { en: "Not Started", zh: "未开始" },
      blocked: { en: "Blocked", zh: "阻塞中" },
      in_progress: { en: "In Progress", zh: "进行中" },
      returned: { en: "Returned", zh: "已退回" }
    },
    pages: {
      "internal-login": {
        title: { en: "Internal Login | RichLand Ops", zh: "内部登录 | RichLand Ops" },
        selectors: [
          { selector: ".section-kicker", text: { en: "Internal Access", zh: "内部访问" } },
          { selector: ".intro-panel h1", text: { en: "Login for internal portal work", zh: "登录内部系统工作台" } },
          { selector: ".intro-panel > p", text: { en: "This access layer is now intended for real internal roles. Inquiry follow-up, quotation review, PO approval, execution progress, and internal files should move through a signed user session instead of temporary role switching.", zh: "这套访问层现在用于真实的内部角色登录。询盘跟进、报价审核、PO 审批、执行进度和内部文件，都应通过正式登录会话处理，而不是临时切换角色。" } },
          { selector: ".cred-card:nth-of-type(1) strong", text: { en: "What this login controls", zh: "这套登录控制什么" } },
          { selector: ".cred-card:nth-of-type(1) p", text: { en: "Internal screens now read role from the signed session. Sales can review commercial context, merchandisers can follow order execution, and non-matching roles lose access to protected actions.", zh: "内部页面现在会根据登录会话读取角色。销售可以查看商务上下文，跟单可以跟进订单执行，不匹配的角色将无法访问受保护操作。" } },
          { selector: ".cred-card:nth-of-type(2) strong", text: { en: "Demo accounts for local testing", zh: "本地测试演示账号" } },
          { selector: ".demo-row:nth-child(1) span:first-child", text: { en: "Sales", zh: "销售" } },
          { selector: ".demo-row:nth-child(2) span:first-child", text: { en: "Merchandiser", zh: "跟单" } },
          { selector: ".demo-row:nth-child(3) span:first-child", text: { en: "Admin", zh: "管理" } },
          { selector: ".form-panel h2", text: { en: "Sign in", zh: "登录" } },
          { selector: ".form-panel > p", text: { en: "Use an internal account to enter the ops workspace. If the session expires, protected pages will send you back here automatically.", zh: "使用内部账号进入运营工作台。如果会话过期，受保护页面会自动把你带回这里。" } },
          { selector: "label[for='login-email']", text: { en: "Email", zh: "邮箱" } },
          { selector: "label[for='login-password']", text: { en: "Password", zh: "密码" } },
          { selector: ".submit-row button", text: { en: "Login to Ops", zh: "登录内部系统" } },
          { selector: ".submit-row a", text: { en: "Back to website", zh: "返回网站" } }
        ]
      },
      "internal-portal": {
        title: { en: "Internal Portal | RichLand Ops", zh: "内部工作台 | RichLand Ops" },
        selectors: [
          { selector: ".brand-copy span", text: { en: "Internal Portal Prototype", zh: "内部工作台原型" } },
          { selector: ".top-actions a[href='index.html']", text: { en: "Website", zh: "官网首页" } },
          { selector: "[data-portal-sync-status]", text: { en: "Waiting for sync…", zh: "等待同步…" } },
          { selector: ".role-pill span", text: { en: "Signed in", zh: "已登录" } },
          { selector: "[data-portal-refresh]", text: { en: "Refresh", zh: "刷新" } },
          { selector: "[data-portal-logout]", text: { en: "Logout", zh: "退出登录" } },
          { selector: ".top-actions a.is-primary", text: { en: "Recruitment Flow", zh: "招聘流程" } },
          { selector: ".hero-copy .section-kicker", text: { en: "Ops Overview", zh: "运营总览" } },
          { selector: ".hero-copy h1", text: { en: "Inquiry Inbox, quotation work, and PO review in one first screen", zh: "在一个首屏内查看询盘队列、报价工作与 PO 审核" } },
          { selector: ".hero-copy p", text: { en: "This internal portal prototype is shaped for the practical export path first. The first screen focuses on the three places where commercial follow-up starts to become execution: new inquiries, quotation handling, and customer PO review.", zh: "这套 internal portal 原型优先围绕真实外贸执行路径搭建。首屏聚焦三个最早进入执行的环节：新询盘、报价处理和客户 PO 审核。" } },
          { selector: ".hero-meta strong:nth-of-type(1)", text: { en: "Phase 1 focus", zh: "第一阶段重点" } },
          { selector: ".hero-meta p:nth-of-type(1)", text: { en: "Inquiry → Quotation → PI / PO confirmation", zh: "询盘 → 报价 → PI / PO 确认" } },
          { selector: ".hero-meta strong:nth-of-type(2)", text: { en: "Customer-facing depth", zh: "客户可见深度" } },
          { selector: ".hero-meta p:nth-of-type(2)", text: { en: "Only key status nodes should be exposed to customers. Internal users keep the fuller operating context here.", zh: "对客户只开放关键状态节点。更完整的操作上下文保留在内部页面中。" } },
          { selector: ".role-intro .section-kicker", text: { en: "Role Boundary", zh: "角色边界" } },
          { selector: ".role-access strong", text: { en: "Current access on this screen", zh: "当前页面可用权限" } },
          { selector: ".summary-card:nth-child(1) .summary-card__label", text: { en: "Inquiry Action", zh: "待处理询盘" } },
          { selector: ".summary-card:nth-child(1) .summary-card__note", text: { en: "New or reviewing inquiries waiting for commercial follow-up.", zh: "等待商务继续跟进的新询盘或审核中询盘。" } },
          { selector: ".summary-card:nth-child(2) .summary-card__label", text: { en: "Quotation Action", zh: "待处理报价" } },
          { selector: ".summary-card:nth-child(2) .summary-card__note", text: { en: "Draft or customer-facing quotations still needing progression.", zh: "仍需推进的草稿报价或已发给客户的报价。" } },
          { selector: ".summary-card:nth-child(3) .summary-card__label", text: { en: "PO Review", zh: "PO 审核" } },
          { selector: ".summary-card:nth-child(3) .summary-card__note", text: { en: "Customer POs currently waiting for internal checking and confirmation.", zh: "当前等待内部核对和确认的客户 PO。" } },
          { selector: ".summary-card:nth-child(4) .summary-card__label", text: { en: "Active Orders", zh: "进行中订单" } },
          { selector: ".summary-card:nth-child(4) .summary-card__note", text: { en: "Confirmed or executing orders already moving beyond the PO stage.", zh: "已经越过 PO 阶段、进入确认或执行中的订单。" } },
          { selector: ".summary-card:nth-child(5) .summary-card__label", text: { en: "Workflow Actions", zh: "流程待办" } },
          { selector: ".summary-card:nth-child(5) .summary-card__note", text: { en: "Pending agent tasks that still need the next department handoff.", zh: "仍需要下一部门接手的 Agent 待办任务。" } },
          { selector: ".summary-card:nth-child(6) .summary-card__label", text: { en: "Approval Gates", zh: "审批门控" } },
          { selector: ".summary-card:nth-child(6) .summary-card__note", text: { en: "Human approvals still blocking release, costing, sign-off, or BL control.", zh: "仍在阻塞放行、成本、签字或 BL 控制的人工作业审批。" } },
          { selector: ".summary-card:nth-child(7) .summary-card__label", text: { en: "Blocked Cases", zh: "阻塞案例" } },
          { selector: ".summary-card:nth-child(7) .summary-card__note", text: { en: "Cases currently waiting for clarification, revision, or missing approval.", zh: "当前等待澄清、修改或缺少审批的案例。" } },
          { selector: ".orchestrator-copy .section-kicker", text: { en: "Workflow Orchestrator", zh: "流程编排器" } },
          { selector: ".orchestrator-copy h2", text: { en: "One master order line, with clear agent ownership at every gate", zh: "一条订单主线，在每个门控点都明确由对应 Agent 负责" } },
          { selector: ".orchestrator-copy p", text: { en: "The orchestrator view does not replace departments. It keeps the sequence visible, shows where a case is blocked, and makes sure the next queue only opens after the required business and approval gates are complete.", zh: "编排器视图并不是替代部门，而是把顺序和阻塞点看清楚，并确保下一队列只会在必要的商务和审批门完成后才打开。" } },
          { selector: ".workspace-panel:nth-child(1) .section-kicker", text: { en: "Inquiry Inbox", zh: "询盘队列" } },
          { selector: ".workspace-panel:nth-child(1) h2", text: { en: "New buyer demand that needs categorization and commercial judgment", zh: "需要分类判断和商务评估的新买家需求" } },
          { selector: ".workspace-panel:nth-child(1) p", text: { en: "Use this column to scan the latest inquiries, identify which ones are worth quoting, and decide where category, market, or cooperation mode still need clarification.", zh: "用这列快速查看最新询盘，判断哪些值得进入报价，以及哪些还需要补充品类、市场或合作方式信息。" } },
          { selector: ".workspace-panel:nth-child(2) .section-kicker", text: { en: "Quotation Workspace", zh: "报价工作区" } },
          { selector: ".workspace-panel:nth-child(2) h2", text: { en: "Quotations, owner follow-up, and portal handoff readiness", zh: "查看报价、负责人跟进与 portal 交接状态" } },
          { selector: ".workspace-panel:nth-child(2) p", text: { en: "This view keeps quotations visible with customer, version, validity, and owner context, so the team can move faster from inquiry review into PI and customer confirmation.", zh: "这个视图把客户、版本、有效期和负责人信息放在一起，帮助团队更快从询盘审核推进到 PI 和客户确认。" } },
          { selector: ".workspace-panel:nth-child(3) .section-kicker", text: { en: "PO Review Queue", zh: "PO 审核队列" } },
          { selector: ".workspace-panel:nth-child(3) h2", text: { en: "Customer PO files that need business confirmation before execution", zh: "在进入执行前需要商务确认的客户 PO 文件" } },
          { selector: ".workspace-panel:nth-child(3) p", text: { en: "This queue is where uploaded PO files are checked against quotation, PI, quantity, packaging, and trade terms before the order is formally handed over to execution.", zh: "这个队列用于把客户上传的 PO 与报价、PI、数量、包装和贸易条款逐项核对，再正式转入执行。" } },
          { selector: "[data-queue-section='workflow-gates'] .queue-section-head .section-kicker", text: { en: "Workflow Gates", zh: "流程门控" } },
          { selector: "[data-queue-section='workflow-gates'] .queue-section-head h2", text: { en: "Credit, deposit, manager release, and material planning stay visible as separate queues", zh: "信用、定金、经理放行和物料规划会以独立队列持续可见" } },
          { selector: "[data-queue-section='workflow-gates'] .queue-section-head p", text: { en: "These queues separate commercial approval from production release. A PO can be approved for document consistency without automatically pushing the order into production.", zh: "这些队列把商务文件批准和生产放行拆开。PO 可以被批准为文件一致，但不会自动直接推进到生产。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(1) .section-kicker", text: { en: "Credit Review", zh: "信用审核" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(1) h2", text: { en: "Customer risk and payment posture before quotation release", zh: "报价前的客户风险与付款姿态判断" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(1) p", text: { en: "Review customer context, decide payment posture, and keep high-risk customers from moving ahead without finance visibility.", zh: "在这里评估客户背景和付款姿态，避免高风险客户在财务未介入时继续前推。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(2) .section-kicker", text: { en: "Deposit Confirmation", zh: "定金确认" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(2) h2", text: { en: "Deposit proof and payment confirmation before production release", zh: "生产放行前的定金凭证与到账确认" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(2) p", text: { en: "Finance confirms deposit status here and records the commercial proof before the case can move to manager release.", zh: "财务在这里确认定金状态并留存商务凭证，之后案例才会进入经理放行。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(3) .section-kicker", text: { en: "Manager Release", zh: "经理放行" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(3) h2", text: { en: "Formal release to production planning after deposit confirmation", zh: "定金确认后的正式生产规划放行" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(3) p", text: { en: "This gate keeps document approval separate from the decision to actually release factory planning work.", zh: "这个门控把文件批准和真正放出工厂规划动作分开处理。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(4) .section-kicker", text: { en: "Inventory & Material", zh: "库存与物料" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(4) h2", text: { en: "Stock match, missing items, and material preparation list", zh: "库存匹配、缺料项与备料清单" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(4) p", text: { en: "Production and merchandisers can keep inventory match and purchase-needs preparation visible before execution fully opens.", zh: "生产和跟单可以在这里把库存匹配和待采购准备维持在可见状态，再进入完整执行。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(5) .section-kicker", text: { en: "Cost Review", zh: "成本评估" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(5) h2", text: { en: "Manager value review for missing materials and cost impact", zh: "针对缺料与成本影响的经理价值评估" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(5) p", text: { en: "Material gaps and related value decisions stay in a dedicated queue before finance sign-off is requested.", zh: "缺料情况及相关价值判断会在这里集中处理，再进入财务签字。" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(6) .section-kicker", text: { en: "Finance Sign-off", zh: "财务签字" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(6) h2", text: { en: "Finance sign-off before execution is formally opened", zh: "正式开启执行前的财务签字确认" } },
          { selector: "[data-queue-section='workflow-gates'] .workspace-panel:nth-child(6) p", text: { en: "Use this queue to keep PDF sign-off, final review notes, and the formal release into execution under control.", zh: "在这个队列里留存签字 PDF、最终审核备注，并控制正式进入执行的时点。" } },
          { selector: "[data-queue-section='execution-control'] .queue-section-head .section-kicker", text: { en: "Execution Control", zh: "执行控制" } },
          { selector: "[data-queue-section='execution-control'] .queue-section-head h2", text: { en: "Production, shipment, and balance collection stay connected but separately controlled", zh: "生产、出货和尾款催收保持串联，但继续独立控制" } },
          { selector: "[data-queue-section='execution-control'] .queue-section-head p", text: { en: "After execution opens, the system still keeps production progress, shipment readiness, and BL release under distinct gates instead of merging them into one generic order status.", zh: "即使执行已经开启，系统仍会把生产进度、出货准备和 BL 放单保持在不同门控之下，而不是粗略合并成一个订单状态。" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(1) .section-kicker", text: { en: "Production Queue", zh: "生产队列" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(1) h2", text: { en: "Orders that are already released and moving on the factory side", zh: "已经放行并开始在工厂侧推进的订单" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(1) p", text: { en: "Track which cases are in progress, completed, or already ready to hand over into shipping and document preparation.", zh: "在这里跟踪哪些案例正在生产、已经完工，或已经准备移交到出货和单证阶段。" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(2) .section-kicker", text: { en: "Shipping & Customs", zh: "出货与清关" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(2) h2", text: { en: "Booking, trucking, customs, and on-board readiness", zh: "订舱、拖车、清关与上船准备" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(2) p", text: { en: "Documentation teams can see which orders are ready for booking and which ones are already moving into on-board control.", zh: "单证团队可以在这里看到哪些订单已经可以订舱，哪些已经进入上船控制。" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(3) .section-kicker", text: { en: "Balance & BL Release", zh: "尾款与 BL 放单" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(3) h2", text: { en: "Final payment follow-up and BL release remain a hard gate", zh: "尾款跟进与 BL 放单继续保持硬门槛" } },
          { selector: "[data-queue-section='execution-control'] .workspace-panel:nth-child(3) p", text: { en: "Keep balance collection, BL approval, and release control together so shipping completion does not automatically mean release of documents.", zh: "把尾款催收、BL 审批和放单控制放在一起，避免货已出就自动等于单证可放。" } }
        ]
      },
      "internal-inquiry": {
        title: { en: "Inquiry Detail | RichLand Ops", zh: "询盘详情 | RichLand Ops" },
        selectors: [
          { selector: ".brand-copy span", text: { en: "Inquiry Detail", zh: "询盘详情" } },
          { selector: ".top-actions a", text: { en: "Back to Queue", zh: "返回队列" } },
          { selector: ".role-pill span", text: { en: "Signed in", zh: "已登录" } },
          { selector: "[data-detail-refresh]", text: { en: "Refresh", zh: "刷新" } },
          { selector: "[data-detail-logout]", text: { en: "Logout", zh: "退出登录" } },
          { selector: "[data-detail-shell] .empty-state", text: { en: "Loading inquiry detail…", zh: "正在加载询盘详情…" } }
        ]
      },
      "internal-quotation": {
        title: { en: "Quotation Detail | RichLand Ops", zh: "报价详情 | RichLand Ops" },
        selectors: [
          { selector: ".brand-copy span", text: { en: "Quotation Detail", zh: "报价详情" } },
          { selector: ".top-actions a", text: { en: "Back to Queue", zh: "返回队列" } },
          { selector: ".role-pill span", text: { en: "Signed in", zh: "已登录" } },
          { selector: "[data-detail-refresh]", text: { en: "Refresh", zh: "刷新" } },
          { selector: "[data-detail-logout]", text: { en: "Logout", zh: "退出登录" } },
          { selector: "[data-detail-shell] .empty-state", text: { en: "Loading quotation detail…", zh: "正在加载报价详情…" } }
        ]
      },
      "internal-po-review": {
        title: { en: "PO Review Detail | RichLand Ops", zh: "PO 审核详情 | RichLand Ops" },
        selectors: [
          { selector: ".brand-copy span", text: { en: "PO Review Detail", zh: "PO 审核详情" } },
          { selector: ".top-actions a", text: { en: "Back to Queue", zh: "返回队列" } },
          { selector: ".role-pill span", text: { en: "Signed in", zh: "已登录" } },
          { selector: "[data-detail-refresh]", text: { en: "Refresh", zh: "刷新" } },
          { selector: "[data-detail-logout]", text: { en: "Logout", zh: "退出登录" } },
          { selector: "[data-detail-shell] .empty-state", text: { en: "Loading PO review detail…", zh: "正在加载 PO 审核详情…" } }
        ]
      }
    }
  };

  function readValue(entry, args) {
    if (!entry) return "";
    var value = entry[currentLang];
    if (typeof value === "function") return value.apply(null, args || []);
    return value || "";
  }

  function t(key, args) {
    var parts = String(key || "").split(".");
    var node = TEXT;
    for (var i = 0; i < parts.length; i += 1) {
      node = node ? node[parts[i]] : null;
    }
    return readValue(node, args);
  }

  function translateStatus(value) {
    return t("status." + value) || value || "-";
  }

  function translateRoleLabel(value) {
    return t("roleLabels." + value) || value || "-";
  }

  function setText(selector, value, property) {
    var node = document.querySelector(selector);
    if (!node) return;
    if ((property || "textContent") === "textContent") {
      node.textContent = value;
      return;
    }
    node[property] = value;
  }

  function applyStaticTranslations() {
    var pageConfig = TEXT.pages[page];
    if (!pageConfig) return;
    if (pageConfig.title) {
      document.title = readValue(pageConfig.title);
    }
    (pageConfig.selectors || []).forEach(function (item) {
      setText(item.selector, readValue(item.text), item.property);
    });
  }

  function updateToggleButtons() {
    var buttons = document.querySelectorAll("[data-internal-lang-toggle]");
    buttons.forEach(function (button) {
      button.textContent = currentLang === "en" ? "中文" : "English";
      button.setAttribute("aria-label", currentLang === "en" ? "切换到中文" : "Switch to English");
    });
  }

  function notify() {
    listeners.forEach(function (listener) {
      try {
        listener(currentLang);
      } catch (error) {
        return;
      }
    });
  }

  function refresh() {
    body.setAttribute("lang", currentLang === "zh" ? "zh-CN" : "en");
    applyStaticTranslations();
    updateToggleButtons();
    notify();
  }

  function setLang(value) {
    currentLang = normalizeLang(value);
    setStoredLang(currentLang);
    refresh();
  }

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest("[data-internal-lang-toggle]");
    if (!toggle) return;
    setLang(currentLang === "en" ? "zh" : "en");
  });

  window.RichlandInternalI18n = {
    getLang: function () { return currentLang; },
    setLang: setLang,
    refresh: refresh,
    t: t,
    translateStatus: translateStatus,
    translateRoleLabel: translateRoleLabel,
    onChange: function (listener) {
      if (typeof listener === "function") listeners.push(listener);
    }
  };

  refresh();
})();
