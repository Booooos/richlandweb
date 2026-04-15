(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var headingNodes = document.querySelectorAll(".hero-copy h1, .section-head h2");
  if (!headingNodes.length) return;

  var instances = [];

  headingNodes.forEach(function (heading, index) {
    var text = heading.textContent.trim();
    if (!text) return;

    heading.textContent = "";

    var root = document.createElement("span");
    root.className = "animated-gradient-text heading-gradient is-animated";

    var content = document.createElement("span");
    content.className = "text-content";
    content.textContent = text;

    root.appendChild(content);
    heading.appendChild(root);

    instances.push({
      root: root,
      content: content,
      elapsed: index * 260,
      speed: heading.matches(".hero-copy h1") ? 6200 : 7800,
      paused: false
    });
  });

  if (!instances.length) return;

  instances.forEach(function (instance) {
    instance.root.addEventListener("mouseenter", function () {
      instance.paused = true;
    });
    instance.root.addEventListener("mouseleave", function () {
      instance.paused = false;
    });
  });

  if (reduceMotion.matches) {
    instances.forEach(function (instance) {
      instance.content.style.setProperty("--gradient-position", "32%");
    });
    return;
  }

  var lastTime = null;

  function frame(time) {
    if (lastTime === null) lastTime = time;
    var delta = time - lastTime;
    lastTime = time;

    instances.forEach(function (instance) {
      if (!instance.paused) {
        instance.elapsed += delta;
      }

      var cycle = instance.speed * 2;
      var cycleTime = instance.elapsed % cycle;
      var progress = cycleTime < instance.speed
        ? cycleTime / instance.speed
        : 1 - (cycleTime - instance.speed) / instance.speed;

      var position = 20 + progress * 52;
      instance.content.style.setProperty("--gradient-position", position.toFixed(2) + "%");
    });

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
