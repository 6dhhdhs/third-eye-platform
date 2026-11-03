/* Fixed-height, transform-only vertical carousel. No page scroll mutation. */
(function () {
  const root = document.querySelector(".case-carousel");
  if (!root) return;
  const slides = [...root.querySelectorAll(".case-slide")];
  const bar = root.querySelector(".carousel-progress span");
  const pause = root.querySelector('[data-carousel="pause"]');
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0,
    elapsed = 0,
    last = 0,
    manualPause = false,
    hover = false,
    focused = false,
    busy = false;
  let raf = 0,
    startY = null;
  const stopped = () =>
    manualPause || hover || focused || document.hidden || preference.matches;
  function move(direction) {
    if (busy) return;
    busy = true;
    const previous = slides[index];
    index = (index + direction + slides.length) % slides.length;
    const next = slides[index];
    const duration = preference.matches ? 0 : 700;
    previous.classList.remove("is-active");
    previous.setAttribute("aria-hidden", "true");
    previous.inert = true;
    next.classList.add("is-active");
    next.setAttribute("aria-hidden", "false");
    next.inert = false;
    if (duration) {
      previous.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          {
            transform: `translateY(${direction > 0 ? "-" : ""}100%)`,
            opacity: 0,
          },
        ],
        { duration, easing: "cubic-bezier(.22,.61,.36,1)" },
      );
      next.animate(
        [
          {
            transform: `translateY(${direction > 0 ? "" : "-"}100%)`,
            opacity: 0,
          },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration, easing: "cubic-bezier(.22,.61,.36,1)" },
      );
    }
    elapsed = 0;
    last = 0;
    bar.style.transform = "scaleX(0)";
    root.querySelector("#case-position").textContent =
      `0${index + 1} / 0${slides.length}`;
    setTimeout(() => {
      busy = false;
    }, duration);
  }
  function tick(now) {
    raf = 0;
    if (stopped()) {
      last = 0;
      return;
    }
    if (last && !busy) elapsed += Math.min(now - last, 100);
    last = now;
    bar.style.transform = `scaleX(${Math.min(elapsed / 4500, 1)})`;
    if (elapsed >= 4500) move(1);
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    if (stopped()) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else if (!raf) raf = requestAnimationFrame(tick);
    pause.disabled = preference.matches;
    pause.textContent = preference.matches
      ? "静态模式"
      : manualPause
        ? "播放"
        : "暂停";
    pause.setAttribute(
      "aria-pressed",
      String(manualPause || preference.matches),
    );
    pause.setAttribute(
      "aria-label",
      manualPause ? "开始自动播放" : "暂停自动播放",
    );
  }
  root.querySelector('[data-carousel="prev"]').onclick = () => move(-1);
  root.querySelector('[data-carousel="next"]').onclick = () => move(1);
  pause.onclick = () => {
    manualPause = !manualPause;
    sync();
  };
  root.addEventListener("mouseenter", () => {
    hover = true;
    sync();
  });
  root.addEventListener("mouseleave", () => {
    hover = false;
    sync();
  });
  root.addEventListener("focusin", () => {
    focused = true;
    sync();
  });
  root.addEventListener("focusout", () => {
    setTimeout(() => {
      focused = root.contains(document.activeElement);
      sync();
    }, 0);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      move(e.key === "ArrowUp" ? -1 : 1);
    }
  });
  root.addEventListener(
    "touchstart",
    (e) => {
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (
        startY !== null &&
        Math.abs(startY - e.changedTouches[0].clientY) > 45
      )
        move(startY > e.changedTouches[0].clientY ? 1 : -1);
      startY = null;
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", sync);
  sync();
})();
