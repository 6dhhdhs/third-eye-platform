/* =========================================================
 * AI 说课评价报告 · 页面交互
 * 说明：演示阶段使用示例数据，不调用真实模型（PRD 5.7 P1）。
 * ========================================================= */
(function initSpeakingReport() {
  "use strict";

  /* 1. 说课结构分段：点击跳转对应片段 */
  window.updateCurrentSegment = function (range) {
    window.TE.toast(
      "已定位到片段 " + range,
      "播放器与转写文本将同步跳转。",
      "info",
    );
  };

  /* 2. 下载报告 */
  var downloadBtn = document.querySelector("[data-download-report]");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      window.TE.toast(
        "报告导出中",
        "演示阶段不生成真实 PDF，正式版将导出完整诊断报告。",
        "info",
      );
    });
  }

  /* 3. 同侪互评：P1 规划功能，给出明确提示而不是死链 */
  document.querySelectorAll('[data-feature="peer"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.TE.toast(
        "同侪互评属 P1 规划",
        "首期仅提供本人与指导教师可见的诊断报告。",
        "info",
      );
    });
  });
})();
