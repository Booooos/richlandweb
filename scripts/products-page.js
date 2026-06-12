(function () {
  const catalogRoot = document.querySelector("[data-products-root]");
  const navRoot = document.querySelector("[data-category-nav]");
  const products = window.RICHLAND_PRODUCTS || [];
  const i18n = window.RICHLAND_I18N || null;
  const PEDESTAL_VISIBLE_COUNT = 12;
  if (!catalogRoot || !navRoot || !products.length) return;

  const CATEGORY_TO_DOC_SECTION = {
    "Pedestal Fans": "Pedestal Fan Series",
    "Table Fans": "Table Fan Series",
    "Wall Fans": "Wall Fan Series",
    "Air Circulators": "Air Circulator Series",
    "Ceiling Fans": "Ceiling Fan Series",
    "Induction Cookers": "Induction Cooker Series",
    "Electric Pressure Cookers": "Electric Pressure Cooker Series"
  };

  const FEATURE_TAG_LABELS = {
    remote_control: "Remote Control",
    voice_control: "Voice Control",
    wire_control: "Wire Control",
    mechanical_control: "Mechanical Control",
    five_blades: "Five Blades",
    six_blades: "Six Blades",
    three_blades: "Three Blades",
    five_leaves: "Five Leaves",
    six_leaves: "Six Leaves",
    three_leaves: "Three Leaves",
    double_ball_bearing: "Double Ball Bearing",
    angle_adjustable: "Angle Adjustable",
    patented_design: "Patented Design",
    negative_ion: "Negative Ion",
    timer_4_level: "4-Level Timer",
    horn_fan: "Horn Fan",
    shaft: "Shaft",
    thicken_motor: "Thickened Motor",
    mosquito_control: "Mosquito Control"
  };

  const CONTROL_TAGS = new Set([
    "remote_control",
    "voice_control",
    "wire_control",
    "mechanical_control"
  ]);

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function buildInquiryLink(category) {
    return `index.html?category=${encodeURIComponent(category)}#inquiry`;
  }

  function getUiText(key, params = {}) {
    if (i18n) return i18n.getUiText(key, params);

    if (key === "askForQuote") return "Ask for Quote";
    if (key === "backToTop") return "Back to top";
    if (key === "prevColor") return "Show previous color";
    if (key === "nextColor") return "Show next color";
    if (key === "viewMore") return `View more (${params.count || 0})`;
    return "";
  }

  function translateCategoryLabel(value) {
    return i18n ? i18n.translateCategoryName(value) : value;
  }

  function translateColorLabel(value) {
    return i18n ? i18n.translateColorLabel(value) : value;
  }

  function translateFeatureLabel(value) {
    return i18n ? i18n.translateFeatureText(value) : value;
  }

  function translateSizeLabel(value) {
    return i18n ? i18n.translateSizeText(value) : value;
  }

  function parseListField(entry, fieldName) {
    const match = entry.match(new RegExp(`${fieldName}:\\s*(.+)`, "i"));
    if (!match) return [];

    const value = match[1].trim();
    if (!value || value.toLowerCase() === "none confirmed") return [];

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseFeatureContext(markdown) {
    const context = {
      pedestalPriorityModels: new Set(),
      sections: new Map()
    };

    if (!markdown) return context;

    const sections = markdown.split(/\n(?=##\s+)/).filter((section) => section.startsWith("## "));
    sections.forEach((sectionBlock) => {
      const sectionTitleMatch = sectionBlock.match(/^##\s+(.+)$/m);
      if (!sectionTitleMatch) return;

      const sectionTitle = sectionTitleMatch[1].trim();
      const entryBlocks = sectionBlock.split(/\n(?=###\s+)/).filter((entry) => entry.startsWith("### "));
      const sectionEntries = [];

      entryBlocks.forEach((entryBlock) => {
        const headingMatch = entryBlock.match(/^###\s+(.+?)\s*-\s*(.+)$/m);
        if (!headingMatch) return;

        const heading = headingMatch[1].trim();
        const modelMatch = heading.match(/\b([A-Z]\d+)\b/i);
        if (!modelMatch) return;

        const featureTags = parseListField(entryBlock, "feature_tags").map((tag) => tag.toLowerCase());
        const displayKeywords = parseListField(entryBlock, "display_keywords");
        const colorVariants = parseListField(entryBlock, "color_variants");

        const parsedEntry = {
          heading,
          model: modelMatch[1].toUpperCase(),
          featureTags,
          displayKeywords,
          colorVariants
        };

        sectionEntries.push(parsedEntry);

        if (
          sectionTitle === "Pedestal Fan Series" &&
          (featureTags.length || displayKeywords.length)
        ) {
          context.pedestalPriorityModels.add(parsedEntry.model);
        }
      });

      context.sections.set(sectionTitle, sectionEntries);
    });

    return context;
  }

  async function loadFeatureContext() {
    try {
      const response = await fetch("docs/product-feature-context.md", { cache: "no-store" });
      if (!response.ok) return parseFeatureContext("");
      const markdown = await response.text();
      return parseFeatureContext(markdown);
    } catch (error) {
      return parseFeatureContext("");
    }
  }

  function normalizeModel(model, name) {
    const source = `${model || ""} ${name || ""}`.toUpperCase();
    const match = source.match(/\b([A-Z])\s*(\d{1,4})(?!\d)/);
    if (!match) {
      return { model: "", letter: "ZZZ", number: Number.POSITIVE_INFINITY };
    }

    return {
      model: `${match[1]}${Number(match[2])}`,
      letter: match[1],
      number: Number(match[2])
    };
  }

  function compareProducts(left, right) {
    const leftNormalized = normalizeModel(left.model, left.name);
    const rightNormalized = normalizeModel(right.model, right.name);

    if (leftNormalized.model && !rightNormalized.model) return -1;
    if (!leftNormalized.model && rightNormalized.model) return 1;
    if (leftNormalized.letter !== rightNormalized.letter) {
      return leftNormalized.letter.localeCompare(rightNormalized.letter);
    }
    if (leftNormalized.number !== rightNormalized.number) {
      return leftNormalized.number - rightNormalized.number;
    }
    return left.name.localeCompare(right.name);
  }

  function extractSize(name) {
    const match = name.match(/(\d+\s*inch)/i);
    return match ? match[1].replace(/\s+/g, " ") : "";
  }

  function extractColor(productOrName) {
    if (productOrName && typeof productOrName === "object" && productOrName.color) {
      return productOrName.color;
    }

    const name = typeof productOrName === "string" ? productOrName : productOrName?.name || "";
    const tokens = [
      ["BlackPearl", "Black Pearl"],
      ["Black Pearl", "Black Pearl"],
      ["BlackPeal", "Black Pearl"],
      ["BlackGold", "Black Gold"],
      ["PearlWhite", "Pearl White"],
      ["DarkBlue", "Dark Blue"],
      ["Dark green", "Dark Green"],
      ["DarkGreen", "Dark Green"],
      ["Grey 1", "Grey"],
      ["Grey 2", "Grey"],
      ["Grey 3", "Grey"],
      ["Grey", "Grey"],
      ["Gold 1", "Gold"],
      ["Gold 2", "Gold"],
      ["Gold", "Gold"],
      ["White 2", "White"],
      ["White", "White"],
      ["Blue", "Blue"],
      ["Pink", "Pink"],
      ["Red", "Red"],
      ["Orange", "Orange"],
      ["Bronze", "Bronze"],
      ["Sliver", "Silver"],
      ["Silver", "Silver"],
      ["Green", "Green"],
      ["Vintage", "Vintage"],
      ["Black", "Black"]
    ];

    for (const [token, label] of tokens) {
      if (name.includes(token)) return label;
    }

    return "";
  }

  function extractFeatureParts(name) {
    const lower = name.toLowerCase();
    const patterns = [
      { test: /voice/, label: "Voice Control" },
      { test: /remote/, label: "Remote Control" },
      { test: /wire\s*control|wirecontrol/, label: "Wire Control" },
      { test: /five\s*leaves/, label: "Five Leaves" },
      { test: /six\s*leaves/, label: "Six Leaves" },
      { test: /three\s*leaves/, label: "Three Leaves" },
      { test: /horn\s*fan/, label: "Horn Fan" },
      { test: /exterminate mosquitoes/, label: "Mosquito Control" },
      { test: /shaft/, label: "Shaft" },
      { test: /thicken motor/, label: "Thicken Motor" }
    ];

    return patterns.filter((item) => item.test.test(lower)).map((item) => item.label);
  }

  function buildFeatureText(name) {
    const parts = Array.from(new Set(extractFeatureParts(name)));
    return parts.join(" · ");
  }

  function formatFeatureTag(tag) {
    return FEATURE_TAG_LABELS[tag] || tag.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function normalizeFeatureLabel(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function extractExplicitVariantControlTags(name) {
    const lower = (name || "").toLowerCase();
    const matches = [];

    if (/voice/.test(lower)) matches.push("voice_control");
    if (/remote/.test(lower)) matches.push("remote_control");
    if (/wire\s*control|wirecontrol|line\s*control/.test(lower)) matches.push("wire_control");
    if (/mechanical/.test(lower)) matches.push("mechanical_control");

    return matches;
  }

  function findFeatureEntry(featureContext, category, product) {
    const sectionTitle = CATEGORY_TO_DOC_SECTION[category];
    if (!sectionTitle) return null;

    const entries = featureContext.sections.get(sectionTitle) || [];
    if (!entries.length) return null;

    const normalized = normalizeModel(product.model, product.name);
    const productModel = normalized.model || "";
    const lowerName = (product.name || "").toLowerCase();

    const exactRemoteEntry = entries.find(
      (entry) =>
        entry.model === productModel &&
        /remote/.test(lowerName) &&
        /\bremote\b/i.test(entry.heading)
    );
    if (exactRemoteEntry) return exactRemoteEntry;

    const exactHeadingEntry = entries.find((entry) => {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(entry.heading.toLowerCase())}([^a-z0-9]|$)`);
      return pattern.test(lowerName);
    });
    if (exactHeadingEntry) return exactHeadingEntry;

    return entries.find((entry) => entry.model === productModel) || null;
  }

  function buildFeatureTextFromDoc(featureContext, category, product) {
    const entry = findFeatureEntry(featureContext, category, product);
    if (!entry) return "";

    const explicitVariantControls = extractExplicitVariantControlTags(product.name);
    const explicitControlSet = new Set(explicitVariantControls);
    const docControlTags = entry.featureTags.filter((tag) => CONTROL_TAGS.has(tag));
    const labels = [];
    const seen = new Set();

    const pushLabel = (label) => {
      const normalized = normalizeFeatureLabel(label);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      labels.push(label);
    };

    if (explicitVariantControls.length) {
      explicitVariantControls
        .filter((tag) => entry.featureTags.includes(tag))
        .forEach((tag) => pushLabel(formatFeatureTag(tag)));
    }

    entry.displayKeywords.forEach((keyword) => pushLabel(keyword));

    entry.featureTags.forEach((tag) => {
      if (CONTROL_TAGS.has(tag)) {
        if (explicitControlSet.size) return;
        if (docControlTags.length > 1) return;
      }
      pushLabel(formatFeatureTag(tag));
    });

    return labels.join(" · ");
  }

  function resolveDisplayCategory(category) {
    if (category === "Induction Cookers" || category === "Electric Pressure Cookers") {
      return "Cookers";
    }

    if (category === "Electric Heaters" || category === "Air Conditioners") {
      return "Heating/cooling";
    }

    return category;
  }

  function buildCategoryFeature(category) {
    if (category === "Electric Heaters") return "heater";
    if (category === "Air Conditioners") return "air conditioner";
    return "";
  }

  function buildTopLine(model, size) {
    const displaySize = translateSizeLabel(size);
    if (model && displaySize) return `${model} | ${displaySize}`;
    if (model) return model;
    if (displaySize) return displaySize;
    return "";
  }

  function hasFeatureText(value) {
    return Boolean(value && String(value).trim());
  }

  function compareCards(left, right) {
    const leftHasFeature = Boolean(left.hasFeature);
    const rightHasFeature = Boolean(right.hasFeature);

    if (leftHasFeature !== rightHasFeature) {
      return leftHasFeature ? -1 : 1;
    }

    return compareProducts(left.sortProduct, right.sortProduct);
  }

  function createVariantFromProduct(product, featureContext) {
    const docFeatureText = buildFeatureTextFromDoc(featureContext, product.category, product);

    return {
      image: product.image,
      alt: product.name,
      color: extractColor(product),
      feature: docFeatureText || buildFeatureText(product.name)
    };
  }

  function buildSingleCard(product, featureContext) {
    const normalized = normalizeModel(product.model, product.name);
    const size = extractSize(product.name);
    const variant = createVariantFromProduct(product, featureContext);
    const displayCategory = resolveDisplayCategory(product.category);

    if (!variant.feature) {
      variant.feature = buildCategoryFeature(product.category);
    }

    return {
      id: "",
      category: displayCategory,
      sourceCategory: product.category,
      slug: slugify(displayCategory),
      hasExplicitModel: Boolean(normalized.model),
      hasFeature: hasFeatureText(variant.feature),
      topLine: buildTopLine(normalized.model, size),
      variants: [variant],
      inquiryHref: buildInquiryLink(product.category),
      sortProduct: product
    };
  }

  function buildGroupedCards(items, displayCategory, featureContext) {
    const modelGroups = new Map();

    items.forEach((product) => {
      const normalized = normalizeModel(product.model, product.name);
      const modelKey = normalized.model || slugify(product.name);
      if (!modelGroups.has(modelKey)) {
        modelGroups.set(modelKey, []);
      }
      modelGroups.get(modelKey).push(product);
    });

    return Array.from(modelGroups.values())
      .flatMap((groupItems) => {
        const explicitSizes = Array.from(
          new Set(
            groupItems
              .map((item) => extractSize(item.name))
              .filter(Boolean)
          )
        );

        if (explicitSizes.length <= 1) {
          const sharedSize = explicitSizes[0] || "";
          return [
            {
              category: displayCategory,
              sourceCategory: groupItems[0].category,
              model: normalizeModel(groupItems[0].model, groupItems[0].name).model,
              size: sharedSize,
              variants: groupItems.map((product) => createVariantFromProduct(product, featureContext)),
              inquiryHref: buildInquiryLink(groupItems[0].category),
              sortProduct: groupItems[0]
            }
          ];
        }

        const sizeGroups = new Map();
        groupItems.forEach((product) => {
          const size = extractSize(product.name) || "no-size";
          if (!sizeGroups.has(size)) sizeGroups.set(size, []);
          sizeGroups.get(size).push(product);
        });

        return Array.from(sizeGroups.values()).map((sizeItems) => ({
          category: displayCategory,
          sourceCategory: sizeItems[0].category,
          model: normalizeModel(sizeItems[0].model, sizeItems[0].name).model,
          size: extractSize(sizeItems[0].name),
          variants: sizeItems.map((product) => createVariantFromProduct(product, featureContext)),
          inquiryHref: buildInquiryLink(sizeItems[0].category),
          sortProduct: sizeItems[0]
        }));
      })
      .map((group) => {
        const dedupedVariants = [];
        const seen = new Set();

        group.variants.forEach((variant) => {
          const signature = [variant.image, variant.color, variant.feature].join("|");
          if (seen.has(signature)) return;
          seen.add(signature);
          dedupedVariants.push(variant);
        });

        dedupedVariants.sort((left, right) => {
          const leftHasFeature = hasFeatureText(left.feature);
          const rightHasFeature = hasFeatureText(right.feature);

          if (leftHasFeature !== rightHasFeature) {
            return leftHasFeature ? -1 : 1;
          }

          if (left.color && right.color) {
            return left.color.localeCompare(right.color);
          }

          if (left.color) return -1;
          if (right.color) return 1;
          return 0;
        });

        return {
          id: "",
          category: group.category,
          sourceCategory: group.sourceCategory,
          slug: slugify(group.category),
          hasExplicitModel: Boolean(group.model),
          hasFeature: dedupedVariants.some((variant) => hasFeatureText(variant.feature)),
          topLine: buildTopLine(group.model, group.size),
          variants: dedupedVariants,
          inquiryHref: group.inquiryHref,
          sortProduct: group.sortProduct
        };
      })
      .sort(compareCards);
  }

  function buildCardsForCategory(category, items, options = {}) {
    const { pedestalPriorityModels = new Set(), featureContext } = options;
    const sortedItems = [...items].sort(compareProducts);
    if (["Pedestal Fans", "Table Fans", "Wall Fans"].includes(category)) {
      const groupedCards = buildGroupedCards(sortedItems, category, featureContext);

      if (category !== "Pedestal Fans") {
        return groupedCards;
      }

      const featuredCards = [];
      const standardCards = [];

      groupedCards.forEach((card) => {
        const normalized = normalizeModel(card.sortProduct?.model, card.sortProduct?.name);
        if (normalized.model && pedestalPriorityModels.has(normalized.model.toUpperCase())) {
          featuredCards.push(card);
          return;
        }
        standardCards.push(card);
      });

      return [...featuredCards, ...standardCards];
    }

    return sortedItems
      .map((product) => buildSingleCard(product, featureContext))
      .sort(compareCards);
  }

  async function init() {
    const featureContext = await loadFeatureContext();
    const pedestalPriorityModels = featureContext.pedestalPriorityModels;
    const categories = Array.from(
      products.reduce((map, product) => {
        const displayCategory = resolveDisplayCategory(product.category);
        if (!map.has(displayCategory)) map.set(displayCategory, []);
        map.get(displayCategory).push(product);
        return map;
      }, new Map())
    );

    const cardsById = new Map();
    let cardIndex = 0;

    navRoot.innerHTML = categories
      .map(([category]) => {
        const slug = slugify(category);
        return `<a class="category-jump" href="#${slug}" data-category-link="${slug}">${translateCategoryLabel(category)}</a>`;
      })
      .join("");

    catalogRoot.innerHTML = categories
      .map(([category, items]) => {
      const slug = slugify(category);
      const rawCards = buildCardsForCategory(category, items, { pedestalPriorityModels, featureContext });
      const shouldCollapseUnnamed =
        category === "Pedestal Fans" || category === "Wall Fans" || category === "Table Fans";
      const shouldCompactPedestal = category === "Pedestal Fans";
      const hiddenCards = shouldCompactPedestal
        ? Math.max(0, rawCards.length - PEDESTAL_VISIBLE_COUNT)
        : shouldCollapseUnnamed
          ? rawCards.filter((card) => !card.hasExplicitModel).length
          : 0;
      const cards = rawCards
        .map((card, index) => {
          card.id = `card-${cardIndex += 1}`;
          cardsById.set(card.id, { ...card, currentVariantIndex: 0 });
          const hasMultipleVariants = card.variants.length > 1;
          const currentVariant = card.variants[0];
          const isCollapsedPedestal = shouldCompactPedestal && index >= PEDESTAL_VISIBLE_COUNT;
          const isCollapsedUnnamed = !shouldCompactPedestal && shouldCollapseUnnamed && !card.hasExplicitModel;
          const collapsedClass = isCollapsedPedestal || isCollapsedUnnamed ? " is-collapsed-by-default" : "";

          return `
            <article class="product-card${collapsedClass}" data-card-id="${card.id}">
              <div class="product-card__media">
                <img src="${currentVariant.image}" alt="${currentVariant.alt}" data-card-image>
                ${
                  hasMultipleVariants
                    ? `
                      <div class="product-card__variant-nav">
                        <button class="product-card__arrow" type="button" aria-label="${getUiText("prevColor")}" data-variant-prev>&larr;</button>
                        <button class="product-card__arrow" type="button" aria-label="${getUiText("nextColor")}" data-variant-next>&rarr;</button>
                      </div>
                    `
                    : ""
                }
              </div>
              <div class="product-card__body">
                <div class="product-card__meta" ${card.topLine ? "" : "hidden"} data-card-topline>${card.topLine}</div>
                <h3 class="product-card__color" ${currentVariant.color ? "" : "hidden"} data-card-color>${translateColorLabel(currentVariant.color)}</h3>
                <div class="product-card__feature" ${currentVariant.feature ? "" : "hidden"} data-card-feature>${translateFeatureLabel(currentVariant.feature)}</div>
              </div>
              <a class="btn primary product-card__cta" href="${card.inquiryHref}">${getUiText("askForQuote")}</a>
            </article>
          `;
        })
        .join("");

      return `
        <section class="catalog-section" id="${slug}" tabindex="-1">
          <div class="catalog-section__head">
            <h2>${translateCategoryLabel(category)}</h2>
            <a class="catalog-section__link" href="#top">${getUiText("backToTop")}</a>
          </div>
          <div class="product-grid">
            ${cards}
          </div>
          ${
            hiddenCards
              ? `
                <div class="catalog-section__foot">
                  <button class="btn catalog-section__more" type="button" data-view-more="${slug}">
                    ${getUiText("viewMore", { count: hiddenCards })}
                  </button>
                </div>
              `
              : ""
          }
        </section>
      `;
      })
      .join("");

    function updateCardVariant(cardId, nextIndex) {
      const card = cardsById.get(cardId);
      const cardNode = catalogRoot.querySelector(`[data-card-id="${cardId}"]`);
      if (!card || !cardNode) return;

      const variantCount = card.variants.length;
      const safeIndex = ((nextIndex % variantCount) + variantCount) % variantCount;
      card.currentVariantIndex = safeIndex;

      const variant = card.variants[safeIndex];
      const image = cardNode.querySelector("[data-card-image]");
      const color = cardNode.querySelector("[data-card-color]");
      const feature = cardNode.querySelector("[data-card-feature]");
      const topLine = cardNode.querySelector("[data-card-topline]");
      const applyVariant = () => {
      if (image) {
        image.src = variant.image;
        image.alt = variant.alt;
      }

      if (topLine) {
        topLine.hidden = !card.topLine;
        topLine.textContent = card.topLine;
      }

      if (color) {
        color.hidden = !variant.color;
        color.textContent = translateColorLabel(variant.color || "");
      }

      if (feature) {
        feature.hidden = !variant.feature;
        feature.textContent = translateFeatureLabel(variant.feature || "");
      }
      };

      cardNode.classList.add("is-variant-switching");
      window.clearTimeout(cardNode._variantSwitchTimer);

      const nextImage = new Image();
      nextImage.decoding = "async";
      nextImage.src = variant.image;

      window.setTimeout(() => {
        applyVariant();
        cardNode._variantSwitchTimer = window.setTimeout(() => {
          cardNode.classList.remove("is-variant-switching");
        }, 110);
      }, 70);
    }

    catalogRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-variant-prev], [data-variant-next]");
      if (!button) return;

      const cardNode = button.closest("[data-card-id]");
      if (!cardNode) return;

      const cardId = cardNode.getAttribute("data-card-id");
      const card = cardsById.get(cardId);
      if (!card) return;

      const direction = button.hasAttribute("data-variant-prev") ? -1 : 1;
      updateCardVariant(cardId, card.currentVariantIndex + direction);
    });

    catalogRoot.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-view-more]");
      if (!trigger) return;

      const slug = trigger.getAttribute("data-view-more");
      const section = catalogRoot.querySelector(`#${slug}`);
      if (!section) return;

      section.querySelectorAll(".product-card.is-collapsed-by-default").forEach((card) => {
        card.classList.remove("is-collapsed-by-default");
      });
      trigger.hidden = true;
    });

    function setActiveCategoryLink(slug) {
      navRoot.querySelectorAll("[data-category-link]").forEach((link) => {
        const isActive = link.getAttribute("data-category-link") === slug;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function flashSection(target) {
      target.classList.add("is-section-target");
      window.clearTimeout(target._highlightTimer);
      target._highlightTimer = window.setTimeout(() => {
        target.classList.remove("is-section-target");
      }, 1600);
    }

    function scrollToSection(target, smooth) {
      const top = target.getBoundingClientRect().top + window.scrollY - 14;
      window.scrollTo({
        top,
        behavior: smooth ? "smooth" : "auto"
      });
    }

    navRoot.addEventListener("click", (event) => {
      const link = event.target.closest("[data-category-link]");
      if (!link) return;

      const slug = link.getAttribute("data-category-link");
      const target = document.getElementById(slug);
      if (!target) return;

      event.preventDefault();
      setActiveCategoryLink(slug);
      history.replaceState(null, "", `#${slug}`);
      scrollToSection(target, true);
      flashSection(target);
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (!visible.length) return;
        setActiveCategoryLink(visible[0].target.id);
      },
      {
        rootMargin: "-18% 0px -56% 0px",
        threshold: [0.2, 0.4, 0.6]
      }
    );

    catalogRoot.querySelectorAll(".catalog-section").forEach((section) => {
      sectionObserver.observe(section);
    });

    function handleInitialHashNavigation() {
      if (!location.hash) return;
      const slug = location.hash.slice(1);
      const target = document.getElementById(slug);
      if (!target) return;

      requestAnimationFrame(() => {
        scrollToSection(target, false);
        setActiveCategoryLink(slug);
        flashSection(target);
      });
    }

    handleInitialHashNavigation();
  }

  init();
})();
