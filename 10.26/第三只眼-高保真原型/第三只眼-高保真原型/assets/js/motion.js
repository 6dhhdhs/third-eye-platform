/* =========================================================
 * 内页动效 · 与首页同源
 *   1. 页面元素的「淡入上浮 + 错峰」由 input.css 完成；
 *   2. 本脚本负责数字计数与进度条生长，进入视口时触发；
 *   3. 尊重系统「减少动态效果」设置，不做任何数值滚动。
 * 首页不加载本脚本（首页已有自己的 ws-enter 与案例轮播）。
 * ========================================================= */
(function initMotion() {
  "use strict";

  var root = document.documentElement;
  root.classList.add("motion-js");

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function firstNumberNode(el) {
    for (var i = 0; i < el.childNodes.length; i += 1) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && /\d/.test(node.nodeValue)) return node;
    }
    return null;
  }

  function countUp(el) {
    var node = firstNumberNode(el);
    if (!node) return;
    var raw = node.nodeValue;
    var match = raw.match(/\d+(?:\.\d+)?/);
    if (!match) return;

    var target = parseFloat(match[0]);
    if (!isFinite(target) || target === 0) return;

    var decimals =
      match[0].indexOf(".") === -1 ? 0 : match[0].split(".")[1].length;
    var prefix = raw.slice(0, match.index);
    var suffix = raw.slice(match.index + match[0].length);
    var duration = 900;
    var start = 0;

    function frame(now) {
      if (!start) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.nodeValue = prefix + (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        node.nodeValue = raw;
      }
    }

    node.nodeValue = prefix + (0).toFixed(decimals) + suffix;
    window.requestAnimationFrame(frame);
  }

  function lightMeter(meter, index) {
    meter.style.transitionDelay = "";
    window.setTimeout(
      function () {
        meter.classList.add("is-lit");
      },
      80 + (index % 6) * 70,
    );
  }

  var counters = Array.prototype.slice.call(
    document.querySelectorAll(".stat b, .dim-row b"),
  );
  var meters = Array.prototype.slice.call(document.querySelectorAll(".meter"));

  if (reduce) {
    meters.forEach(function (meter) {
      meter.classList.add("is-lit");
    });
    return;
  }

  if (!("IntersectionObserver" in window)) {
    counters.forEach(countUp);
    meters.forEach(lightMeter);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        if (el.classList.contains("meter")) {
          lightMeter(el, meters.indexOf(el));
        } else {
          countUp(el);
        }
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -30px 0px" },
  );

  counters.forEach(function (el) {
    observer.observe(el);
  });
  meters.forEach(function (meter) {
    observer.observe(meter);
  });
})();
