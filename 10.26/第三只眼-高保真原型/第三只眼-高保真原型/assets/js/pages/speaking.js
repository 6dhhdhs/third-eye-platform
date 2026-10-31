/* =========================================================
 * AI 说课实训 · 新建训练与上传
 * 规则：主题必填、视频必选、隐私须确认（PRD 9.3）
 * ========================================================= */
(function initSpeaking() {
  "use strict";

  var form = document.getElementById("speakingForm");
  var topic = document.getElementById("topic");
  var fileInput = document.getElementById("videoFile");
  var dropZone = document.getElementById("dropZone");
  var fileInfo = document.getElementById("fileInfo");
  var fileName = document.getElementById("fileName");
  var fileSize = document.getElementById("fileSize");
  var removeBtn = document.getElementById("removeFile");
  var privacy = document.getElementById("privacy");
  var selectedFile = null;

  function formatSize(bytes) {
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function showFile(file) {
    if (!file) return;
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size) + " · 已在本机读取，未上传";
    fileInfo.classList.remove("hidden");
    fileInfo.classList.add("flex");
    dropZone.classList.add("border-tertiary", "bg-tertiary/5");
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.classList.add("hidden");
    fileInfo.classList.remove("flex");
    dropZone.classList.remove("border-tertiary", "bg-tertiary/5");
  }

  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) {
      var file = fileInput.files[0];
      if (file.size > 500 * 1024 * 1024) {
        window.TE.toast(
          "文件超过 500MB",
          "请压缩或截取 5–20 分钟的核心说课片段后重试。",
          "error",
        );
        clearFile();
        return;
      }
      showFile(file);
    }
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropZone.classList.add("border-primary", "bg-surface-container");
    });
  });

  ["dragleave", "drop"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropZone.classList.remove("border-primary", "bg-surface-container");
    });
  });

  dropZone.addEventListener("drop", function (e) {
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) showFile(file);
  });

  removeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    clearFile();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!topic.value.trim()) {
      window.TE.toast(
        "请填写说课主题",
        "主题将用于生成诊断报告的上下文。",
        "error",
      );
      topic.focus();
      return;
    }
    if (!selectedFile) {
      window.TE.toast(
        "请先选择说课视频",
        "支持 MP4 / MOV，时长 5–20 分钟，大小不超过 500MB。",
        "error",
      );
      dropZone.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!privacy.checked) {
      window.TE.toast(
        "请先确认隐私说明",
        "视频仅用于生成个人诊断报告，不会公开展示。",
        "error",
      );
      privacy.focus();
      return;
    }

    window.TE.toast(
      "已提交，正在排队分析",
      "演示阶段将直接跳转到示例报告页。",
      "success",
    );
    setTimeout(function () {
      window.location.href = "speaking-report.html";
    }, 900);
  });
})();
