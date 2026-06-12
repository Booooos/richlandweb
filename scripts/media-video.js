(function () {
  var videos = Array.prototype.slice.call(document.querySelectorAll("[data-smart-video]"));
  if (!videos.length) return;

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    prefersReducedMotion = false;
  }

  var visibleVideos = new Set();
  var currentPlaying = null;

  function pauseVideo(video) {
    if (!video) return;
    try {
      video.pause();
    } catch (error) {
      return;
    }
  }

  function chooseBestVisibleVideo() {
    var candidates = Array.prototype.filter.call(videos, function (video) {
      return visibleVideos.has(video);
    });

    if (!candidates.length) return null;

    candidates.sort(function (a, b) {
      var aRatio = Number(a.dataset.visibilityRatio || 0);
      var bRatio = Number(b.dataset.visibilityRatio || 0);
      return bRatio - aRatio;
    });

    return candidates[0];
  }

  function syncPlayback() {
    if (prefersReducedMotion) {
      videos.forEach(pauseVideo);
      currentPlaying = null;
      return;
    }

    var nextVideo = chooseBestVisibleVideo();

    if (currentPlaying && currentPlaying !== nextVideo) {
      pauseVideo(currentPlaying);
      currentPlaying = null;
    }

    if (!nextVideo) return;

    if (nextVideo.preload !== "metadata") {
      nextVideo.preload = "metadata";
    }

    var playPromise = nextVideo.play();
    currentPlaying = nextVideo;

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        currentPlaying = null;
      });
    }
  }

  videos.forEach(function (video) {
    video.autoplay = false;
    video.preload = "metadata";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    try {
      video.load();
    } catch (error) {
      return;
    }
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.dataset.visibilityRatio = entry.intersectionRatio.toFixed(3);

      if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
        visibleVideos.add(entry.target);
      } else {
        visibleVideos.delete(entry.target);
        pauseVideo(entry.target);
        if (currentPlaying === entry.target) {
          currentPlaying = null;
        }
      }
    });

    syncPlayback();
  }, {
    threshold: [0, 0.2, 0.35, 0.55, 0.8]
  });

  videos.forEach(function (video) {
    observer.observe(video);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      videos.forEach(pauseVideo);
      currentPlaying = null;
      return;
    }

    syncPlayback();
  });
})();
