/* =========================================================
 * 课堂观察能力报告 · 页面交互
 * 说明：演示阶段的分值、κ 系数与专家对照均为示例数据。
 * ========================================================= */
(function initObserveReport() {
  "use strict";

  document.querySelectorAll(".timestamp-link").forEach(function (link) {
    link.addEventListener("click", function () {
      window.TE.toast(
        "已定位到 " + link.dataset.time,
        "播放器将回到该证据对应的课堂片段。",
        "info",
      );
    });
  });
})();
