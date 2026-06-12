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

  var UI_TEXT = {
    askForQuote: { en: "Ask for Quote", zh: "获取报价" },
    backToTop: { en: "Back to top", zh: "返回顶部" },
    viewMore: {
      en: function (count) {
        return "View more (" + count + ")";
      },
      zh: function (count) {
        return "查看更多（" + count + "）";
      }
    },
    prevColor: { en: "Show previous color", zh: "查看上一个颜色" },
    nextColor: { en: "Show next color", zh: "查看下一个颜色" },
    sending: { en: "Sending...", zh: "发送中..." },
    inquiryConfigError: {
      en: "Inquiry form is not configured yet. Please contact us by email.",
      zh: "询盘表单暂未完成配置，请直接通过邮箱联系我们。"
    },
    inquirySubmitError: {
      en: "Your inquiry could not be sent right now. Please try again or contact us by email.",
      zh: "当前无法发送询盘，请稍后重试，或直接通过邮箱联系我们。"
    },
    jobContactConfigError: {
      en: "Job contact form is not configured yet. Please contact us by email directly.",
      zh: "招聘联系表单暂未完成配置，请先直接通过邮箱联系我们。"
    },
    jobContactSubmitError: {
      en: "Your message could not be sent right now. Please try again or contact us by email.",
      zh: "当前无法发送这条联系信息，请稍后重试，或直接通过邮箱联系我们。"
    },
    jobContactSuccess: {
      en: "Your job contact message has been sent. We will review it and get back to you if there is a suitable next step.",
      zh: "你的招聘联系信息已发送成功。若有合适的后续沟通安排，我们会进一步联系你。"
    },
    locationFallback: {
      en: "Use the direct Google Maps link if the map preview is unavailable.",
      zh: "如果地图预览不可用，请使用 Google Maps 直接打开地址。"
    },
    openInGoogleMaps: {
      en: "Open in Google Maps",
      zh: "在 Google 地图中打开"
    },
    headquarters: { en: "Headquarters", zh: "总部" },
    factory: { en: "Factory", zh: "工厂" },
    heater: { en: "heater", zh: "电暖器" },
    airConditioner: { en: "air conditioner", zh: "空调扇" }
  };

  var CATEGORY_TEXT = {
    "Pedestal Fans": { en: "Pedestal Fans", zh: "落地扇" },
    "Table Fans": { en: "Table Fans", zh: "台扇" },
    "Wall Fans": { en: "Wall Fans", zh: "壁扇" },
    "Air Circulators": { en: "Air Circulators", zh: "循环扇" },
    "Ceiling Fans": { en: "Ceiling Fans", zh: "吊扇" },
    "Electric Heaters": { en: "Electric Heaters", zh: "电暖器" },
    "Air Conditioners": { en: "Air Conditioners", zh: "空调扇" },
    "Induction Cookers": { en: "Induction Cookers", zh: "电磁炉" },
    "Electric Pressure Cookers": { en: "Electric Pressure Cookers", zh: "电压力锅" },
    "Cookers": { en: "Cookers", zh: "炊具" },
    "Heating/cooling": { en: "Heating/cooling", zh: "冷暖产品" }
  };

  var COLOR_TEXT = {
    black: { en: "Black", zh: "黑色" },
    "black pearl": { en: "Black Pearl", zh: "黑珍珠色" },
    "black gold": { en: "Black Gold", zh: "黑金色" },
    blue: { en: "Blue", zh: "蓝色" },
    bronze: { en: "Bronze", zh: "古铜色" },
    "dark green": { en: "Dark Green", zh: "深绿色" },
    gold: { en: "Gold", zh: "金色" },
    green: { en: "Green", zh: "绿色" },
    grey: { en: "Grey", zh: "灰色" },
    "iron gray": { en: "Iron Gray", zh: "铁灰色" },
    orange: { en: "Orange", zh: "橙色" },
    "pearl white": { en: "Pearl White", zh: "珍珠白" },
    pink: { en: "Pink", zh: "粉色" },
    red: { en: "Red", zh: "红色" },
    "rose gold": { en: "Rose Gold", zh: "玫瑰金" },
    silver: { en: "Silver", zh: "银色" },
    vintage: { en: "Vintage", zh: "复古色" },
    white: { en: "White", zh: "白色" }
  };

  var FEATURE_TEXT = {
    "remote control": { en: "Remote Control", zh: "遥控" },
    voice_control: { en: "Voice Control", zh: "语音控制" },
    "voice control": { en: "Voice Control", zh: "语音控制" },
    wire_control: { en: "Wire Control", zh: "拉线控制" },
    "wire control": { en: "Wire Control", zh: "拉线控制" },
    "line control": { en: "Wire Control", zh: "拉线控制" },
    mechanical_control: { en: "Mechanical Control", zh: "机械控制" },
    "mechanical control": { en: "Mechanical Control", zh: "机械控制" },
    five_blades: { en: "Five Blades", zh: "五叶扇叶" },
    "five blades": { en: "Five Blades", zh: "五叶扇叶" },
    six_blades: { en: "Six Blades", zh: "六叶扇叶" },
    "six blades": { en: "Six Blades", zh: "六叶扇叶" },
    three_blades: { en: "Three Blades", zh: "三叶扇叶" },
    "three blades": { en: "Three Blades", zh: "三叶扇叶" },
    five_leaves: { en: "Five Leaves", zh: "五叶扇叶" },
    "five leaves": { en: "Five Leaves", zh: "五叶扇叶" },
    six_leaves: { en: "Six Leaves", zh: "六叶扇叶" },
    "six leaves": { en: "Six Leaves", zh: "六叶扇叶" },
    three_leaves: { en: "Three Leaves", zh: "三叶扇叶" },
    "three leaves": { en: "Three Leaves", zh: "三叶扇叶" },
    double_ball_bearing: { en: "Double Ball Bearing", zh: "双滚珠轴承" },
    "double ball bearing": { en: "Double Ball Bearing", zh: "双滚珠轴承" },
    angle_adjustable: { en: "Angle Adjustable", zh: "角度可调" },
    "angle adjustable": { en: "Angle Adjustable", zh: "角度可调" },
    patented_design: { en: "Patented Design", zh: "专利设计" },
    "patented design": { en: "Patented Design", zh: "专利设计" },
    negative_ion: { en: "Negative Ion", zh: "负离子" },
    "negative ion": { en: "Negative Ion", zh: "负离子" },
    timer_4_level: { en: "4-Level Timer", zh: "四档定时" },
    "4-level timer": { en: "4-Level Timer", zh: "四档定时" },
    "4 level timer": { en: "4-Level Timer", zh: "四档定时" },
    horn_fan: { en: "Horn Fan", zh: "牛角扇" },
    "horn fan": { en: "Horn Fan", zh: "牛角扇" },
    shaft: { en: "Shaft", zh: "转轴结构" },
    thicken_motor: { en: "Thickened Motor", zh: "加厚电机" },
    "thickened motor": { en: "Thickened Motor", zh: "加厚电机" },
    mosquito_control: { en: "Mosquito Control", zh: "灭蚊功能" },
    "mosquito control": { en: "Mosquito Control", zh: "灭蚊功能" },
    "double pull cord": { en: "Double Pull Cord", zh: "双拉绳" },
    "head shaking": { en: "Head Shaking", zh: "摇头功能" },
    "heating function": { en: "Heating Function", zh: "加热功能" },
    "turbine blades": { en: "Turbine Blades", zh: "涡轮扇叶" },
    "mobile control": { en: "Mobile Control", zh: "移动控制" },
    "touch panel": { en: "Touch Panel", zh: "触控面板" },
    "odor removal": { en: "Odor Removal", zh: "除异味" },
    "dust removal": { en: "Dust Removal", zh: "除尘" },
    "safety grill": { en: "Safety Grill", zh: "安全网罩" },
    "stepless angle adjustment": { en: "Stepless Angle Adjustment", zh: "无级调角" },
    heater: { en: "heater", zh: "电暖器" },
    "air conditioner": { en: "air conditioner", zh: "空调扇" },
    remote: { en: "Remote", zh: "遥控" }
  };

  var COMMON_TRANSLATIONS = [
    { selector: "title", text: { en: "RichLand Ltd. | Fan Manufacturing from Shunde, Foshan", zh: "RichLand Ltd. | 佛山顺德风扇制造商" }, property: "textContent" },
    { selector: ".brand-copy span", text: { en: "Shunde, Foshan Manufacturer", zh: "顺德·佛山 制造商" } },
    { selector: "[data-nav-link='products']", text: { en: "Products", zh: "产品中心" } },
    { selector: "[data-nav-link='service']", text: { en: "Service Scope", zh: "服务范围" } },
    { selector: "[data-nav-link='job']", text: { en: "Job", zh: "人才招聘" } },
    { selector: "[data-nav-link='culture']", text: { en: "Culture", zh: "企业文化" } },
    { selector: "[data-nav-link='inquiry']", text: { en: "Send Inquiry", zh: "发送询盘" } },
    { selector: ".footer-brand h3", text: { en: "RichLand Ltd.", zh: "RichLand Ltd." } },
    {
      selector: ".footer-brand > p",
      text: {
        en: "RichLand Electrical Appliance Technology Co., Ltd., also operating as Foshan HuaTian Electrical Appliance Co., Ltd., supports export-oriented fan programs from Foshan with established manufacturing capability, OEM / ODM cooperation, and practical coordination for long-term buyers.",
        zh: "RichLand Electrical Appliance Technology Co., Ltd.（亦以 Foshan HuaTian Electrical Appliance Co., Ltd. 运营）依托佛山制造基地，为海外买家提供以风扇为核心的出口型产品方案，支持 OEM / ODM 合作与长期稳定配合。"
      }
    },
    { selector: ".footer-meta-item:nth-child(1) strong", text: { en: "Base", zh: "基地" } },
    {
      selector: ".footer-meta-item:nth-child(1) span",
      text: {
        en: "Foshan, Guangdong fan manufacturing support with headquarters in Shunde and production expansion in Gaoming.",
        zh: "以广东佛山为制造基础，总部位于顺德，产能延伸覆盖高明。"
      }
    },
    { selector: ".footer-meta-item:nth-child(2) strong", text: { en: "Focus", zh: "重点" } },
    {
      selector: ".footer-meta-item:nth-child(2) span",
      text: {
        en: "Electric fans first, supported by household ventilation equipment and related motor and plastic component capability.",
        zh: "以电风扇为核心，同时覆盖家用通风设备及相关电机、塑胶配件能力。"
      }
    },
    { selector: ".footer-meta-item:nth-child(3) strong", text: { en: "Cooperation", zh: "合作" } },
    {
      selector: ".footer-meta-item:nth-child(3) span",
      text: {
        en: "Established in 1994 with export-oriented OEM / ODM support and integrated factory coordination.",
        zh: "公司成立于 1994 年，具备面向出口市场的 OEM / ODM 配合能力与一体化工厂协同。"
      }
    },
    { selector: "[data-footer-group='explore']", text: { en: "Explore", zh: "页面浏览" } },
    { selector: "[data-footer-group='contact']", text: { en: "Contact", zh: "联系信息" } },
    { selector: "[data-footer-link='products']", text: { en: "Products", zh: "产品中心" } },
    { selector: "[data-footer-link='service']", text: { en: "Service Scope", zh: "服务范围" } },
    { selector: "[data-footer-link='job']", text: { en: "Job", zh: "人才招聘" } },
    { selector: "[data-footer-link='culture']", text: { en: "Culture", zh: "企业文化" } },
    { selector: "[data-footer-link='send-inquiry']", text: { en: "Send Inquiry", zh: "发送询盘" } },
    { selector: "[data-footer-link='contact-us']", text: { en: "Contact Us", zh: "联系我们" } },
    { selector: "[data-footer-link='factory-profile']", text: { en: "Factory Profile", zh: "工厂介绍" } },
    { selector: ".footer-directory-head h4", text: { en: "Contact & Location", zh: "联系与地址" } },
    {
      selector: ".footer-directory-head p",
      text: {
        en: "Sales and factory details are organized for buyers who need direct routing, verified locations, and quick map access.",
        zh: "为便于买家快速联系销售、核对工厂地址并查看地图，这里集中整理了销售与工厂信息。"
      }
    },
    { selector: "[data-contact-sales] h5", text: { en: "Sales", zh: "销售" } },
    { selector: "[data-contact-factory] h5", text: { en: "Factory", zh: "工厂" } },
    { selector: "[data-location-tab='headquarters']", text: { en: "Headquarters", zh: "总部" } },
    { selector: "[data-location-tab='factory']", text: { en: "Factory", zh: "工厂" } },
    { selector: "[data-sales-name-item] span:first-child", text: { en: "Contact", zh: "联系人" } },
    { selector: "[data-sales-phone-item] span:first-child", text: { en: "Phone", zh: "电话" } },
    { selector: "[data-sales-email-item] span:first-child", text: { en: "Email", zh: "邮箱" } },
    { selector: "[data-factory-name-item] span:first-child", text: { en: "Contact", zh: "联系人" } },
    { selector: "[data-factory-phone-item] span:first-child", text: { en: "Phone", zh: "电话" } },
    { selector: "[data-factory-address-item] span:first-child", text: { en: "Address", zh: "地址" } },
    { selector: "[data-location-address-item] span:first-child", text: { en: "Address", zh: "地址" } },
    { selector: "[data-location-phone-item] span:first-child", text: { en: "Phone", zh: "电话" } },
    { selector: "[data-map-open]", text: { en: "Open in Google Maps", zh: "在 Google 地图中打开" } },
    { selector: ".bottom-bar > div:first-child", text: { en: "Copyright RichLand Ltd. All rights reserved.", zh: "Copyright RichLand Ltd. 版权所有。" } },
    { selector: ".bottom-links span", text: { en: "Foshan, Guangdong, China", zh: "中国广东佛山" } }
  ];

  var PAGE_TRANSLATIONS = {
    index: [
      { selector: "title", text: { en: "RichLand Ltd. | Fan Manufacturing from Shunde, Foshan", zh: "RichLand Ltd. | 佛山顺德风扇制造商" }, property: "textContent" },
      { selector: ".hero-visual-badge", text: { en: "Fan Manufacturing from Shunde, Foshan", zh: "佛山顺德风扇制造" } },
      { selector: ".hero-copy .eyebrow", text: { en: "Electric Fan Manufacturing", zh: "电风扇制造" } },
      { selector: ".hero-copy h1", text: { en: "Electric fan production built for long-term export programs", zh: "面向长期出口项目的电风扇制造能力" } },
      {
        selector: ".hero-copy .lead",
        text: {
          en: "RichLand, backed by Huatian's factory base in Shunde, Foshan, supports importers, distributors, and private-label buyers with 33 years of manufacturing experience, broad fan categories, and practical OEM / ODM cooperation.",
          zh: "RichLand 依托佛山顺德华田工厂基础，为进口商、分销商和贴牌客户提供 33 年制造经验支持，覆盖丰富风扇品类，并配合务实的 OEM / ODM 合作。"
        }
      },
      { selector: ".hero-actions .btn.primary", text: { en: "Request Quotation", zh: "获取报价" } },
      { selector: ".hero-actions .btn:not(.primary)", text: { en: "Explore Fan Categories", zh: "查看风扇品类" } },
      { selector: ".hero-metrics .metric:nth-child(1) strong", text: { en: "OEM / ODM", zh: "OEM / ODM" } },
      { selector: ".hero-metrics .metric:nth-child(1) span", text: { en: "Flexible private-label cooperation backed by practical factory coordination.", zh: "支持灵活贴牌合作，并由工厂端配合推进。" } },
      { selector: ".hero-metrics .metric:nth-child(2) strong", text: { en: "MOQ 500 pcs", zh: "MOQ 500 件" } },
      { selector: ".hero-metrics .metric:nth-child(2) span", text: { en: "Clear bulk-order baseline for line planning and quotation review.", zh: "提供清晰的起订量基线，便于产品规划与报价评估。" } },
      { selector: ".hero-metrics .metric:nth-child(3) strong", text: { en: "7 / 30 / 3 Days", zh: "7 / 30 / 3 天" } },
      { selector: ".hero-metrics .metric:nth-child(3) span", text: { en: "Reference timing for samples, bulk production, and available stock.", zh: "样品、量产与现货参考周期一目了然。" } },
      { selector: ".hero-metrics .metric:nth-child(4) strong", text: { en: "33 Years", zh: "33 年" } },
      { selector: ".hero-metrics .metric:nth-child(4) span", text: { en: "Manufacturing experience across electric fans and supporting appliance lines.", zh: "长期专注电风扇及相关家电产品制造。" } },
      { selector: ".proof-card h2", text: { en: "Structured for factory evaluation and export follow-through", zh: "为工厂评估与出口跟进而设计" } },
      { selector: ".proof-card p", text: { en: "The homepage is organized for buyers who need to assess fan categories, factory capability, and inquiry readiness before moving into model-by-model discussion.", zh: "首页结构围绕风扇品类、工厂能力与询盘准备度展开，方便买家在进入具体型号讨论前先完成基础判断。" } },
      { selector: ".proof-list li:nth-child(1) span", text: { en: "Core focus", zh: "核心重点" } },
      { selector: ".proof-list li:nth-child(1) strong", text: { en: "Electric fan categories first", zh: "优先呈现电风扇品类" } },
      { selector: ".proof-list li:nth-child(2) span", text: { en: "Factory base", zh: "工厂基础" } },
      { selector: ".proof-list li:nth-child(2) strong", text: { en: "Shunde, Foshan manufacturing support", zh: "佛山顺德制造支持" } },
      { selector: ".proof-list li:nth-child(3) span", text: { en: "Production logic", zh: "生产逻辑" } },
      { selector: ".proof-list li:nth-child(3) strong", text: { en: "Integrated chain from model range to export delivery", zh: "从型号覆盖到出口交付的一体化链路" } },
      { selector: ".proof-list li:nth-child(4) span", text: { en: "Buyer route", zh: "买家路径" } },
      { selector: ".proof-list li:nth-child(4) strong", text: { en: "Start with category, market, quantity, and branding need", zh: "从品类、市场、数量与品牌需求开始" } },
      { selector: ".quote-card strong", text: { en: "Quotation-ready inquiry flow", zh: "适合报价沟通的询盘流程" } },
      { selector: ".quote-card p", text: { en: "After reviewing the main fan categories, buyers can send the commercial basics needed for a focused factory response.", zh: "买家在浏览主要风扇品类后，可直接提交工厂回复所需的核心商业信息。" } },
      { selector: ".quote-points li:nth-child(1)", text: { en: "Target category or model family", zh: "目标品类或型号系列" } },
      { selector: ".quote-points li:nth-child(2)", text: { en: "Estimated quantity and destination market", zh: "预估数量与目标市场" } },
      { selector: ".quote-points li:nth-child(3)", text: { en: "Branding, OEM / ODM, or existing-model preference", zh: "品牌需求、OEM / ODM 或现有型号偏好" } },
      { selector: ".quote-card .btn.primary", text: { en: "Start Inquiry", zh: "开始询盘" } },
      { selector: "#categories .section-kicker", text: { en: "Product Range", zh: "产品范围" } },
      { selector: "#categories h2", text: { en: "Main fan categories for export assortment planning", zh: "适合出口配货规划的主要风扇品类" } },
      { selector: "#categories .section-head p", text: { en: "Electric fans remain the core business. The homepage therefore leads with the categories overseas buyers most often compare when building retail, distribution, and private-label programs.", zh: "电风扇仍是核心业务，因此首页优先呈现海外买家在零售、分销与贴牌项目中最常比较的风扇品类。" } },
      { selector: "#categories .section-note", text: { en: "Fan products lead the conversation. Supporting appliance lines remain visible, but clearly secondary to the fan business.", zh: "风扇产品是首页主线，其它家电品类保留展示，但明确作为辅助业务。" } },
      { selector: "#categories .category-card:nth-child(1) .category-label", text: { en: "Primary Category", zh: "核心品类" } },
      { selector: "#categories .category-card:nth-child(1) h3", text: { en: "Pedestal Fans", zh: "落地扇" } },
      { selector: "#categories .category-card:nth-child(1) p", text: { en: "Core standing-fan programs for household demand, retail programs, and volume export orders.", zh: "适用于家用需求、零售项目及大批量出口订单的核心落地扇产品线。" } },
      { selector: "#categories .category-card:nth-child(2) .category-label", text: { en: "Primary Category", zh: "核心品类" } },
      { selector: "#categories .category-card:nth-child(2) h3", text: { en: "Table Fans", zh: "台扇" } },
      { selector: "#categories .category-card:nth-child(2) p", text: { en: "Compact tabletop models suited to personal cooling, portable demand, and smaller-space assortments.", zh: "适用于个人使用、便携场景及小空间配货的紧凑型台扇。" } },
      { selector: "#categories .category-card:nth-child(3) .category-label", text: { en: "Primary Category", zh: "核心品类" } },
      { selector: "#categories .category-card:nth-child(3) h3", text: { en: "Wall Fans", zh: "壁扇" } },
      { selector: "#categories .category-card:nth-child(3) p", text: { en: "Wall-mounted fan lines for utility-led applications, compact layouts, and commercial practicality.", zh: "适合实用型场景、节省空间布局及商用用途的壁挂风扇系列。" } },
      { selector: "#categories .category-card:nth-child(4) .category-label", text: { en: "Primary Category", zh: "核心品类" } },
      { selector: "#categories .category-card:nth-child(4) h3", text: { en: "Air Circulators", zh: "循环扇" } },
      { selector: "#categories .category-card:nth-child(4) p", text: { en: "Airflow-focused models for buyers who need stronger circulation positioning within a wider fan lineup.", zh: "适合希望在风扇产品线中增加空气循环定位的买家。" } },
      { selector: "#categories .category-card:nth-child(5) .category-label", text: { en: "Primary Category", zh: "核心品类" } },
      { selector: "#categories .category-card:nth-child(5) h3", text: { en: "Ceiling Fans", zh: "吊扇" } },
      { selector: "#categories .category-card:nth-child(5) p", text: { en: "Practical ceiling-fan options that extend the main fan program with fixed-installation demand.", zh: "面向固定安装需求的实用吊扇，补充主力风扇产品线。" } },
      { selector: "#categories .category-link", text: { en: "View Products", zh: "查看产品" }, multiple: true },
      { selector: ".secondary-band .section-kicker", text: { en: "Other Product Lines", zh: "其它产品线" } },
      { selector: ".secondary-band h3", text: { en: "Supporting appliance lines for broader cooperation", zh: "支持更广合作的辅助家电品类" } },
      { selector: ".secondary-band p", text: { en: "RichLand also supplies selected practical appliances, but these remain supporting categories around the main electric-fan business rather than equal product pillars.", zh: "RichLand 也提供部分实用家电产品，但它们仍作为电风扇主营业务的辅助品类，而非同等主力。"} },
      { selector: ".secondary-tags a:nth-child(1)", text: { en: "Electric Pressure Cookers", zh: "电压力锅" } },
      { selector: ".secondary-tags a:nth-child(2)", text: { en: "Electric Heaters", zh: "电暖器" } },
      { selector: ".secondary-tags a:nth-child(3)", text: { en: "Air Conditioners", zh: "空调扇" } },
      { selector: ".secondary-tags a:nth-child(4)", text: { en: "Induction Cookers", zh: "电磁炉" } },
      { selector: "#why-richland .section-kicker", text: { en: "Why Choose RichLand", zh: "为什么选择 RichLand" } },
      { selector: "#why-richland h2", text: { en: "Factory cooperation shaped for practical export business", zh: "为务实出口业务而打造的工厂合作方式" } },
      { selector: "#why-richland .section-head p", text: { en: "RichLand is strongest when it is presented as a source manufacturer: broad fan coverage, factory-based coordination, and clear commercial terms that help buyers move from category review into real export discussion.", zh: "RichLand 最适合以源头制造商形象呈现：品类覆盖广、工厂协同清晰、商业条件明确，帮助买家从品类浏览顺利进入真实出口沟通。" } },
      { selector: ".why-intro .section-kicker", text: { en: "How We Work", zh: "合作方式" } },
      { selector: ".why-intro h3", text: { en: "From fan category planning to factory execution", zh: "从风扇品类规划到工厂落地" } },
      { selector: ".why-intro > p", text: { en: "Based in Shunde, Foshan, RichLand supports buyers who prefer to start with the right fan category, then move into model selection, branding direction, packing details, and production planning.", zh: "依托佛山顺德制造基础，RichLand 适合从风扇品类切入，再逐步推进型号选择、品牌方向、包装细节与生产计划。" } },
      { selector: ".brief-row:nth-child(1) span", text: { en: "Private-label support and model adaptation for practical market requirements.", zh: "支持贴牌合作，并可配合实际市场需求做型号调整。" } },
      { selector: ".brief-row:nth-child(2) span", text: { en: "500 pcs baseline for clearer quantity planning and quotation handling.", zh: "500 件起订量基线，便于数量规划与报价处理。" } },
      { selector: ".brief-row:nth-child(3) strong", text: { en: "Experience", zh: "经验" } },
      { selector: ".brief-row:nth-child(3) span", text: { en: "33 years of manufacturing experience across fan production and export supply.", zh: "33 年风扇制造与出口供货经验。" } },
      { selector: ".brief-row:nth-child(4) strong", text: { en: "Production", zh: "生产" } },
      { selector: ".brief-row:nth-child(4) span", text: { en: "Integrated chain support for category development, factory follow-up, and export cooperation.", zh: "支持从品类开发、工厂跟进到出口协作的一体化配合。" } },
      { selector: ".why-card:nth-child(1) h4", text: { en: "Fan-focused manufacturing range", zh: "聚焦风扇的制造范围" } },
      { selector: ".why-card:nth-child(1) p", text: { en: "Pedestal, table, wall, ceiling, and air-circulator models give buyers a practical fan range from one manufacturer.", zh: "从落地扇、台扇、壁扇到吊扇和循环扇，买家可在同一制造商处完成实用风扇组合。" } },
      { selector: ".why-card:nth-child(2) h4", text: { en: "Integrated factory coordination", zh: "一体化工厂协同" } },
      { selector: ".why-card:nth-child(2) p", text: { en: "Category review, model confirmation, packaging discussion, and export follow-up stay inside one practical manufacturing conversation.", zh: "品类评估、型号确认、包装讨论与出口跟进都可在同一制造沟通链路内完成。" } },
      { selector: ".why-card:nth-child(3) h4", text: { en: "OEM / ODM practicality", zh: "务实的 OEM / ODM 配合" } },
      { selector: ".why-card:nth-child(3) p", text: { en: "Private-label cooperation is handled with a realistic export mindset, from existing models to customized market programs.", zh: "从现有型号到定制市场方案，贴牌合作均以务实出口逻辑推进。" } },
      { selector: ".why-card:nth-child(4) h4", text: { en: "Shunde, Foshan factory base", zh: "佛山顺德工厂基础" } },
      { selector: ".why-card:nth-child(4) p", text: { en: "The company story is rooted in one of China’s best-known appliance manufacturing regions, which adds credibility to long-term supply cooperation.", zh: "公司扎根于中国知名家电制造区域之一，为长期供货合作提供更强可信度。" } },
      { selector: ".why-card:nth-child(5) h4", text: { en: "Clear commercial basics", zh: "清晰的商务基础" } },
      { selector: ".why-card:nth-child(5) p", text: { en: "MOQ, lead-time reference, and inquiry routing stay visible so the buyer can move quickly into quotation planning.", zh: "MOQ、交期参考与询盘路径保持清晰，便于买家更快进入报价阶段。" } },
      { selector: ".why-card:nth-child(6) h4", text: { en: "Supporting appliance lines", zh: "辅助家电产品线" } },
      { selector: ".why-card:nth-child(6) p", text: { en: "Selected heaters, cookers, and related appliances can support broader cooperation, while electric fans remain the main business priority.", zh: "电暖器、炊具及相关家电可支持更广合作，但电风扇仍是主营重点。" } },
      { selector: "#showcase .section-kicker", text: { en: "Featured Models", zh: "精选型号" } },
      { selector: "#showcase h2", text: { en: "Representative fan models for quotation review", zh: "适合报价评估的代表性风扇型号" } },
      { selector: "#showcase .section-head p", text: { en: "These featured models help buyers quickly understand the range direction before moving into detailed inquiries by category, market, quantity, and cooperation mode.", zh: "这些代表型号有助于买家在进入详细询盘前，快速理解产品方向与合作结构。" } },
      { selector: ".showcase-card:nth-child(1) .showcase-meta", text: { en: "Pedestal Fans", zh: "落地扇" } },
      { selector: ".showcase-card:nth-child(1) p", text: { en: "A practical pedestal-fan model for mainstream household programs and volume-oriented export assortments.", zh: "适合主流家用项目与大批量出口配货的实用落地扇型号。" } },
      { selector: ".showcase-card:nth-child(1) li:nth-child(1)", text: { en: "General lineup anchor for mainstream fan programs", zh: "适合作为主流风扇项目的基础型号" } },
      { selector: ".showcase-card:nth-child(1) li:nth-child(2)", text: { en: "Useful for distributor and wholesale assortment discussion", zh: "便于分销与批发配货讨论" } },
      { selector: ".showcase-card:nth-child(1) li:nth-child(3)", text: { en: "Fits practical export category positioning", zh: "适合务实的出口品类定位" } },
      { selector: ".showcase-card:nth-child(1) .showcase-cta span", text: { en: "Start with category, quantity, and market", zh: "建议先确认品类、数量与市场" } },
      { selector: ".showcase-card:nth-child(1) .showcase-cta a", text: { en: "Send Inquiry", zh: "发送询盘" } },
      { selector: ".showcase-card:nth-child(2) .showcase-meta", text: { en: "Table Fans", zh: "台扇" } },
      { selector: ".showcase-card:nth-child(2) p", text: { en: "A compact tabletop model for personal cooling programs, lighter retail lines, and smaller-space demand.", zh: "适合个人使用、轻量零售项目与小空间需求的紧凑型台扇。" } },
      { selector: ".showcase-card:nth-child(2) li:nth-child(1)", text: { en: "Compact format for portable or desktop assortment planning", zh: "适合便携或桌面产品组合规划" } },
      { selector: ".showcase-card:nth-child(2) li:nth-child(2)", text: { en: "Helps buyers extend lineup beyond standard standing fans", zh: "帮助买家扩展标准落地扇之外的产品线" } },
      { selector: ".showcase-card:nth-child(2) li:nth-child(3)", text: { en: "Clear category fit for practical export discussions", zh: "适合进行务实出口讨论的明确品类" } },
      { selector: ".showcase-card:nth-child(2) .showcase-cta span", text: { en: "Useful for lighter product-line planning", zh: "适合轻量产品线规划" } },
      { selector: ".showcase-card:nth-child(2) .showcase-cta a", text: { en: "Request Details", zh: "了解详情" } },
      { selector: ".showcase-card:nth-child(3) .showcase-meta", text: { en: "Wall Fans", zh: "壁扇" } },
      { selector: ".showcase-card:nth-child(3) p", text: { en: "A wall-mounted model suited to compact installation requirements and utility-oriented fan programs.", zh: "适合节省空间安装需求与实用型风扇项目的壁挂型号。" } },
      { selector: ".showcase-card:nth-child(3) li:nth-child(1)", text: { en: "Useful for space-saving category requirements", zh: "适合节省空间型产品需求" } },
      { selector: ".showcase-card:nth-child(3) li:nth-child(2)", text: { en: "Supports practical and utility-led product positioning", zh: "支持偏实用导向的产品定位" } },
      { selector: ".showcase-card:nth-child(3) li:nth-child(3)", text: { en: "Suitable for structured export inquiry flow", zh: "适合结构化出口询盘" } },
      { selector: ".showcase-card:nth-child(3) .showcase-cta span", text: { en: "Best reviewed by application and market", zh: "更适合结合应用与市场判断" } },
      { selector: ".showcase-card:nth-child(3) .showcase-cta a", text: { en: "Request Quotation", zh: "获取报价" } },
      { selector: ".showcase-card:nth-child(4) .showcase-meta", text: { en: "Air Circulators", zh: "循环扇" } },
      { selector: ".showcase-card:nth-child(4) p", text: { en: "A circulation-led model for buyers who want a more differentiated airflow option within the broader fan range.", zh: "适合希望在整体风扇产品线中增加差异化循环送风选项的买家。" } },
      { selector: ".showcase-card:nth-child(4) li:nth-child(1)", text: { en: "Recognizable circulation form for higher category distinction", zh: "循环送风外形更具品类识别度" } },
      { selector: ".showcase-card:nth-child(4) li:nth-child(2)", text: { en: "Useful for buyers expanding beyond conventional fan programs", zh: "适合扩展常规风扇之外的产品线" } },
      { selector: ".showcase-card:nth-child(4) li:nth-child(3)", text: { en: "Supports premium but restrained export presentation", zh: "适合稳重而有层次的出口展示" } },
      { selector: ".showcase-card:nth-child(4) .showcase-cta span", text: { en: "Suitable for OEM / ODM review", zh: "适合 OEM / ODM 评估" } },
      { selector: ".showcase-card:nth-child(4) .showcase-cta a", text: { en: "Send Inquiry", zh: "发送询盘" } },
      { selector: "#inquiry .section-kicker", text: { en: "Start Your Inquiry", zh: "开始询盘" } },
      { selector: "#inquiry h2", text: { en: "Move from category review into a working quotation discussion", zh: "从品类评估进入实际报价沟通" } },
      { selector: "#inquiry .section-head p", text: { en: "The inquiry section is kept practical for export business: select the fan category, share the estimated quantity, note the target market, and clarify whether the request is for OEM, ODM, or existing models.", zh: "询盘区为出口业务而设计：选择目标品类、填写预估数量与市场，并说明是 OEM、ODM 还是现有型号需求。" } },
      { selector: ".inquiry-copy .section-kicker", text: { en: "Inquiry Details", zh: "询盘信息" } },
      { selector: ".inquiry-copy h3", text: { en: "Share the sourcing requirement in a clear structure", zh: "用清晰结构说明采购需求" } },
      { selector: ".inquiry-copy > p:not(.form-status)", text: { en: "A well-structured inquiry helps the factory team reply faster with the right category guidance, model direction, and quotation basis for your market.", zh: "结构清晰的询盘能帮助工厂团队更快给出合适的品类建议、型号方向与报价依据。" } },
      { selector: "label[for='target-category']", text: { en: "Target Category", zh: "目标品类" } },
      { selector: "#target-category option[value='']", text: { en: "Select a category", zh: "请选择品类" } },
      { selector: "#target-category option[value='Pedestal Fans']", text: { en: "Pedestal Fans", zh: "落地扇" } },
      { selector: "#target-category option[value='Table Fans']", text: { en: "Table Fans", zh: "台扇" } },
      { selector: "#target-category option[value='Wall Fans']", text: { en: "Wall Fans", zh: "壁扇" } },
      { selector: "#target-category option[value='Air Circulators']", text: { en: "Air Circulators", zh: "循环扇" } },
      { selector: "#target-category option[value='Ceiling Fans']", text: { en: "Ceiling Fans", zh: "吊扇" } },
      { selector: "#target-category option[value='Electric Heaters']", text: { en: "Electric Heaters", zh: "电暖器" } },
      { selector: "#target-category option[value='Air Conditioners']", text: { en: "Air Conditioners", zh: "空调扇" } },
      { selector: "#target-category option[value='Induction Cookers']", text: { en: "Induction Cookers", zh: "电磁炉" } },
      { selector: "#target-category option[value='Electric Pressure Cookers']", text: { en: "Electric Pressure Cookers", zh: "电压力锅" } },
      { selector: "label[for='estimated-quantity']", text: { en: "Estimated Quantity", zh: "预估数量" } },
      { selector: "#estimated-quantity", property: "placeholder", text: { en: "e.g. 500 pcs / 1x40HQ", zh: "例如：500 件 / 1x40HQ" } },
      { selector: "label[for='destination-market']", text: { en: "Destination Market / Country", zh: "目标市场 / 国家" } },
      { selector: "#destination-market", property: "placeholder", text: { en: "e.g. Nigeria / UAE / South America", zh: "例如：尼日利亚 / 阿联酋 / 南美" } },
      { selector: "label[for='cooperation-mode']", text: { en: "Cooperation Mode", zh: "合作方式" } },
      { selector: "#cooperation-mode option[value='']", text: { en: "Select cooperation mode", zh: "请选择合作方式" } },
      { selector: "#cooperation-mode option[value='OEM']", text: { en: "OEM", zh: "OEM" } },
      { selector: "#cooperation-mode option[value='ODM']", text: { en: "ODM", zh: "ODM" } },
      { selector: "#cooperation-mode option[value='Standard / Existing Models']", text: { en: "Standard / Existing Models", zh: "标准款 / 现有型号" } },
      { selector: "#cooperation-mode option[value='Not Sure Yet']", text: { en: "Not Sure Yet", zh: "暂未确定" } },
      { selector: "label[for='company-name']", text: { en: "Company Name", zh: "公司名称" } },
      { selector: "label[for='website']", text: { en: "Website", zh: "公司网站" } },
      { selector: "#website", property: "placeholder", text: { en: "https://yourcompany.com", zh: "https://yourcompany.com" } },
      { selector: "label[for='email']", text: { en: "Email", zh: "邮箱" } },
      { selector: "#email", property: "placeholder", text: { en: "name@company.com", zh: "name@company.com" } },
      { selector: "label[for='contact-person']", text: { en: "Contact Person", zh: "联系人" } },
      { selector: ".message-card h4", text: { en: "Your Message", zh: "留言内容" } },
      { selector: ".message-card > p", text: { en: "Use this space to explain the application, market preference, branding request, or model questions that matter most to your inquiry.", zh: "可在这里补充应用场景、市场偏好、品牌要求，或你最关心的型号问题。" } },
      { selector: "label[for='message']", text: { en: "Message", zh: "留言" } },
      { selector: "#message", property: "placeholder", text: { en: "Share the product types, expected quantity, market background, branding needs, or any questions you want RichLand to review.", zh: "请说明目标产品、预估数量、市场背景、品牌需求，或希望 RichLand 评估的问题。" } },
      { selector: "[data-submit-button]", text: { en: "Send", zh: "发送" } },
      { selector: "[data-success-modal] h3", text: { en: "Thank you for your inquiry.", zh: "感谢您的询盘。" } },
      { selector: "[data-success-modal] p", text: { en: "RichLand has received your submission. Our team will review the details and contact you soon.", zh: "RichLand 已收到您的提交信息，我们会尽快审核并与您联系。" } },
      { selector: ".success-modal__actions .btn.primary", text: { en: "Close", zh: "关闭" } },
      { selector: "[data-modal-close][aria-label]", property: "aria-label", text: { en: "Close confirmation", zh: "关闭提示框" } }
    ],
    products: [
      { selector: "title", text: { en: "Fan Products | RichLand Ltd.", zh: "产品中心 | RichLand Ltd." }, property: "textContent" },
      { selector: ".hero-panel .section-kicker", text: { en: "Products", zh: "产品中心" } },
      { selector: ".hero-panel h1", text: { en: "Fan catalog arranged for practical export sourcing", zh: "为务实出口采购整理的风扇产品目录" } },
      {
        selector: ".hero-panel p",
        text: {
          en: "This page is built around RichLand’s main electric-fan categories first, then supporting appliance lines. Buyers can review the range by category, compare model families in order, and move into inquiry once the right product direction is clear.",
          zh: "本页优先展示 RichLand 的主要电风扇品类，再延伸到辅助家电产品线。买家可按分类浏览、比较型号系列，并在明确方向后直接进入询盘。"
        }
      }
    ],
    service: [
      { selector: "title", text: { en: "Service Scope | RichLand Ltd.", zh: "服务范围 | RichLand Ltd." }, property: "textContent" },
      { selector: "[data-svc='hero-kicker']", text: { en: "Service Scope", zh: "服务范围" } },
      { selector: "[data-svc='hero-title']", text: { en: "Factory-based service support built on real production capability", zh: "建立在真实制造能力之上的工厂型服务支持" } },
      { selector: "[data-svc='hero-text']", text: { en: "RichLand supports export buyers with a manufacturing chain that connects motor work, plastics, tooling, assembly, product development, and inspection. The service structure is designed to turn a product idea into a workable program with clearer factory coordination.", zh: "RichLand 依托电机、塑胶、模具、装配、产品开发与检验相连接的制造链条，为出口买家提供支持。这一页的服务结构，旨在把一个产品想法转化为更可执行、工厂协同更清晰的项目。" } },
      { selector: "[data-svc='hero-fact-1-title']", text: { en: "Integrated manufacturing chain", zh: "一体化制造链条" } },
      { selector: "[data-svc='hero-fact-1-text']", text: { en: "Motor, plastics, molds, electronics, metal parts, assembly, development, and inspection can be aligned inside one factory workflow.", zh: "电机、塑胶、模具、电子、五金、装配、开发与检验等环节，可在同一工厂流程内协同推进。" } },
      { selector: "[data-svc='hero-fact-2-title']", text: { en: "Export-ready coordination", zh: "面向出口的协同能力" } },
      { selector: "[data-svc='hero-fact-2-text']", text: { en: "Sampling, bulk planning, and shipment follow-up can move in a clearer order for OEM / ODM projects.", zh: "对于 OEM / ODM 项目，打样、量产规划与出货跟进都能按更清晰的顺序推进。" } },
      { selector: "[data-svc='hero-fact-3-title']", text: { en: "Broad product basis", zh: "更完整的产品基础" } },
      { selector: "[data-svc='hero-fact-3-text']", text: { en: "Pedestal, table, wall, ceiling, circulator, and industrial fan directions give buyers a stronger starting range for OEM / ODM discussion.", zh: "落地扇、台扇、壁扇、吊扇、循环扇与工业扇等方向，为买家提供了更完整的 OEM / ODM 讨论基础。" } },
      { selector: "[data-svc='hero-fact-4-title']", text: { en: "Market-fit support", zh: "市场适配支持" } },
      { selector: "[data-svc='hero-fact-4-text']", text: { en: "Model range, size direction, feature level, packaging, and positioning can be aligned to fit different regional requirements.", zh: "型号范围、尺寸方向、功能层级、包装与市场定位，都可以围绕不同区域需求来对齐。" } },
      { selector: "[data-svc='hero-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-svc='hero-image-title']", text: { en: "Factory support hero media slot", zh: "工厂服务主视觉素材位" } },
      { selector: "[data-svc='hero-image-text']", text: { en: "Image slot: replace with a line-wide view, project discussion, or factory scene that communicates real production support.", zh: "图片位：建议替换为产线全景、项目沟通或工厂现场横图，表现真实制造支持感。" } },
      { selector: "[data-svc='hero-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-svc='hero-note-text']", text: { en: "Suggested visual: clean product line image or a calm factory-wide scene with room for text, using the INTRO material as the primary reference.", zh: "建议方向：优先参考 INTRO 素材，使用整洁的产品线图或带留白的工厂全景画面。" } },
      { selector: "[data-svc='hero-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-svc='hero-source-1']", text: { en: "Primary image: `assets/INTRO/Raw_Product line_1.HEIC` or `Raw_Product line_2.HEIC`", zh: "优先素材：`assets/INTRO/Raw_Product line_1.HEIC` 或 `Raw_Product line_2.HEIC`" } },
      { selector: "[data-svc='start-kicker']", text: { en: "Manufacturing Support", zh: "制造支持" } },
      { selector: "[data-svc='start-title']", text: { en: "Integrated support from components to final assembly", zh: "从零部件到总装的一体化支持" } },
      { selector: "[data-svc='start-text']", text: { en: "The value here is simple: buyers are speaking directly with a manufacturer that covers key production links across the fan program.", zh: "这里的价值很直接：买家面对的是一家覆盖风扇项目关键生产环节的制造商。" } },
      { selector: "[data-svc='start-card-1-title']", text: { en: "Factory links that support a working project", zh: "支撑项目落地的工厂环节" } },
      { selector: "[data-svc='start-card-1-text']", text: { en: "RichLand can frame the project around motor production, plastics, molds, electronics, metal parts, assembly, product development, and inspection so the buyer sees how the program is actually carried through.", zh: "RichLand 可以围绕电机生产、塑胶、模具、电子、五金、装配、产品开发与检验来组织项目沟通，让买家更清楚一个项目是如何真正被执行下去的。" } },
      { selector: "[data-svc='start-list-1']", text: { en: "Motor and core component understanding before bulk planning", zh: "在量产规划前先理解电机与核心部件逻辑" } },
      { selector: "[data-svc='start-list-2']", text: { en: "Closer alignment between product structure and assembly execution", zh: "让产品结构与装配执行更紧密对齐" } },
      { selector: "[data-svc='start-list-3']", text: { en: "Development, inspection, and output flow discussed in real factory terms", zh: "以真实工厂语境沟通开发、检验与产出流程" } },
      { selector: "[data-svc='start-list-4']", text: { en: "A manufacturer tone that keeps project discussion grounded in real conditions", zh: "以制造商语境让项目讨论始终建立在真实条件上" } },
      { selector: "[data-svc='start-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-svc='start-image-title']", text: { en: "Integrated manufacturing media slot", zh: "一体化制造素材位" } },
      { selector: "[data-svc='start-image-text']", text: { en: "Image slot: replace with a product-line, assembly-zone, or broader factory scene that highlights the manufacturing chain.", zh: "图片位：建议替换为产品线、装配区域或工厂现场图，突出制造链条。" } },
      { selector: "[data-svc='start-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-svc='start-note-text']", text: { en: "Suggested visual: product line image with visible factory order, assembly work, and enough context to suggest integrated production capability.", zh: "建议方向：带有工厂秩序感、装配动作与足够环境信息的产品线图，体现一体化生产能力。" } },
      { selector: "[data-svc='start-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-svc='start-source-1']", text: { en: "Use `assets/INTRO/Raw_Product line_1.HEIC` or `Raw_Product line_2.HEIC`", zh: "建议使用 `assets/INTRO/Raw_Product line_1.HEIC` 或 `Raw_Product line_2.HEIC`" } },
      { selector: "[data-svc='support-kicker']", text: { en: "Core Process", zh: "核心工序" } },
      { selector: "[data-svc='support-title']", text: { en: "Process capability that buyers can understand at a glance", zh: "让买家一眼能读懂的工序能力" } },
      { selector: "[data-svc='support-text']", text: { en: "A small set of real process clips helps buyers read how motor work, assembly, automation, and hand operations connect inside one production line.", zh: "一组真实工序片段，能帮助买家更快理解电机工序、装配、自动化与手工环节在同一条生产线中是如何衔接的。" } },
      { selector: "[data-svc='support-card-1-title']", text: { en: "From motor internals to assembly execution", zh: "从电机内部工序到整机装配执行" } },
      { selector: "[data-svc='support-card-1-text']", text: { en: "The clips show the production story behind consistency, not only the finished fan outside.", zh: "这些片段展示的是一致性背后的制造过程，而不只是成品风扇的外观。" } },
      { selector: "[data-svc='support-card-2-title']", text: { en: "Useful visual proof for OEM / ODM discussion", zh: "适合 OEM / ODM 沟通的直观依据" } },
      { selector: "[data-svc='support-card-2-text']", text: { en: "They help buyers quickly understand whether the factory workflow matches the project level they need.", zh: "它们能帮助买家更快判断，工厂的实际工作流是否匹配项目所需的执行层级。" } },
      { selector: "[data-svc='support-clip-1-title']", text: { en: "Stator coil assembly", zh: "定子线圈装配" } },
      { selector: "[data-svc='support-clip-1-text']", text: { en: "Closer motor-process detail", zh: "更贴近电机工序细节" } },
      { selector: "[data-svc='support-clip-2-title']", text: { en: "Motor-head assembly lines", zh: "电机头装配线" } },
      { selector: "[data-svc='support-clip-2-text']", text: { en: "Line coordination and assembly rhythm", zh: "体现产线协同与装配节奏" } },
      { selector: "[data-svc='support-clip-3-title']", text: { en: "Injection molding automation", zh: "注塑自动化生产" } },
      { selector: "[data-svc='support-clip-3-text']", text: { en: "Automation inside bulk execution", zh: "展示量产执行中的自动化环节" } },
      { selector: "[data-svc='support-clip-4-title']", text: { en: "Manual final assembly", zh: "人工总装" } },
      { selector: "[data-svc='support-clip-4-text']", text: { en: "Manual follow-through in the line", zh: "体现产线中的人工跟进" } },
      { selector: "[data-svc='support-card-3-title']", text: { en: "Automation with human follow-through", zh: "自动化与人工跟进并存" } },
      { selector: "[data-svc='support-card-3-text']", text: { en: "Automatic bottom production and manual work can appear together to show both efficiency and responsible execution in the line.", zh: "自动化底部生产与手工工位并列出现，更能体现这条产线既强调效率，也强调责任执行。" } },
      { selector: "[data-svc='support-card-4-title']", text: { en: "Production consistency for export orders", zh: "面向出口订单的量产一致性" } },
      { selector: "[data-svc='support-card-4-text']", text: { en: "These process references give buyers a more concrete way to evaluate whether the factory can support sustained bulk execution, not just one-time sampling.", zh: "这些工序参考能让买家更具体地判断工厂是否具备持续量产执行能力，而不只是一次性打样能力。" } },
      { selector: "[data-svc='support-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-svc='support-image-title']", text: { en: "Core process media slot", zh: "核心工序素材位" } },
      { selector: "[data-svc='support-image-text']", text: { en: "Image slot: replace with a still from a key process, an assembly scene, or an automation cover frame.", zh: "图片位：建议替换为核心工序截图、装配画面或自动化片段封面。" } },
      { selector: "[data-svc='support-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-svc='support-note-text']", text: { en: "Suggested visual: one process-focused still or short-cover frame that clearly suggests stator coil work, motor assembly, or automated line action.", zh: "建议方向：使用更聚焦工序的静帧或短片封面，明确传达绕线、电机装配或自动化产线动作。" } },
      { selector: "[data-svc='support-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-svc='support-source-1']", text: { en: "`Intro_Core_stator coil assembly.mov` / `Intro_Core_MotorsHead_assemble_lines.mov` / `Intro_Bottom_AutoProduce.mov`", zh: "建议素材：`Intro_Core_stator coil assembly.mov` / `Intro_Core_MotorsHead_assemble_lines.mov` / `Intro_Bottom_AutoProduce.mov`" } },
      { selector: "[data-svc='process-kicker']", text: { en: "Product Range", zh: "产品范围" } },
      { selector: "[data-svc='process-title']", text: { en: "Product breadth that supports different market requirements", zh: "支持不同市场需求的产品宽度" } },
      { selector: "[data-svc='process-text']", text: { en: "The product base is broad enough to support different buyer channels, price levels, and regional requirements without losing focus on fans.", zh: "产品基础足够宽，可以覆盖不同买家渠道、价位带和区域需求，同时仍然保持以风扇为核心。" } },
      { selector: "[data-svc='process-card-1-tag']", text: { en: "Range 01", zh: "范围 01" } },
      { selector: "[data-svc='process-card-1-title']", text: { en: "Pedestal, table, wall, and ceiling fan foundations", zh: "落地扇、台扇、壁扇与吊扇基础线" } },
      { selector: "[data-svc='process-card-1-text']", text: { en: "These remain the core discussion starting points for many distributors and importers evaluating practical volume programs.", zh: "对许多评估实用型批量项目的进口商和分销商来说，这些依然是最核心的讨论起点。" } },
      { selector: "[data-svc='process-card-2-tag']", text: { en: "Range 02", zh: "范围 02" } },
      { selector: "[data-svc='process-card-2-title']", text: { en: "250mm to 500mm size direction", zh: "250mm 到 500mm 的尺寸方向" } },
      { selector: "[data-svc='process-card-2-text']", text: { en: "The profile material helps explain that different size ranges can support different retail, commercial, and regional demand positions.", zh: "公司资料说明了不同尺寸段可以分别支撑不同的零售、商用和区域需求定位。" } },
      { selector: "[data-svc='process-card-3-tag']", text: { en: "Range 03", zh: "范围 03" } },
      { selector: "[data-svc='process-card-3-title']", text: { en: "Mechanical, remote, inverter, and other feature levels", zh: "机械、遥控、变频等功能层级" } },
      { selector: "[data-svc='process-card-3-text']", text: { en: "Feature direction can be introduced as part of project fit without inventing new technical claims beyond the source material.", zh: "功能层级可以作为项目适配的一部分来表达，同时不超出已有资料去额外发明技术卖点。" } },
      { selector: "[data-svc='process-card-4-tag']", text: { en: "Range 04", zh: "范围 04" } },
      { selector: "[data-svc='process-card-4-title']", text: { en: "Support for broader fan programs and related appliance lines", zh: "支持更广风扇项目与相关家电线" } },
      { selector: "[data-svc='process-card-4-text']", text: { en: "The page can acknowledge supporting appliances while still keeping electric fans as the first and strongest business story.", zh: "页面可以承认辅助家电线的存在，但仍然保持电风扇是最核心、最明确的主营故事。" } },
      { selector: "[data-svc='process-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-svc='process-image-title']", text: { en: "Product breadth media slot", zh: "产品宽度素材位" } },
      { selector: "[data-svc='process-image-text']", text: { en: "Image slot: replace with a product-line scene, finished-goods grouping, or an image that suggests specification breadth.", zh: "图片位：建议替换为产品线现场、成品展示或可体现规格宽度的图像。" } },
      { selector: "[data-svc='process-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-svc='process-note-text']", text: { en: "Suggested visual: product line scene, grouped finished fans, or workshop output image that helps the buyer read range and scale.", zh: "建议方向：产品线现场、成组风扇成品，或能帮助买家读取产品范围与规模感的工厂画面。" } },
      { selector: "[data-svc='process-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-svc='process-source-1']", text: { en: "Use `Raw_Product line_2.HEIC` or `Raw_Product line_3.HEIC` as replacement reference", zh: "建议以 `Raw_Product line_2.HEIC` 或 `Raw_Product line_3.HEIC` 作为替换参考" } },
      { selector: "[data-svc='buyer-kicker']", text: { en: "Project Flow", zh: "项目流程" } },
      { selector: "[data-svc='buyer-title']", text: { en: "From inquiry to production follow-up in four practical steps", zh: "从询盘到生产跟进的四个务实步骤" } },
      { selector: "[data-svc='buyer-text']", text: { en: "After factory capability and product range are clear, buyers mainly need a simple view of how the project moves forward.", zh: "当工厂能力和产品范围清楚之后，买家更需要的是一个简明的项目推进路径。" } },
      { selector: "[data-svc='buyer-card-1-title']", text: { en: "1. Confirm category and market direction", zh: "1. 确认品类与市场方向" } },
      { selector: "[data-svc='buyer-card-1-point-1']", text: { en: "Confirm target product line", zh: "确认目标产品线" } },
      { selector: "[data-svc='buyer-card-1-point-2']", text: { en: "Align core specification range", zh: "对齐核心规格范围" } },
      { selector: "[data-svc='buyer-card-1-point-3']", text: { en: "Review market and usage", zh: "判断市场与使用场景" } },
      { selector: "[data-svc='buyer-card-1-point-4']", text: { en: "Understand quantity expectations and project background", zh: "了解数量预期与项目背景" } },
      { selector: "[data-svc='buyer-card-2-title']", text: { en: "2. Align model, packaging, and OEM / ODM scope", zh: "2. 对齐型号、包装与 OEM / ODM 范围" } },
      { selector: "[data-svc='buyer-card-2-point-1']", text: { en: "Narrow models and setup", zh: "收窄型号与配置" } },
      { selector: "[data-svc='buyer-card-2-point-2']", text: { en: "Confirm packaging and label requirements", zh: "确认包装与标签要求" } },
      { selector: "[data-svc='buyer-card-2-point-3']", text: { en: "Define branding and OEM / ODM scope", zh: "明确品牌与 OEM / ODM 范围" } },
      { selector: "[data-svc='buyer-card-2-point-4']", text: { en: "Review certification, lead time, and support needs", zh: "评估认证、交期与配套需求" } },
      { selector: "[data-svc='buyer-card-3-title']", text: { en: "3. Move into sample or quotation review", zh: "3. 进入打样或报价评估" } },
      { selector: "[data-svc='buyer-card-3-point-1']", text: { en: "Provide sample or quotation direction", zh: "提供样品或报价方向" } },
      { selector: "[data-svc='buyer-card-3-point-2']", text: { en: "Check cost and feasibility", zh: "判断成本与可行性" } },
      { selector: "[data-svc='buyer-card-3-point-3']", text: { en: "Align key commercial terms", zh: "对齐关键商务条件" } },
      { selector: "[data-svc='buyer-card-3-point-4']", text: { en: "Decide whether to enter formal cooperation", zh: "判断是否进入正式合作阶段" } },
      { selector: "[data-svc='buyer-card-4-title']", text: { en: "4. Confirm order and move into production follow-up", zh: "4. 确认订单并进入生产跟进" } },
      { selector: "[data-svc='buyer-card-4-point-1']", text: { en: "Confirm sample, price, and terms", zh: "确认样品、价格与条款" } },
      { selector: "[data-svc='buyer-card-4-point-2']", text: { en: "Arrange PI, deposit, and schedule", zh: "安排 PI、定金与排期" } },
      { selector: "[data-svc='buyer-card-4-point-3']", text: { en: "Follow quality and delivery milestones", zh: "跟进品质与交付节点" } },
      { selector: "[data-svc='buyer-card-4-point-4']", text: { en: "Prepare shipment and follow-up documents", zh: "准备出货与后续交付资料" } },
      { selector: "[data-svc='buyer-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-svc='buyer-image-title']", text: { en: "Project flow media slot", zh: "项目流程素材位" } },
      { selector: "[data-svc='buyer-image-text']", text: { en: "Image slot: replace with sample review, meeting discussion, line coordination, or shipment-preparation imagery.", zh: "图片位：建议替换为样品评审、会议沟通、产线协同或出货准备图。" } },
      { selector: "[data-svc='buyer-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-svc='buyer-note-text']", text: { en: "Suggested visual: meeting table, sample review, production discussion, or a calm workflow image that suggests forward movement.", zh: "建议方向：会议桌、样品评审、生产讨论，或能体现项目推进感的平稳流程图像。" } },
      { selector: "[data-svc='clips-kicker']", text: { en: "Process Clips", zh: "工序片段" } },
      { selector: "[data-svc='clips-title']", text: { en: "Small clip placeholders tied to real factory process footage", zh: "与真实工厂工序视频对应的小型片段占位" } },
      { selector: "[data-svc='clips-text']", text: { en: "These cards are not autoplay videos. They are structured placeholders that can later be turned into still covers, short loops, or linked media without changing the page layout.", zh: "这些卡片不是自动播放视频，而是结构化的占位块，后续可替换为封面图、短循环或外链媒体，而不需要重做页面结构。" } },
      { selector: "[data-svc='clips-card-1-tag']", text: { en: "Clip 01", zh: "片段 01" } },
      { selector: "[data-svc='clips-card-1-title']", text: { en: "Stator coil assembly", zh: "定子线圈装配" } },
      { selector: "[data-svc='clips-card-1-text']", text: { en: "Use this card to explain motor-related process seriousness and internal component work behind product stability.", zh: "这个卡片可用于说明电机相关工序的严谨度，以及产品稳定性背后的内部部件工作。" } },
      { selector: "[data-svc='clips-card-2-tag']", text: { en: "Clip 02", zh: "片段 02" } },
      { selector: "[data-svc='clips-card-2-title']", text: { en: "Motor-head assembly lines", zh: "电机头装配线" } },
      { selector: "[data-svc='clips-card-2-text']", text: { en: "Use this card to show coordinated line work and give buyers a more tangible sense of how the factory executes fan production.", zh: "这个卡片可用于展示协同装配线工作，让买家更直观地感受到工厂如何执行风扇生产。" } },
      { selector: "[data-svc='clips-card-3-tag']", text: { en: "Clip 03", zh: "片段 03" } },
      { selector: "[data-svc='clips-card-3-title']", text: { en: "Automatic bottom production", zh: "底部自动化生产" } },
      { selector: "[data-svc='clips-card-3-text']", text: { en: "Use this card to communicate efficiency, repeatability, and the role of automation inside the broader manufacturing chain.", zh: "这个卡片可用于传达效率、重复一致性，以及自动化在更大制造链条中的作用。" } },
      { selector: "[data-svc='cta-kicker']", text: { en: "Start Inquiry", zh: "开始询盘" } },
      { selector: "[data-svc='cta-title']", text: { en: "Move from factory understanding into a workable inquiry", zh: "从理解工厂能力进入可执行的询盘" } },
      { selector: "[data-svc='cta-text']", text: { en: "When the buyer already understands the product direction, process basis, and cooperation mode, the next step should be a direct inquiry with category, quantity, market, and OEM / ODM expectations.", zh: "当买家已经理解产品方向、工序基础与合作模式之后，下一步就应当是围绕品类、数量、市场和 OEM / ODM 预期发起更直接的询盘。" } },
      { selector: "[data-svc='cta-button']", text: { en: "Send Inquiry", zh: "发送询盘" } }
    ],
    job: [
      { selector: "title", text: { en: "Job | RichLand Ltd.", zh: "人才招聘 | RichLand Ltd." }, property: "textContent" },
      { selector: "[data-job='hero-kicker']", text: { en: "Job", zh: "人才招聘" } },
      { selector: "[data-job='hero-title']", text: { en: "Work close to real products and real manufacturing", zh: "贴近真实产品与真实制造的工作环境" } },
      { selector: "[data-job='hero-text']", text: { en: "Join a team where daily work is tied to visible products, real production rhythm, and practical coordination between office and factory.", zh: "加入团队后，你接触的是看得见的产品、真实的生产安排，以及办公室与工厂紧密配合的日常节奏。" } },
      { selector: "[data-job='hero-card-1-title']", text: { en: "Real products", zh: "真实产品" } },
      { selector: "[data-job='hero-card-1-text']", text: { en: "The work starts from actual models, samples, and production details.", zh: "工作会从真实型号、样品和生产细节开始。" } },
      { selector: "[data-job='hero-card-2-title']", text: { en: "Factory-linked rhythm", zh: "贴近工厂节奏" } },
      { selector: "[data-job='hero-card-2-text']", text: { en: "Office work and workshop follow-up stay closely connected.", zh: "办公室工作与车间跟进保持紧密连接。" } },
      { selector: "[data-job='hero-card-3-title']", text: { en: "Practical growth", zh: "务实成长" } },
      { selector: "[data-job='hero-card-3-text']", text: { en: "People build judgment through products, process, and execution.", zh: "成长来自对产品、流程与执行的理解。" } },
      { selector: "[data-job='real-kicker']", text: { en: "Real Work", zh: "真实工作" } },
      { selector: "[data-job='real-title']", text: { en: "Work close to real products and real manufacturing", zh: "贴近真实产品与真实制造的工作环境" } },
      { selector: "[data-job='real-text']", text: { en: "After joining the team, people work with visible products, real production arrangement, and the daily rhythm between office and factory.", zh: "加入团队后，你接触的是看得见的产品、真实的生产安排，以及办公室与工厂紧密配合的日常节奏。" } },
      { selector: "[data-job='real-card-1-title']", text: { en: "Real products, not only paperwork", zh: "真实产品，而不只是纸面资料" } },
      { selector: "[data-job='real-card-1-text']", text: { en: "Work starts from actual products, samples, and model details.", zh: "工作内容围绕实际产品、样品和型号判断展开。" } },
      { selector: "[data-job='real-card-2-title']", text: { en: "Work follows order and production rhythm", zh: "围绕订单与生产节奏展开工作" } },
      { selector: "[data-job='real-card-2-text']", text: { en: "People can see how order progress and factory timing relate to each other.", zh: "你会更直观地看到订单推进和现场执行之间的关系。" } },
      { selector: "[data-job='real-card-3-title']", text: { en: "Office and factory coordination is visible", zh: "看得见办公室与工厂的协作" } },
      { selector: "[data-job='real-card-3-text']", text: { en: "Communication does not stay on paper. It connects to real factory arrangement.", zh: "沟通不是停留在文件里，而是连接到实际生产安排。" } },
      { selector: "[data-job='real-mini-title']", text: { en: "Daily work stays close to visible factory reality", zh: "日常工作始终贴近真实工厂现场" } },
      { selector: "[data-job='real-mini-text']", text: { en: "The pace here is shaped by products, timing, and factory follow-through rather than abstract internal process alone.", zh: "这里的节奏由产品、交期和工厂跟进共同决定，而不是停留在抽象流程上。" } },
      { selector: "[data-job='real-mini-note-1-title']", text: { en: "Visible progress", zh: "进展可见" } },
      { selector: "[data-job='real-mini-note-1-text']", text: { en: "People can see how work moves from discussion into action.", zh: "可以看见工作如何从讨论走向执行。" } },
      { selector: "[data-job='real-mini-note-2-title']", text: { en: "Practical coordination", zh: "协作务实" } },
      { selector: "[data-job='real-mini-note-2-text']", text: { en: "Tasks connect naturally to workshop and order follow-up.", zh: "任务会自然连接到车间与订单跟进。" } },
      { selector: "[data-job='state-kicker']", text: { en: "Working Environment", zh: "工作环境" } },
      { selector: "[data-job='state-title']", text: { en: "Working environment", zh: "工作环境" } },
      { selector: "[data-job='state-text']", text: { en: "The environment here values order, cooperation, and follow-through, and it suits people who want to learn, work steadily, and care about detail.", zh: "这里的工作环境更强调秩序、配合和落实，适合愿意学习、做事稳、重视细节的人。" } },
      { selector: "[data-job='state-card-1-title']", text: { en: "Orderly teamwork and clear handoff", zh: "有秩序的协作与清晰交接" } },
      { selector: "[data-job='state-card-1-text']", text: { en: "Information flow and handoff are expected to stay clear and actionable.", zh: "信息传递和任务交接会更强调明确与可执行。" } },
      { selector: "[data-job='state-card-2-title']", text: { en: "Connect office, product, and line communication", zh: "连接办公室、产品与产线沟通" } },
      { selector: "[data-job='state-card-2-text']", text: { en: "Work naturally links documents, product judgment, and factory coordination.", zh: "工作会自然连接文件、产品判断和现场配合。" } },
      { selector: "[data-job='state-card-3-title']", text: { en: "More focus on execution and accuracy", zh: "更重视执行、准确与落地" } },
      { selector: "[data-job='state-card-3-text']", text: { en: "The style here is practical and centered on moving work forward.", zh: "做事方式偏务实，重点在于把事情真正推进下去。" } },
      { selector: "[data-job='touch-kicker']", text: { en: "What You Join", zh: "你会加入什么" } },
      { selector: "[data-job='touch-title']", text: { en: "What you join", zh: "你会加入什么" } },
      { selector: "[data-job='touch-text']", text: { en: "You gradually understand how an export manufacturer connects product, process, site work, and delivery into one whole.", zh: "你会逐步理解一个制造型出口企业，如何把产品、流程、现场和交付真正连接起来。" } },
      { selector: "[data-job='touch-card-1-title']", text: { en: "Real product lines and model families", zh: "接触真实产品线与型号系列" } },
      { selector: "[data-job='touch-card-1-text']", text: { en: "People begin by understanding the structure behind the product line.", zh: "从产品线结构开始建立对业务的理解。" } },
      { selector: "[data-job='touch-card-2-title']", text: { en: "Sample, packaging, and order follow-up", zh: "参与样品、包装与订单推进" } },
      { selector: "[data-job='touch-card-2-text']", text: { en: "Work stays close to key stages inside project progress.", zh: "工作会贴近项目推进的关键节点。" } },
      { selector: "[data-job='touch-card-3-title']", text: { en: "Closer to assembly, inspection, and shipment", zh: "更贴近装配、检验与出货场景" } },
      { selector: "[data-job='touch-card-3-text']", text: { en: "People can see how manufacturing links affect delivery results.", zh: "你会看到制造环节如何影响交付结果。" } },
      { selector: "[data-job='touch-card-4-title']", text: { en: "Understand how a manufacturer coordinates internally", zh: "理解制造企业内部如何协同" } },
      { selector: "[data-job='touch-card-4-text']", text: { en: "The relationship between product, factory, and business becomes clearer over time.", zh: "产品、工厂和业务之间的关系会越来越清楚。" } },
      { selector: "[data-job='touch-mini-title']", text: { en: "Real work scenes make the role easier to understand", zh: "真实工作场景会让岗位更容易理解" } },
      { selector: "[data-job='touch-mini-text']", text: { en: "This is not abstract employer branding. People join visible product, process, and delivery work.", zh: "这不是抽象的雇主宣传，而是贴近产品、流程和交付的真实工作。" } },
      { selector: "[data-job='touch-mini-note-1-title']", text: { en: "Product-linked", zh: "贴近产品" } },
      { selector: "[data-job='touch-mini-note-1-text']", text: { en: "Closer to real models, samples, and decisions.", zh: "更贴近真实型号、样品和判断过程。" } },
      { selector: "[data-job='touch-mini-note-2-title']", text: { en: "Factory-linked", zh: "贴近工厂" } },
      { selector: "[data-job='touch-mini-note-2-text']", text: { en: "Closer to assembly, inspection, and shipment rhythm.", zh: "更贴近装配、检验和出货节奏。" } },
      { selector: "[data-job='fit-kicker']", text: { en: "Growth Path", zh: "成长路径" } },
      { selector: "[data-job='fit-title']", text: { en: "Growth path", zh: "成长路径" } },
      { selector: "[data-job='fit-text']", text: { en: "Growth here comes from product understanding, process exposure, and the ability to make work more reliable.", zh: "这里的成长，来自对产品的理解、对流程的接触，以及把事情做扎实的能力。" } },
      { selector: "[data-job='fit-card-1-title']", text: { en: "From product knowledge to product judgment", zh: "从认识产品到形成产品判断" } },
      { selector: "[data-job='fit-card-1-text']", text: { en: "After learning categories and models, people begin to form real judgment.", zh: "理解品类和型号之后，开始形成判断能力。" } },
      { selector: "[data-job='fit-card-2-title']", text: { en: "From task completion to process awareness", zh: "从完成任务到看懂整个流程" } },
      { selector: "[data-job='fit-card-2-text']", text: { en: "People gradually see how one task fits into a larger chain.", zh: "逐步理解一个动作如何落在更大的工作链条里。" } },
      { selector: "[data-job='fit-card-3-title']", text: { en: "From execution detail to reliability", zh: "从执行细节到建立可靠性" } },
      { selector: "[data-job='fit-card-3-text']", text: { en: "Steady execution over time becomes stronger credibility.", zh: "长期的稳定执行，会转化成更强的可信度。" } },
      { selector: "[data-job='fit-card-4-title']", text: { en: "A base for trade, product, or manufacturing roles", zh: "为外贸、产品或制造岗位打基础" } },
      { selector: "[data-job='fit-card-4-text']", text: { en: "These experiences become a solid base for future roles.", zh: "这些经验能成为后续岗位发展的扎实基础。" } },
      { selector: "[data-job='fit-mini-title']", text: { en: "Growth comes from products, process, and dependable follow-through", zh: "成长来自产品、流程与可靠执行" } },
      { selector: "[data-job='fit-mini-text']", text: { en: "The learning path here is built on repetition, product understanding, and steadily stronger coordination ability.", zh: "这里的成长路径，建立在重复实践、产品理解与逐步增强的协同能力上。" } },
      { selector: "[data-job='fit-mini-note-1-title']", text: { en: "Product judgment", zh: "产品判断" } },
      { selector: "[data-job='fit-mini-note-1-text']", text: { en: "People grow by learning how products differ in real use.", zh: "通过理解产品在真实使用中的差异，逐步建立判断。" } },
      { selector: "[data-job='fit-mini-note-2-title']", text: { en: "Process awareness", zh: "流程意识" } },
      { selector: "[data-job='fit-mini-note-2-text']", text: { en: "People grow by seeing how each task affects delivery.", zh: "通过理解每个动作如何影响交付，逐步看懂流程。" } },
      { selector: "[data-job='contact-kicker']", text: { en: "Who Fits", zh: "适合的人" } },
      { selector: "[data-job='contact-title']", text: { en: "Who fits", zh: "适合的人" } },
      { selector: "[data-job='contact-text']", text: { en: "We welcome candidates who want to learn through real work and who take steady, careful execution seriously.", zh: "我们欢迎那些愿意从真实工作中学习，并把事情认真做好的候选人。" } },
      { selector: "[data-job='contact-card-1-title']", text: { en: "Detail-minded, steady, and responsible", zh: "适合细心、稳定、有责任感的人" } },
      { selector: "[data-job='contact-card-1-text']", text: { en: "People who work a bit more carefully and steadily fit better here.", zh: "做事细一点、稳一点，会更适合这里的节奏。" } },
      { selector: "[data-job='contact-card-2-title']", text: { en: "Good for people who want long-term accumulation", zh: "适合愿意长期积累的人" } },
      { selector: "[data-job='contact-card-2-text']", text: { en: "This is not a short-term hype environment. It suits gradual growth.", zh: "这不是追求短期热闹的环境，而是更适合慢慢积累。" } },
      { selector: "[data-job='contact-card-3-title']", text: { en: "Use the normal contact path directly", zh: "通过正常联系路径直接沟通" } },
      { selector: "[data-job='contact-card-3-text']", text: { en: "People can directly introduce their background and what they want to learn.", zh: "可以直接介绍背景、兴趣和想进一步了解的方向。" } },
      { selector: "[data-job='contact-mini-title']", text: { en: "A straightforward way to introduce yourself", zh: "一条直接介绍自己的路径" } },
      { selector: "[data-job='contact-mini-text']", text: { en: "The contact route should feel direct, calm, and suitable for a manufacturer-based company.", zh: "联系路径应该直接、平稳，也更符合制造企业的沟通方式。" } },
      { selector: "[data-job='contact-mini-note-1-title']", text: { en: "Clear introduction", zh: "清楚介绍自己" } },
      { selector: "[data-job='contact-mini-note-1-text']", text: { en: "Share your background and the type of work you want to do.", zh: "说明自己的背景，以及想接触的工作方向。" } },
      { selector: "[data-job='contact-mini-note-2-title']", text: { en: "Practical communication", zh: "务实沟通" } },
      { selector: "[data-job='contact-mini-note-2-text']", text: { en: "Use the normal company contact path for the first conversation.", zh: "通过公司的正常联系路径展开第一轮沟通。" } },
      { selector: "[data-job='cta-kicker']", text: { en: "Recruitment Contact", zh: "招聘联系" } },
      { selector: "[data-job='cta-title']", text: { en: "Start a direct job conversation with a clear introduction", zh: "通过清晰介绍开启一段直接的招聘沟通" } },
      { selector: "[data-job='cta-text']", text: { en: "If you want to introduce your background or learn more about joining the company, use this contact form instead of the buyer inquiry route. A short, clear introduction is enough to start.", zh: "如果你想介绍自己的背景，或进一步了解加入公司的可能性，请使用这里的招聘联系表单，而不是买家询盘入口。简短、清楚的自我介绍就足够开始沟通。" } },
      { selector: "[data-job='contact-point-1']", text: { en: "Briefly describe your current background, the direction you want to explore, and why you are interested in a manufacturer-based company.", zh: "可以简单说明目前的工作背景、想接触的方向，以及为什么对制造型企业感兴趣。" } },
      { selector: "[data-job='contact-point-2']", text: { en: "If you already have experience in products, factory work, merchandising, foreign trade, or quality follow-up, you can mention it directly.", zh: "如果你已经有相关产品、工厂、跟单、外贸或品质经验，也可以直接写清楚。" } },
      { selector: "[data-job='contact-point-3']", text: { en: "If your purpose is business cooperation or product inquiry, please use the buyer inquiry route so the two kinds of messages stay separate.", zh: "如果你的目的是商务合作或产品询盘，请使用买家询盘入口，避免两类信息混在一起。" } },
      { selector: "[data-job='direct-title']", text: { en: "Direct contact details", zh: "直接联系方式" } },
      { selector: "[data-job='direct-text']", text: { en: "You can also use the existing company email if you prefer to send a short introduction directly.", zh: "如果你更希望直接发送一段简短介绍，也可以使用现有公司邮箱联系。" } },
      { selector: "[data-job='business-note']", text: { en: "For product or OEM / ODM discussion, use the buyer inquiry route.", zh: "如果是产品合作或 OEM / ODM 讨论，请使用买家询盘入口。" } },
      { selector: "[data-job='business-link']", text: { en: "Business Inquiry", zh: "商务询盘" } },
      { selector: "[data-job='field-name-label']", text: { en: "Name", zh: "姓名" } },
      { selector: "[data-job='field-phone-label']", text: { en: "Phone or WeChat", zh: "电话或微信" } },
      { selector: "[data-job='field-email-label']", text: { en: "Email", zh: "邮箱" } },
      { selector: "[data-job='field-direction-label']", text: { en: "Interested Direction / Position", zh: "意向方向 / 岗位" } },
      { selector: "[data-job='field-background-label']", text: { en: "Current Background", zh: "当前背景" } },
      { selector: "[data-job='field-message-label']", text: { en: "Message / Self Introduction", zh: "留言 / 自我介绍" } },
      { selector: "#job-email", text: { en: "name@example.com", zh: "name@example.com" }, property: "placeholder" },
      { selector: "#job-direction", text: { en: "e.g. Sales support / Product / Factory follow-up", zh: "例如：业务支持 / 产品 / 工厂跟进" }, property: "placeholder" },
      { selector: "#job-background", text: { en: "e.g. 2 years in factory merchandising / fresh graduate / export assistant", zh: "例如：2年工厂跟单 / 应届毕业生 / 外贸助理" }, property: "placeholder" },
      { selector: "#job-message", text: { en: "Share your experience, what kind of work you want to learn, and any details you want the company to know.", zh: "可以介绍你的经历、想接触的工作方向，以及希望公司了解的内容。" }, property: "placeholder" },
      { selector: "[data-job='form-note']", text: { en: "<strong>Note:</strong> This form is for job-related contact only.", zh: "<strong>说明：</strong>这个表单只用于招聘相关联系。" }, property: "innerHTML" },
      { selector: "[data-job='cta-button']", text: { en: "Send Job Contact", zh: "发送招聘联系" } }
    ],
    culture: [
      { selector: "title", text: { en: "Culture | RichLand Ltd.", zh: "企业文化 | RichLand Ltd." }, property: "textContent" },
      { selector: "[data-cul='hero-kicker']", text: { en: "Culture", zh: "企业文化" } },
      { selector: "[data-cul='hero-title']", text: { en: "How the factory works, communicates, and follows through every day", zh: "从工厂运作、沟通方式到日常执行所体现出来的企业文化" } },
      { selector: "[data-cul='hero-text']", text: { en: "For us, culture is not a slogan on the wall. It shows in how products are arranged on the line, how samples and packaging are confirmed, how orders are followed, and how we reply to customers when details need to be checked again.", zh: "对我们来说，企业文化不是挂在墙上的口号，而是体现在产线上的产品摆放、样品和包装的确认、订单的跟进方式，以及客户细节需要再次核实时我们如何回复。" } },
      { selector: "[data-cul='hero-fact-1-title']", text: { en: "Factory order that can be seen", zh: "能够看得见的工厂秩序" } },
      { selector: "[data-cul='hero-fact-1-text']", text: { en: "Visitors should be able to see it in workshop condition, line arrangement, and the way daily work is carried out.", zh: "客户或合作方来到工厂时，应该能从车间状态、产线安排和日常作业方式中直接感受到这一点。" } },
      { selector: "[data-cul='hero-fact-2-title']", text: { en: "Cooperation that stays practical", zh: "始终务实的合作方式" } },
      { selector: "[data-cul='hero-fact-2-text']", text: { en: "Customers should feel it in sample follow-up, production updates, packaging confirmation, and shipment preparation.", zh: "客户也应该能在样品跟进、生产更新、包装确认和出货准备这些环节里感受到这种做事方式。" } },
      { selector: "[data-cul='hero-fact-3-title']", text: { en: "Long-term operation mindset", zh: "长期经营心态" } },
      { selector: "[data-cul='hero-fact-3-text']", text: { en: "Development history and factory expansion give the culture page a stronger sense of continuity and durable management.", zh: "发展历程和工厂扩展，为文化页提供了更强的连续性与长期经营感。" } },
      { selector: "[data-cul='hero-fact-4-title']", text: { en: "Integrity in cooperation", zh: "合作中的诚信" } },
      { selector: "[data-cul='hero-fact-4-text']", text: { en: "The page now links internal values with how customers experience communication, timing, and long-term partnership.", zh: "页面现在把内部价值观与客户实际感受到的沟通方式、周期预期和长期合作联系了起来。" } },
      { selector: "[data-cul='hero-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-cul='hero-image-title']", text: { en: "Culture hero media slot", zh: "企业文化主视觉素材位" } },
      { selector: "[data-cul='hero-image-text']", text: { en: "Image slot: replace with a clean workshop, corridor order, or steady production environment wide image.", zh: "图片位：建议替换为整洁车间、通道秩序或稳定生产环境横图。" } },
      { selector: "[data-cul='hero-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-cul='hero-note-text']", text: { en: "Suggested visual: clean workshop view, visible line order, or a responsible manufacturing environment with calm light and space.", zh: "建议方向：整洁车间视角、可见的产线秩序，或光线平稳、有责任感的制造环境。" } },
      { selector: "[data-cul='hero-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-cul='hero-source-1']", text: { en: "Use `assets/INTRO/Raw_Product line_3.HEIC`", zh: "建议使用 `assets/INTRO/Raw_Product line_3.HEIC`" } },
      { selector: "[data-cul='values-kicker']", text: { en: "Factory Floor", zh: "工厂现场" } },
      { selector: "[data-cul='values-title']", text: { en: "Culture can be seen first in the workshop, the line, and daily execution", zh: "企业文化首先体现在车间、产线和日常执行里" } },
      { selector: "[data-cul='values-text']", text: { en: "Before anyone talks about values, people usually notice the basics: whether the workshop is orderly, whether materials are placed properly, whether hand work is careful, and whether the line runs in a controlled way.", zh: "在谈价值观之前，人们通常会先看到最基础的东西：车间是不是有秩序，物料摆放是不是规范，手工作业是不是细致，产线是不是在受控状态下运行。" } },
      { selector: "[data-cul='values-card-1-title']", text: { en: "Order and visible standards", zh: "秩序与可见标准" } },
      { selector: "[data-cul='values-card-1-text']", text: { en: "We believe factory discipline starts from clear line arrangement, clean work areas, and a production site that is managed every day, not only when visitors arrive.", zh: "我们认为工厂秩序首先体现在产线安排是否清楚、工作区域是否整洁，以及现场是否在每天都被认真管理，而不是只在有客户来访时才整理。" } },
      { selector: "[data-cul='values-card-2-title']", text: { en: "Care in manual work", zh: "体现在手工作业里的细致" } },
      { selector: "[data-cul='values-card-2-text']", text: { en: "Hand assembly, parts handling, and checking work still matter. They show whether people treat the product seriously before it goes into carton packing and shipment.", zh: "手工装配、零件处理和检查工作仍然很重要。它们能体现出，在产品进入包装装箱和出货前，工作人员是否真正认真对待每一个细节。" } },
      { selector: "[data-cul='values-card-3-title']", text: { en: "Automation with discipline", zh: "带有纪律性的自动化" } },
      { selector: "[data-cul='values-card-3-text']", text: { en: "Automated steps suggest efficiency, but the cultural message comes from how they fit into a controlled production system.", zh: "自动化环节可以传达效率，但真正体现文化的是它如何被纳入一个受控、有秩序的生产系统。" } },
      { selector: "[data-cul='values-card-4-title']", text: { en: "A workplace that looks managed", zh: "一个看起来被认真管理的工作场所" } },
      { selector: "[data-cul='values-card-4-text']", text: { en: "The visual environment itself becomes evidence of whether the company works with care, consistency, and self-discipline.", zh: "工作环境本身，就是公司是否以细致、一致性和自律来经营的证据。" } },
      { selector: "[data-cul='values-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-cul='values-image-title']", text: { en: "Factory floor culture media slot", zh: "工厂现场文化素材位" } },
      { selector: "[data-cul='values-image-text']", text: { en: "Image slot: replace with workshop, hand-work, or automation process imagery.", zh: "图片位：建议替换为车间现场、手工工位或自动化工序画面。" } },
      { selector: "[data-cul='values-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-cul='values-note-text']", text: { en: "Suggested visual: hand work, automatic bottom production, or a workshop image that makes the culture feel built into the line.", zh: "建议方向：手工工位、底部自动化生产，或任何让人感受到文化嵌入产线中的工厂图像。" } },
      { selector: "[data-cul='values-source-title']", text: { en: "Suggested source", zh: "建议来源" } },
      { selector: "[data-cul='values-source-1']", text: { en: "`Intro_hand_work.mov` / `Intro_Bottom_AutoProduce.mov` / `Raw_Product line_3.HEIC`", zh: "建议素材：`Intro_hand_work.mov` / `Intro_Bottom_AutoProduce.mov` / `Raw_Product line_3.HEIC`" } },
      { selector: "[data-cul='practice-kicker']", text: { en: "Long-Term Operation", zh: "长期经营" } },
      { selector: "[data-cul='practice-title']", text: { en: "Long-term operation is reflected in products, factory investment, and repeat business", zh: "长期经营体现在产品、工厂投入与持续合作之中" } },
      { selector: "[data-cul='practice-text']", text: { en: "A manufacturer is tested over time. Customers will look at whether the company keeps developing product lines, maintains production conditions, and continues to handle orders in a stable and responsible way.", zh: "一家制造企业的可靠性，需要时间来验证。客户会看这家公司是否持续开发产品线、维护生产条件，并且能够长期稳定、负责任地处理订单。" } },
      { selector: "[data-cul='practice-step-1']", text: { en: "Milestone 01", zh: "节点 01" } },
      { selector: "[data-cul='practice-card-1-title']", text: { en: "Built on long-term fan manufacturing", zh: "建立在长期风扇制造基础之上" } },
      { selector: "[data-cul='practice-card-1-text']", text: { en: "Years of working on fan models, parts, assembly, and follow-up have shaped a working style that values steady execution more than short-term promotion.", zh: "长期围绕风扇型号、零部件、装配和订单跟进开展工作，让公司的做事方式更重视稳定执行，而不是短期宣传。" } },
      { selector: "[data-cul='practice-step-2']", text: { en: "Milestone 02", zh: "节点 02" } },
      { selector: "[data-cul='practice-card-2-title']", text: { en: "Continued factory investment", zh: "持续的工厂投入" } },
      { selector: "[data-cul='practice-card-2-text']", text: { en: "Production space, workshop arrangement, and supporting facilities matter because they affect scheduling, line coordination, and the ability to keep orders moving.", zh: "生产空间、车间布局和配套设施之所以重要，是因为它们会直接影响排产、产线协同，以及订单能否顺利往前推进。" } },
      { selector: "[data-cul='practice-step-3']", text: { en: "Milestone 03", zh: "节点 03" } },
      { selector: "[data-cul='practice-card-3-title']", text: { en: "Quality handled through daily control", zh: "通过日常控制来落实质量" } },
      { selector: "[data-cul='practice-card-3-text']", text: { en: "For us, quality means checking details during production, following sample standards, and reducing avoidable problems before goods are packed and shipped.", zh: "对我们来说，质量不是一句口号，而是生产中检查细节、按照样品标准执行，并在产品装箱出货前尽量减少可避免的问题。" } },
      { selector: "[data-cul='practice-step-4']", text: { en: "Milestone 04", zh: "节点 04" } },
      { selector: "[data-cul='practice-card-4-title']", text: { en: "Stable order follow-up and delivery execution", zh: "稳定的订单跟进与交付推进" } },
      { selector: "[data-cul='practice-card-4-text']", text: { en: "From sample approval and packaging check to production scheduling and shipment preparation, long-term cooperation is also shown in whether each order is pushed forward clearly, steadily, and with responsibility.", zh: "从样品确认、包装核对到生产排期和出货准备，长期合作也体现在每一票订单是否被持续、清楚、负责任地推进。" } },
      { selector: "[data-cul='practice-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-cul='practice-image-title']", text: { en: "Long-term operation media slot", zh: "长期经营素材位" } },
      { selector: "[data-cul='practice-image-text']", text: { en: "Image slot: replace with factory-area, line-extension, or continuity-focused imagery.", zh: "图片位：建议替换为厂区、产线延展或体现持续经营感的图像。" } },
      { selector: "[data-cul='practice-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-cul='practice-note-text']", text: { en: "Suggested visual: broader factory environment, line extension, or any scene that suggests continuity and maintained operations.", zh: "建议方向：更广的厂区环境、产线延展，或任何能体现持续运营状态的场景。" } },
      { selector: "[data-cul='customer-kicker']", text: { en: "Cooperation Integrity", zh: "合作诚信" } },
      { selector: "[data-cul='customer-title']", text: { en: "Customers should feel the culture in the way work is discussed and followed through", zh: "客户应当从沟通和执行中感受到这种企业文化" } },
      { selector: "[data-cul='customer-text']", text: { en: "For overseas buyers and long-term partners, culture is not an internal word. It is felt in how clearly the factory discusses models, answers packaging questions, updates order progress, and prepares shipment details.", zh: "对海外买家和长期合作伙伴来说，企业文化不是内部概念，而是体现在工厂如何讨论型号、如何回复包装问题、如何更新订单进度，以及如何准备出货细节。" } },
      { selector: "[data-cul='customer-list-1']", text: { en: "Use truthful language instead of exaggerated promises", zh: "用真实表达代替夸大承诺" } },
      { selector: "[data-cul='customer-list-2']", text: { en: "Keep quantity, timing, and next steps clearer for buyers", zh: "让数量、周期与下一步对买家更清楚" } },
      { selector: "[data-cul='customer-list-3']", text: { en: "Make communication practical enough to support decision-making", zh: "让沟通足够务实，真正支持决策" } },
      { selector: "[data-cul='customer-list-4']", text: { en: "Build trust through consistency rather than performance or showmanship", zh: "通过一致性建立信任，而不是靠表演感" } },
      { selector: "[data-cul='customer-card-1-title']", text: { en: "Reliable communication", zh: "可靠沟通" } },
      { selector: "[data-cul='customer-card-1-text']", text: { en: "We try to keep communication clear on model selection, sample comments, packaging details, quantity, delivery timing, and what still needs to be confirmed before production.", zh: "我们尽量把型号选择、样品修改、包装细节、数量、交期以及投产前仍需确认的事项说清楚，让沟通更直接有效。" } },
      { selector: "[data-cul='customer-card-2-title']", text: { en: "Long-term cooperation", zh: "长期合作" } },
      { selector: "[data-cul='customer-card-2-text']", text: { en: "We value repeat business, which means handling inquiries, order follow-up, and after-shipment questions in a steady way rather than treating one order as the end of the relationship.", zh: "我们重视回头客和长期合作，因此不把一张订单当作合作的终点，而是希望在询盘、订单跟进和出货后的问题处理上都保持稳定和负责。" } },
      { selector: "[data-cul='customer-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-cul='customer-image-title']", text: { en: "Partner trust media slot", zh: "合作信任素材位" } },
      { selector: "[data-cul='customer-image-text']", text: { en: "Image slot: replace with communication, sample review, or calm cooperation scenes.", zh: "图片位：建议替换为沟通、样品评审或平稳合作场景。" } },
      { selector: "[data-cul='customer-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-cul='customer-note-text']", text: { en: "Suggested visual: table discussion, sample review, or any calm partner-facing scene that feels credible and measured.", zh: "建议方向：桌面讨论、样品评审，或任何可信、克制的合作方沟通场景。" } },
      { selector: "[data-cul='duty-kicker']", text: { en: "Factory Values", zh: "工厂价值观" } },
      { selector: "[data-cul='duty-title']", text: { en: "Core values matter when they can be connected to daily factory work", zh: "核心价值观只有落到日常工厂工作里才有意义" } },
      { selector: "[data-cul='duty-text']", text: { en: "We prefer to explain values through ordinary work: how people operate, how the workshop is maintained, how products are checked, and how commitments are handled with customers.", zh: "我们更愿意通过日常工作来解释这些价值观，比如人员如何操作、车间如何维护、产品如何检查，以及对客户的承诺如何落实。" } },
      { selector: "[data-cul='duty-card-1-title']", text: { en: "Safety", zh: "安全" } },
      { selector: "[data-cul='duty-card-1-text']", text: { en: "Safety begins with proper operation on the line, orderly movement of materials, and a workshop that is managed with attention rather than left to chance.", zh: "安全首先体现在产线上的规范操作、物料流转的有序安排，以及现场管理是否始终有人认真负责，而不是放任不管。" } },
      { selector: "[data-cul='duty-card-2-title']", text: { en: "Environmental awareness", zh: "环保意识" } },
      { selector: "[data-cul='duty-card-2-text']", text: { en: "Environmental awareness is expressed through a cleaner production environment and a more responsible operating attitude.", zh: "环保意识体现为更整洁的生产环境以及更负责任的经营态度。" } },
      { selector: "[data-cul='duty-card-3-title']", text: { en: "People first", zh: "以人为本" } },
      { selector: "[data-cul='duty-card-3-text']", text: { en: "People first means keeping communication respectful, making coordination smoother between office and workshop, and treating long-term cooperation seriously both inside the factory and with customers.", zh: "以人为本不是口号，而是体现在沟通中的尊重、办公室与车间之间更顺畅的配合，以及对内部同事和外部客户都认真对待长期合作。" } },
      { selector: "[data-cul='duty-card-4-title']", text: { en: "Integrity", zh: "诚信" } },
      { selector: "[data-cul='duty-card-4-text']", text: { en: "Integrity is expressed through truthful communication, practical expectations, and responsibility in follow-through.", zh: "诚信体现为真实沟通、务实预期以及后续跟进中的责任感。" } },
      { selector: "[data-cul='recognition-kicker']", text: { en: "Recognition", zh: "荣誉与资料" } },
      { selector: "[data-cul='recognition-title']", text: { en: "Selected materials collected through long-term operation", zh: "长期经营过程中积累的部分资料" } },
      { selector: "[data-cul='recognition-text']", text: { en: "Patents and related materials are kept here as background references. They are shown in a light way so visitors can browse them without interrupting the main page.", zh: "专利及相关资料作为长期经营中的补充参考保留在这里。我们尽量轻量呈现，让访客可以顺手浏览，而不会打断页面主体内容。" } },
      { selector: "[data-cul='honor-band-title']", text: { en: "Selected honor examples", zh: "部分荣誉示例" } },
      { selector: "[data-cul='duty-image-label']", text: { en: "Media Placeholder", zh: "素材位" } },
      { selector: "[data-cul='duty-image-title']", text: { en: "Core values media slot", zh: "核心价值观素材位" } },
      { selector: "[data-cul='duty-image-text']", text: { en: "Image slot: replace with clean workstations, inspection, teamwork, or visibly ordered production environments.", zh: "图片位：建议替换为整洁工作位、巡检、协作或有秩序的生产环境。" } },
      { selector: "[data-cul='duty-note-title']", text: { en: "Suggested visual", zh: "建议方向" } },
      { selector: "[data-cul='duty-note-text']", text: { en: "Suggested visual: clean facility, inspection action, organized tools, or team cooperation scene that feels calm and credible.", zh: "建议方向：整洁厂区、巡检动作、整齐工具或平静可信的团队协作场景。" } },
      { selector: "[data-cul='timeline-kicker']", text: { en: "Media Mapping", zh: "素材映射" } },
      { selector: "[data-cul='timeline-title']", text: { en: "Placeholder cards tied to the INTRO materials", zh: "与 INTRO 素材绑定的占位卡" } },
      { selector: "[data-cul='timeline-text']", text: { en: "These cards keep the page connected to real source material without turning culture into a video gallery. They can become covers, loops, or static replacements later.", zh: "这些卡片让页面继续连接真实素材来源，但不会把文化页做成视频展厅。后续它们可以被替换为封面图、短循环或静态正式图片。" } },
      { selector: "[data-cul='timeline-card-1-tag']", text: { en: "Source 01", zh: "来源 01" } },
      { selector: "[data-cul='timeline-card-1-title']", text: { en: "Workshop order and environment", zh: "车间秩序与环境" } },
      { selector: "[data-cul='timeline-card-1-text']", text: { en: "Useful for showing that culture starts with what the production environment looks like every day.", zh: "适合表达文化首先体现在生产环境每天看起来是什么样子。" } },
      { selector: "[data-cul='timeline-card-2-tag']", text: { en: "Source 02", zh: "来源 02" } },
      { selector: "[data-cul='timeline-card-2-title']", text: { en: "Hand work and responsibility", zh: "手工作业与责任感" } },
      { selector: "[data-cul='timeline-card-2-text']", text: { en: "Useful for expressing patience, detail, and how culture lives in people’s actions.", zh: "适合表达耐心、细节，以及文化如何体现在人的动作里。" } },
      { selector: "[data-cul='timeline-card-3-tag']", text: { en: "Source 03", zh: "来源 03" } },
      { selector: "[data-cul='timeline-card-3-title']", text: { en: "Automation and discipline", zh: "自动化与纪律性" } },
      { selector: "[data-cul='timeline-card-3-text']", text: { en: "Useful for showing that operational culture also appears in process control and line consistency.", zh: "适合说明经营文化也体现在工序控制与产线一致性之中。" } },
      { selector: "[data-cul='cta-kicker']", text: { en: "Contact", zh: "联系沟通" } },
      { selector: "[data-cul='cta-title']", text: { en: "Continue the conversation through a clear inquiry path", zh: "通过清晰询盘路径继续沟通" } },
      { selector: "[data-cul='cta-text']", text: { en: "If you want to know more about our product lines, factory coordination, packaging arrangements, or order follow-up, the next step is a direct inquiry. We will respond with practical information and continue from there.", zh: "如果你想进一步了解我们的产品线、工厂协同、包装安排或订单跟进方式，下一步就是直接发起询盘。我们会从实际信息开始回复，并继续往下推进。" } },
      { selector: "[data-cul='cta-button']", text: { en: "Send Inquiry", zh: "发送询盘" } }
    ]
  };

  function getUiText(key, params) {
    var entry = UI_TEXT[key];
    if (!entry) return "";
    var value = entry[currentLang];
    if (typeof value === "function") return value((params && params.count) || 0);
    return value;
  }

  function translateCategoryName(value) {
    var entry = CATEGORY_TEXT[value];
    return entry ? entry[currentLang] : value;
  }

  function translateLocationLabel(value) {
    if (value === "Factory" || value === "factory") return getUiText("factory");
    if (value === "Headquarters" || value === "headquarters") return getUiText("headquarters");
    return value;
  }

  function translateColorLabel(value) {
    if (!value) return value;
    return value
      .split(/\s*,\s*/)
      .map(function (part) {
        var normalized = part.trim().toLowerCase();
        var entry = COLOR_TEXT[normalized];
        return entry ? entry[currentLang] : part.trim();
      })
      .join(", ");
  }

  function translateSizeText(value) {
    if (!value || currentLang !== "zh") return value;
    return value
      .replace(/(\d+)\s*inch/gi, "$1寸")
      .replace(/Size not explicit/gi, "尺寸未明确");
  }

  function translateFeatureText(value) {
    if (!value) return value;

    var parts = value.split(/\s*·\s*/).map(function (part) {
      var normalized = part.trim().toLowerCase();
      var entry = FEATURE_TEXT[normalized];
      if (entry) return entry[currentLang];
      return currentLang === "zh" ? part.trim() : part.trim();
    });

    return parts.join(" · ");
  }

  function applyRules(rules) {
    rules.forEach(function (rule) {
      var nodes = document.querySelectorAll(rule.selector);
      if (!nodes.length) return;
      nodes.forEach(function (node) {
        if (rule.property) {
          if (rule.property === "textContent" || rule.property === "innerHTML" || rule.property === "placeholder") {
            node[rule.property] = rule.text[currentLang];
          } else {
            node.setAttribute(rule.property, rule.text[currentLang]);
          }
        } else {
          node.textContent = rule.text[currentLang];
        }
      });
    });
  }

  function updateToggleButtons() {
    var nextLang = currentLang === "en" ? "zh" : "en";
    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      var code = button.querySelector("[data-lang-toggle-code]");
      var text = button.querySelector("[data-lang-toggle-text]");
      var nextLabel = nextLang === "zh" ? "English" : "中文";
      var textLabel = nextLang === "zh" ? "中文" : "English";
      if (code) code.textContent = nextLabel;
      if (text) text.textContent = textLabel;
      button.setAttribute("aria-label", textLabel);
      button.setAttribute("title", textLabel);
    });
  }

  function bindToggleButtons() {
    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      if (button.dataset.boundLangToggle === "true") return;
      button.dataset.boundLangToggle = "true";
      button.addEventListener("click", function () {
        setStoredLang(currentLang === "en" ? "zh" : "en");
        window.location.reload();
      });
    });
  }

  function applyPageTranslations() {
    currentLang = getStoredLang();
    document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
    body.dataset.siteLang = currentLang;

    applyRules(COMMON_TRANSLATIONS);

    var pageName = body.dataset.page;
    if (pageName && PAGE_TRANSLATIONS[pageName]) {
      applyRules(PAGE_TRANSLATIONS[pageName]);
    }

    updateToggleButtons();
    bindToggleButtons();
  }

  window.RICHLAND_I18N = {
    getLang: function () {
      return currentLang;
    },
    isChinese: function () {
      return currentLang === "zh";
    },
    getUiText: getUiText,
    translateCategoryName: translateCategoryName,
    translateColorLabel: translateColorLabel,
    translateFeatureText: translateFeatureText,
    translateSizeText: translateSizeText,
    translateLocationLabel: translateLocationLabel,
    applyPageTranslations: applyPageTranslations
  };

  applyPageTranslations();
})();
