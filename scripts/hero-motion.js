(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  var hero = document.querySelector(".hero-visual-section");
  var stage = hero && hero.querySelector(".hero-visual-stage");
  if (!hero || !stage) return;

  var layers = {
    far: hero.querySelector(".hero-layer--far"),
    mid: hero.querySelector(".hero-layer--mid"),
    main: hero.querySelector(".hero-layer--main")
  };

  var state = {
    tx: 0,
    ty: 0,
    cx: 0,
    cy: 0,
    raf: 0,
    inside: false
  };

  var scales = {
    main: 1,
    mid: 1,
    far: 1
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setVars() {
    stage.style.setProperty("--hero-pointer-x", state.cx.toFixed(4));
    stage.style.setProperty("--hero-pointer-y", state.cy.toFixed(4));
    stage.style.setProperty("--hero-main-scale", scales.main.toFixed(4));
    stage.style.setProperty("--hero-mid-scale", scales.mid.toFixed(4));
    stage.style.setProperty("--hero-far-scale", scales.far.toFixed(4));
  }

  function updateEmphasis(clientX, clientY) {
    var nearest = "main";
    var nearestDistance = Infinity;

    Object.keys(layers).forEach(function (key) {
      var layer = layers[key];
      if (!layer) return;
      var rect = layer.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var dx = clientX - centerX;
      var dy = clientY - centerY;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = key;
      }
    });

    hero.dataset.emphasis = nearest;
    scales.main = nearest === "main" ? 1.012 : 1;
    scales.mid = nearest === "mid" ? 1.018 : 1;
    scales.far = nearest === "far" ? 1.018 : 1;
  }

  function tick() {
    state.cx += (state.tx - state.cx) * 0.12;
    state.cy += (state.ty - state.cy) * 0.12;
    setVars();

    if (
      Math.abs(state.tx - state.cx) > 0.001 ||
      Math.abs(state.ty - state.cy) > 0.001
    ) {
      state.raf = window.requestAnimationFrame(tick);
    } else {
      state.raf = 0;
    }
  }

  function schedule() {
    if (!state.raf) {
      state.raf = window.requestAnimationFrame(tick);
    }
  }

  hero.addEventListener("pointerenter", function () {
    hero.classList.add("is-interactive");
    hero.dataset.emphasis = "main";
  });

  hero.addEventListener("pointermove", function (event) {
    var rect = hero.getBoundingClientRect();
    var px = (event.clientX - rect.left) / rect.width;
    var py = (event.clientY - rect.top) / rect.height;

    state.tx = clamp((px - 0.5) * 2, -1, 1);
    state.ty = clamp((py - 0.5) * 2, -1, 1);
    updateEmphasis(event.clientX, event.clientY);
    schedule();
  });

  hero.addEventListener("pointerleave", function () {
    state.tx = 0;
    state.ty = 0;
    scales.main = 1;
    scales.mid = 1;
    scales.far = 1;
    hero.dataset.emphasis = "main";
    hero.classList.remove("is-interactive");
    schedule();
  });

  hero.dataset.emphasis = "main";
  setVars();
})();
