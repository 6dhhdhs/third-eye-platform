/* =========================================================
 * 教案分析进度页（P-12）
 * 纯前端状态模拟：待分析 → 分析中 → 完成 / 失败可重试。
 * 不调用 AI，也不生成真实评价结论。
 * ========================================================= */
(function initReviewStatus() {
  "use strict";

  var SUBMIT_KEY = "te.lesson-review.submission";
  var pendingStep = document.getElementById("stepPending");
  var analyzingStep = document.getElementById("stepAnalyzing");
  var doneStep = document.getElementById("stepDone");
  var statusTag = document.getElementById("statusTag");
  var statusIcon = document.getElementById("statusIcon");
  var statusHeadline = document.getElementById("statusHeadline");
  var statusDesc = document.getElementById("statusDesc");
  var statusProgress = document.getElementById("statusProgress");
  var statusPercent = document.getElementById("statusPercent");
  var viewReport = document.getElementById("viewReport");
  var failDemo = document.getElementById("failDemo");
  var skipWait = document.getElementById("skipWait");
  var failPanel = document.getElementById("failPanel");
  var donePanel = document.getElementById("donePanel");
  var taskRows = Array.prototype.slice.call(
    document.querySelectorAll("#taskList [data-task]"),
  );

  var timers = [];
  var state = "idle";

  /* ---------- 读取提交信息（没有则用示例） ---------- */
  function readSubmission() {
    var fallback = {
      planTitle: "《赤壁赋》教学设计",
      lessonTitle: "第二课时 · 主客问答中的情与理",
      grade: "初中",
      subject: "语文",
      chars: 1180,
      version: "v1",
      submittedAt: new Date().toISOString(),
    };
    var raw = null;
    try {
      raw = window.localStorage.getItem(SUBMIT_KEY);
    } catch (err) {
      return fallback;
    }
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      return parsed && parsed.planTitle ? parsed : fallback;
    } catch (err) {
      return fallback;
    }
  }

  var submission = readSubmission();

  function formatTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  document.getElementById("submissionTitle").textContent = submission.planTitle;
  document.getElementById("submissionTopic").textContent =
    submission.lessonTitle || "未填写教学课题";
  document.getElementById("submissionGrade").textContent =
    (submission.grade || "未选择") + " · " + (submission.subject || "未填写");
  document.getElementById("submissionTime").textContent = formatTime(
    submission.submittedAt,
  );
  document.getElementById("submissionChars").textContent =
    (submission.chars || 0) + " 字" + (submission.fileName ? " · 含文档" : "");
  document.getElementById("submissionVersion").textContent =
    submission.version || "v1";

  /* ---------- 工具 ---------- */
  function clearTimers() {
    timers.forEach(function (id) {
      window.clearTimeout(id);
    });
    timers = [];
  }

  function later(fn, ms) {
    timers.push(window.setTimeout(fn, ms));
  }

  function setStep(el, cls) {
    el.classList.remove("done", "active");
    if (cls) el.classList.add(cls);
    if (cls === "active") el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  }

  function setTask(index, status) {
    var row = taskRows[index];
    if (!row) return;
    var tag = row.querySelector("[data-task-tag]");
    tag.className = "tag";
    if (status === "running") {
      tag.classList.add("tag-sand");
      tag.textContent = "进行中";
    } else if (status === "done") {
      tag.classList.add("tag-green");
      tag.textContent = "已完成";
    } else if (status === "failed") {
      tag.classList.add("tag-red");
      tag.textContent = "未完成";
    } else {
      tag.classList.add("tag-grey");
      tag.textContent = "等待中";
    }
  }

  function setProgress(percent, label) {
    statusProgress.style.width = percent + "%";
    statusPercent.textContent = percent + "% · " + label;
  }

  function disableReport(disabled) {
    viewReport.setAttribute("aria-disabled", String(disabled));
    viewReport.style.pointerEvents = disabled ? "none" : "";
    viewReport.style.opacity = disabled ? "0.5" : "";
  }

  /* ---------- 状态 ---------- */
  function renderPending() {
    state = "pending";
    statusTag.className = "tag tag-sand";
    statusTag.textContent = "待分析";
    statusIcon.textContent = "schedule";
    statusHeadline.textContent = "已进入分析队列";
    statusDesc.textContent =
      "系统正在确认提交内容是否可读取；通常几秒内开始分析。";
    setProgress(10, "排队等待");
    setStep(pendingStep, "active");
    setStep(analyzingStep, null);
    setStep(doneStep, null);
    taskRows.forEach(function (row, i) {
      setTask(i, "waiting");
    });
    disableReport(true);
  }

  function renderAnalyzing(step) {
    state = "analyzing";
    statusTag.className = "tag tag-sand";
    statusTag.textContent = "分析中";
    statusIcon.textContent = "hourglass_top";
    statusHeadline.textContent = "正在按六个维度检查教案";
    statusDesc.textContent =
      "解析文本结构 → 逐维检查 → 定位原文并生成建议。演示流程不会读取真实正文。";
    setStep(pendingStep, "done");
    setStep(analyzingStep, "active");
    setStep(doneStep, null);
    disableReport(true);
    failPanel.hidden = true;
    donePanel.hidden = true;

    setTask(0, step >= 1 ? "done" : step === 0 ? "running" : "waiting");
    setTask(1, step >= 2 ? "done" : step === 1 ? "running" : "waiting");
    setTask(2, step >= 3 ? "done" : step === 2 ? "running" : "waiting");

    if (step === 0) setProgress(30, "解析文本结构");
    if (step === 1) setProgress(55, "按六维量表检查");
    if (step === 2) setProgress(80, "定位原文并生成建议");
    if (step >= 3) setProgress(92, "整理报告");
  }

  function renderDone() {
    state = "done";
    clearTimers();
    statusTag.className = "tag tag-green";
    statusTag.textContent = "已完成";
    statusIcon.textContent = "task_alt";
    statusHeadline.textContent = "示例报告已生成";
    statusDesc.textContent =
      "报告包含六维结果、原文依据、缺项提醒与带优先级的修改建议。";
    setProgress(100, "完成");
    setStep(pendingStep, "done");
    setStep(analyzingStep, "done");
    setStep(doneStep, "active");
    taskRows.forEach(function (row, i) {
      setTask(i, "done");
    });
    donePanel.hidden = false;
    failPanel.hidden = true;
    disableReport(false);
    failDemo.querySelector("span:last-child").textContent = "模拟分析失败";
  }

  function renderFailed() {
    state = "failed";
    clearTimers();
    statusTag.className = "tag tag-red";
    statusTag.textContent = "失败";
    statusIcon.textContent = "error";
    statusHeadline.textContent = "分析失败，可重试";
    statusDesc.textContent =
      "演示失败状态：没有生成任何结论。可以重试，或返回修改后重新提交。";
    setProgress(0, "已中止");
    setStep(pendingStep, "done");
    setStep(analyzingStep, null);
    setStep(doneStep, null);
    taskRows.forEach(function (row, i) {
      setTask(i, i === 0 ? "failed" : "waiting");
    });
    failPanel.hidden = false;
    donePanel.hidden = true;
    disableReport(true);
    failDemo.querySelector("span:last-child").textContent = "重试分析";
  }

  /* ---------- 流程 ---------- */
  function run() {
    clearTimers();
    renderPending();
    later(function () {
      renderAnalyzing(0);
      later(function () {
        renderAnalyzing(1);
        later(function () {
          renderAnalyzing(2);
          later(function () {
            renderAnalyzing(3);
            later(renderDone, 700);
          }, 1100);
        }, 1000);
      }, 1000);
    }, 900);
  }

  skipWait.addEventListener("click", function () {
    if (state === "done") return;
    renderDone();
    window.TE.toast(
      "已跳到完成状态",
      "演示用快捷入口，报告仍为示例数据。",
      "info",
    );
  });

  failDemo.addEventListener("click", function () {
    if (state === "failed") {
      run();
      window.TE.toast("已重新提交分析", "演示流程将再次模拟状态变化。", "info");
      return;
    }
    renderFailed();
    window.TE.toast(
      "已模拟分析失败",
      "可点击“重试分析”体验失败重试。",
      "error",
    );
  });

  viewReport.addEventListener("click", function (e) {
    if (state !== "done") e.preventDefault();
  });

  run();
})();
