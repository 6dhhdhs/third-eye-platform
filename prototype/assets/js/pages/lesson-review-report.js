/* =========================================================
 * 教案评价报告页（P-13）
 * 说明：所有分值与原文引用均为预置示例；页面只做展示与反馈交互。
 * ========================================================= */
(function initReviewReport() {
  "use strict";

  var SUBMIT_KEY = "te.lesson-review.submission";

  function readSubmission() {
    try {
      var raw = window.localStorage.getItem(SUBMIT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.planTitle ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  var submission = readSubmission();
  if (submission) {
    document.getElementById("reportTitle").textContent =
      "教学设计评价报告：" + submission.planTitle.replace(/教学设计$/, "");
    document.getElementById("reportMeta").textContent =
      (submission.grade || "未选择") +
      "学段 · " +
      (submission.subject || "未填写") +
      " · 量表 v1.2（建议稿） · 6 个维度 · 引用 9 处原文（示例）";
    document.getElementById("infoGrade").textContent =
      (submission.grade || "未选择") + " · " + (submission.subject || "未填写");
    if (submission.lessonTitle) {
      document.getElementById("infoTopic").textContent = submission.lessonTitle;
    }
    var d = new Date(submission.submittedAt);
    if (!isNaN(d.getTime())) {
      var pad = function (n) {
        return String(n).padStart(2, "0");
      };
      document.getElementById("infoTime").textContent =
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes());
    }
  }

  /* ---------- 单条建议反馈 ---------- */
  document.querySelectorAll("[data-feedback]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-feedback");
      window.TE.toast(
        kind === "accurate" ? "已标记为准确" : "已记录反馈",
        kind === "accurate"
          ? "感谢确认，反馈只用于改进评价质量，不会改写当前报告结论。"
          : "可继续补充原因：引用不匹配 / 学科要求不适用 / 建议不可操作 / 事实错误。",
        kind === "accurate" ? "success" : "info",
      );
    });
  });

  /* ---------- 局部改写 ---------- */
  document.querySelectorAll("[data-apply]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.TE.confirm({
        title: "生成局部改写示例？",
        message:
          "改写只作为可选择的示例插入 v2 草稿，不会自动覆盖原教案；你可以在提交页继续编辑或删除。",
        confirmText: "生成示例",
      }).then(function (ok) {
        if (!ok) return;
        window.TE.toast(
          "已生成改写示例",
          "演示阶段不写入正文；正式版将在 v2 草稿中与原文区分显示。",
          "success",
        );
      });
    });
  });

  /* ---------- 导出 / 查看原文 ---------- */
  document.getElementById("exportBtn").addEventListener("click", function () {
    window.TE.toast(
      "导出为演示占位",
      "正式版支持导出 PDF / Markdown，并在页脚标注量表版本与“仅供优化参考”。",
      "info",
    );
  });

  var openV1 = document.querySelector("[data-open-v1]");
  if (openV1) {
    openV1.addEventListener("click", function () {
      window.TE.toast(
        "v1 原文（演示）",
        "历史版本保持只读；原型不保存完整文本，正式版在此展开原文与评价条件。",
        "info",
      );
    });
  }

  /* ---------- 教师复核 ---------- */
  document
    .getElementById("requestReview")
    .addEventListener("click", function () {
      window.TE.confirm({
        title: "申请教师复核？",
        message:
          "申请后，经你授权的指导教师可查看这份教案与本报告，并补充人工意见；可随时撤回授权。",
        confirmText: "发送申请",
      }).then(function (ok) {
        if (!ok) return;
        window.TE.toast(
          "已提交复核申请（演示）",
          "教师意见会单独展示，不会改写 AI 建议原文。",
          "success",
        );
      });
    });
})();
