(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var targets = [
    [".category-card, .showcase-card, .request-item, .contact-card, .footer-col", "78 143 114", "213 241 228"],
    [".secondary-band, .why-intro, .inquiry-copy, .message-card, .section-note", "88 153 123", "219 244 232"],
    [".why-card", "96 155 126", "220 243 232"],
    [".why-card.accent", "58 136 96", "213 247 226"]
  ];

  function parseRgb(value) {
    return value.trim().split(/\s+/).map(function (part) {
      return Number(part);
    });
  }

  function rgba(rgb, alpha) {
    return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")";
  }

  function roundedRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function decorateCard(card, borderRgb, lightRgb) {
    if (card.classList.contains("electric-border")) return null;

    card.classList.add("electric-border");
    card.style.setProperty("--electric-border-rgb", borderRgb);
    card.style.setProperty("--electric-light-rgb", lightRgb);

    var layers = document.createElement("div");
    layers.className = "eb-layers";
    layers.innerHTML =
      '<div class="eb-glow-1"></div><div class="eb-glow-2"></div><div class="eb-background-glow"></div>';

    var canvasContainer = document.createElement("div");
    canvasContainer.className = "eb-canvas-container";
    var canvas = document.createElement("canvas");
    canvas.className = "eb-canvas";
    canvasContainer.appendChild(canvas);

    card.appendChild(layers);
    card.appendChild(canvasContainer);

    return {
      card: card,
      canvas: canvas,
      ctx: canvas.getContext("2d"),
      borderRgb: parseRgb(borderRgb),
      lightRgb: parseRgb(lightRgb),
      target: 0,
      alpha: 0,
      focusX: 0.5,
      focusY: 0.5,
      phase: Math.random() * 240,
      raf: 0,
      width: 0,
      height: 0,
      pad: 14,
      radius: 20,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    };
  }

  var instances = [];

  targets.forEach(function (entry) {
    document.querySelectorAll(entry[0]).forEach(function (card) {
      var instance = decorateCard(card, entry[1], entry[2]);
      if (instance) instances.push(instance);
    });
  });

  if (!instances.length) return;

  function resize(instance) {
    var rect = instance.card.getBoundingClientRect();
    instance.width = rect.width;
    instance.height = rect.height;
    instance.radius = parseFloat(getComputedStyle(instance.card).borderTopLeftRadius) || 20;
    instance.canvas.width = Math.round((instance.width + instance.pad * 2) * instance.dpr);
    instance.canvas.height = Math.round((instance.height + instance.pad * 2) * instance.dpr);
    instance.canvas.style.width = instance.width + instance.pad * 2 + "px";
    instance.canvas.style.height = instance.height + instance.pad * 2 + "px";
  }

  function draw(instance) {
    var ctx = instance.ctx;
    var pad = instance.pad;
    var w = instance.width;
    var h = instance.height;
    var alpha = instance.alpha;

    ctx.setTransform(instance.dpr, 0, 0, instance.dpr, 0, 0);
    ctx.clearRect(0, 0, w + pad * 2, h + pad * 2);

    if (alpha <= 0.01) return;

    var gx = pad + w * instance.focusX;
    var gy = pad + h * instance.focusY;
    var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.68);
    glow.addColorStop(0, rgba(instance.lightRgb, 0.18 * alpha));
    glow.addColorStop(0.45, rgba(instance.borderRgb, 0.08 * alpha));
    glow.addColorStop(1, rgba(instance.borderRgb, 0));
    ctx.fillStyle = glow;
    roundedRect(ctx, pad, pad, w, h, instance.radius);
    ctx.fill();

    roundedRect(ctx, pad, pad, w, h, instance.radius);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = rgba(instance.borderRgb, 0.18 * alpha);
    ctx.stroke();

    roundedRect(ctx, pad, pad, w, h, instance.radius);
    ctx.save();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = rgba(instance.lightRgb, 0.72 * alpha);
    ctx.shadowBlur = 14;
    ctx.shadowColor = rgba(instance.lightRgb, 0.72 * alpha);
    ctx.setLineDash([96, 210]);
    ctx.lineDashOffset = -instance.phase;
    ctx.stroke();
    ctx.restore();

    roundedRect(ctx, pad, pad, w, h, instance.radius);
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(instance.borderRgb, 0.56 * alpha);
    ctx.shadowBlur = 8;
    ctx.shadowColor = rgba(instance.borderRgb, 0.42 * alpha);
    ctx.setLineDash([46, 180]);
    ctx.lineDashOffset = instance.phase * 0.7;
    ctx.stroke();
    ctx.restore();
  }

  function step(instance) {
    instance.alpha += (instance.target - instance.alpha) * 0.12;
    instance.phase += 1.6;
    draw(instance);

    if (instance.alpha > 0.02 || instance.target > 0.01) {
      instance.raf = window.requestAnimationFrame(function () {
        step(instance);
      });
    } else {
      instance.raf = 0;
    }
  }

  function schedule(instance) {
    if (reduceMotion.matches) return;
    if (!instance.raf) {
      instance.raf = window.requestAnimationFrame(function () {
        step(instance);
      });
    }
  }

  function activate(instance) {
    instance.target = 1;
    instance.card.classList.add("is-electric-active");
    schedule(instance);
  }

  function deactivate(instance) {
    instance.target = 0;
    instance.card.classList.remove("is-electric-active");
    schedule(instance);
  }

  function updateFocus(instance, event) {
    var rect = instance.card.getBoundingClientRect();
    instance.focusX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    instance.focusY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    schedule(instance);
  }

  instances.forEach(function (instance) {
    resize(instance);

    instance.card.addEventListener("pointerenter", function (event) {
      updateFocus(instance, event);
      activate(instance);
    });

    instance.card.addEventListener("pointermove", function (event) {
      updateFocus(instance, event);
    });

    instance.card.addEventListener("pointerleave", function () {
      deactivate(instance);
      instance.focusX = 0.5;
      instance.focusY = 0.5;
    });

    instance.card.addEventListener("focusin", function () {
      activate(instance);
    });

    instance.card.addEventListener("focusout", function () {
      deactivate(instance);
    });
  });

  if (typeof ResizeObserver !== "undefined") {
    var observer = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var instance = instances.find(function (item) {
          return item.card === entry.target;
        });
        if (instance) {
          resize(instance);
          draw(instance);
        }
      });
    });

    instances.forEach(function (instance) {
      observer.observe(instance.card);
    });
  } else {
    window.addEventListener("resize", function () {
      instances.forEach(function (instance) {
        resize(instance);
        draw(instance);
      });
    });
  }
})();
