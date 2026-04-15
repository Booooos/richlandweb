(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  var hero = document.querySelector(".hero-visual-section");
  var stage = hero && hero.querySelector(".hero-visual-stage");
  var mount = stage && stage.querySelector(".hero-flow-overlay");
  if (!hero || !stage || !mount) return;

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  if (!context) return;
  mount.appendChild(canvas);

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = 1;
  var height = 1;
  var visible = true;
  var raf = 0;
  var rect = null;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  var rings = [];

  var palette = {
    core: "26,63,12",
    soft: "66,122,54",
    haze: "152,194,140"
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildRings() {
    var base = Math.min(width, height);
    var centerY = height * 0.62;
    rings = [
      {
        radiusX: base * 0.18,
        radiusY: base * 0.095,
        lineWidth: 1.2,
        alpha: 0.18,
        speed: 0.22,
        dash: base * 0.12,
        gap: base * 0.18,
        tilt: -0.12,
        y: centerY - base * 0.02
      },
      {
        radiusX: base * 0.28,
        radiusY: base * 0.14,
        lineWidth: 1.4,
        alpha: 0.15,
        speed: -0.18,
        dash: base * 0.11,
        gap: base * 0.24,
        tilt: -0.08,
        y: centerY + base * 0.01
      },
      {
        radiusX: base * 0.38,
        radiusY: base * 0.19,
        lineWidth: 1.1,
        alpha: 0.11,
        speed: 0.14,
        dash: base * 0.09,
        gap: base * 0.28,
        tilt: -0.04,
        y: centerY + base * 0.04
      }
    ];
  }

  function resize() {
    width = Math.max(1, mount.clientWidth);
    height = Math.max(1, mount.clientHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    rect = hero.getBoundingClientRect();
    buildRings();
  }

  function updatePointer(event) {
    if (!rect) rect = hero.getBoundingClientRect();
    var px = (event.clientX - rect.left) / rect.width;
    var py = (event.clientY - rect.top) / rect.height;
    pointer.tx = clamp((px - 0.5) * 2, -1, 1);
    pointer.ty = clamp((py - 0.5) * 2, -1, 1);
    pointer.active = true;
  }

  function resetPointer() {
    pointer.tx = 0;
    pointer.ty = 0;
    pointer.active = false;
  }

  function drawGlow(cx, cy, time) {
    var glow = context.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.34);
    glow.addColorStop(0, "rgba(" + palette.haze + ",0.12)");
    glow.addColorStop(0.35, "rgba(" + palette.haze + ",0.08)");
    glow.addColorStop(1, "rgba(" + palette.haze + ",0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(cx, cy + Math.sin(time * 0.45) * 4, Math.min(width, height) * 0.34, 0, Math.PI * 2);
    context.fill();
  }

  function drawRing(cx, ring, time, index) {
    context.save();
    context.translate(cx + pointer.x * (10 + index * 5), ring.y + pointer.y * (6 + index * 4));
    context.rotate(ring.tilt + pointer.x * 0.04);

    context.beginPath();
    context.ellipse(0, 0, ring.radiusX, ring.radiusY, 0, 0, Math.PI * 2);
    context.lineWidth = ring.lineWidth;
    context.strokeStyle = "rgba(" + palette.soft + "," + ring.alpha.toFixed(3) + ")";
    context.setLineDash([ring.dash, ring.gap]);
    context.lineDashOffset = time * 120 * ring.speed;
    context.stroke();

    context.beginPath();
    context.ellipse(0, 0, ring.radiusX * 0.94, ring.radiusY * 0.94, 0, 0, Math.PI * 2);
    context.lineWidth = ring.lineWidth * 0.7;
    context.strokeStyle = "rgba(" + palette.core + "," + (ring.alpha * 0.9).toFixed(3) + ")";
    context.setLineDash([ring.dash * 0.42, ring.gap * 1.25]);
    context.lineDashOffset = -time * 150 * ring.speed;
    context.stroke();

    var nodeCount = 5 + index * 2;
    for (var i = 0; i < nodeCount; i += 1) {
      var phase = (i / nodeCount) * Math.PI * 2 + time * (0.55 + index * 0.08) * (ring.speed > 0 ? 1 : -1);
      var x = Math.cos(phase) * ring.radiusX;
      var y = Math.sin(phase) * ring.radiusY;
      var pulse = 0.45 + (Math.sin(time * 2.4 + i + index) + 1) * 0.22;

      context.beginPath();
      context.fillStyle = "rgba(" + palette.core + "," + pulse.toFixed(3) + ")";
      context.arc(x, y, 1.3 + index * 0.25, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.fillStyle = "rgba(" + palette.haze + "," + (pulse * 0.35).toFixed(3) + ")";
      context.arc(x, y, 4 + index * 0.8, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
    context.setLineDash([]);
  }

  function drawStream(cx, cy, time) {
    context.save();
    context.translate(cx + pointer.x * 12, cy + pointer.y * 8);
    context.rotate(-0.18 + pointer.x * 0.05);

    for (var i = 0; i < 4; i += 1) {
      var span = width * (0.18 + i * 0.06);
      var y = -16 + i * 12 + Math.sin(time * (0.8 + i * 0.14)) * 5;
      var gradient = context.createLinearGradient(-span, 0, span, 0);
      gradient.addColorStop(0, "rgba(" + palette.haze + ",0)");
      gradient.addColorStop(0.32, "rgba(" + palette.soft + ",0.07)");
      gradient.addColorStop(0.5, "rgba(" + palette.core + ",0.2)");
      gradient.addColorStop(0.68, "rgba(" + palette.soft + ",0.06)");
      gradient.addColorStop(1, "rgba(" + palette.haze + ",0)");
      context.fillStyle = gradient;
      context.fillRect(-span, y, span * 2, 2);
    }

    context.restore();
  }

  function render(now) {
    raf = requestAnimationFrame(render);
    if (!visible) return;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    var time = now * 0.001;
    var cx = width * 0.5;
    var cy = height * 0.61;

    context.clearRect(0, 0, width, height);
    drawGlow(cx, cy, time);
    drawStream(cx, cy, time);

    for (var i = 0; i < rings.length; i += 1) {
      drawRing(cx, rings[i], time, i);
    }
  }

  var resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);

  var intersectionObserver = new IntersectionObserver(function (entries) {
    visible = !!(entries[0] && entries[0].isIntersecting) && !document.hidden;
  });
  intersectionObserver.observe(hero);

  hero.addEventListener("pointerenter", updatePointer, { passive: true });
  hero.addEventListener("pointermove", updatePointer, { passive: true });
  hero.addEventListener("pointerleave", resetPointer, { passive: true });
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
  });

  resize();
  raf = requestAnimationFrame(render);
})();
