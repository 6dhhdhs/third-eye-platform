/* =========================================================
 * AI 评教案 · 提交页（PRD 5.7.2 / P-10、P-11）
 * 原型只做字段校验、文件校验与提交记录，不解析文档、不调用 AI。
 * ========================================================= */
(function initLessonReview() {
  "use strict";

  var SAMPLE_TEXT = [
    "《赤壁赋》教学设计（第二课时）",
    "",
    "一、教材内容与学情分析",
    "《赤壁赋》是统编版高中语文必修上册第七单元的自读课文，单元主题为“自然情怀”。本文以主客问答展开，由眼前之景转入人生之思，是理解“以景结情、以理入文”的重要样本。",
    "授课班级为高一（3）班。学生已能借助注释疏通文意，但对“变与不变”的哲理讨论容易停留在结论记忆，缺少从文本语句回到情感逻辑的推理过程；部分学生在文言表达上仍有障碍，需要提供注释支架。",
    "",
    "二、教学目标",
    "1. 能圈画“清风徐来”“白露横江”等写景语句，说明景物描写如何烘托人物心境。",
    "2. 能梳理主客问答的三次转折，用自己的话解释“变与不变”的内涵。",
    "3. 能结合具体语句，评价作者在困境中的自我开解方式，并联系自身经验写出 200 字短评。",
    "",
    "三、教学重难点",
    "重点：通过主客问答梳理情感变化线索。",
    "难点：理解哲理讨论与景物描写之间的关系，避免把结论当作标签记忆。",
    "",
    "四、教学过程",
    "环节一（5 分钟）情境导入：播放赤壁江月夜景音频，请学生用三个形容词描述感受，教师板书学生词语。",
    "环节二（12 分钟）初读感知：学生自由朗读，圈画写景句，同桌互说“这句景语让你想到怎样的心情”。",
    "环节三（15 分钟）细读主客问答：教师出示三层追问，小组合作完成表格，梳理“乐—悲—喜”的情感变化及对应语句。",
    "环节四（8 分钟）哲思讨论：围绕“逝者如斯，而未尝往也”展开辩论，教师提供两种解读支架，要求学生必须引用原文佐证。",
    "环节五（5 分钟）小结与作业：学生用一句话概括“苏子的回答解决了什么问题”，教师总结并以齐读收束。",
    "",
    "五、学习评价",
    "课堂中通过小组表格与追问回答即时检查目标 1、2 的达成情况；课后完成 200 字短评，按“引用原文—解释情感—联系自身”三项要求自评与互评。",
    "",
    "六、板书设计",
    "景：清风 明月 江水 → 情：乐—悲—喜 → 理：变与不变",
    "",
    "七、教学反思（预设）",
    "辩论环节可能出现脱离文本的空谈，需要提前规定“每一条观点必须带一处原文”。学生对“变与不变”的理解是否真正发生，还需通过短评中的解释质量来验证。",
  ].join("\n");

  var form = document.getElementById("lessonReviewForm");
  var grade = document.getElementById("grade");
  var subject = document.getElementById("subject");
  var planTitle = document.getElementById("planTitle");
  var lessonTitle = document.getElementById("lessonTitle");
  var concern = document.getElementById("concern");
  var planText = document.getElementById("planText");
  var textCount = document.getElementById("textCount");
  var errorBox = document.getElementById("formError");
  var privacy = document.getElementById("privacy");
  var modePaste = document.getElementById("modePaste");
  var modeUpload = document.getElementById("modeUpload");
  var pastePanel = document.getElementById("pastePanel");
  var uploadPanel = document.getElementById("uploadPanel");
  var dropZone = document.getElementById("dropZone");
  var fileInput = document.getElementById("planFile");
  var fileInfo = document.getElementById("fileInfo");
  var fileName = document.getElementById("fileName");
  var fileMeta = document.getElementById("fileMeta");
  var fallback = document.getElementById("planTextFallback");
  var selectedFile = null;

  var DRAFT_KEY = "te.lesson-review.draft";
  var SUBMIT_KEY = "te.lesson-review.submission";

  function countText(value) {
    return value.replace(/\s/g, "").length;
  }

  function updateCount() {
    var n = countText(planText.value);
    textCount.textContent =
      n + " 字 · " + (n >= 600 ? "长度充足" : "建议至少 600 字");
  }

  planText.addEventListener("input", updateCount);
  updateCount();

  document.getElementById("fillSample").addEventListener("click", function () {
    planText.value = SAMPLE_TEXT;
    updateCount();
    window.TE.toast(
      "已填入示例教案",
      "内容仅用于演示报告中的原文引用。",
      "info",
    );
  });

  document.getElementById("fillAll").addEventListener("click", function () {
    planText.value = SAMPLE_TEXT;
    updateCount();
    privacy.checked = true;
    errorBox.hidden = true;
    window.TE.toast(
      "示例内容已就绪",
      "可直接点击“校验并提交评价”体验完整流程。",
      "success",
    );
  });

  /* ---------- 输入方式切换 ---------- */
  function setMode(mode) {
    var paste = mode === "paste";
    modePaste.classList.toggle("is-on", paste);
    modePaste.setAttribute("aria-pressed", String(paste));
    modeUpload.classList.toggle("is-on", !paste);
    modeUpload.setAttribute("aria-pressed", String(!paste));
    pastePanel.hidden = !paste;
    uploadPanel.hidden = paste;
  }

  modePaste.addEventListener("click", function () {
    setMode("paste");
  });
  modeUpload.addEventListener("click", function () {
    setMode("upload");
  });

  /* ---------- 文件校验（不解析正文） ---------- */
  function humanSize(bytes) {
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function acceptFile(file) {
    if (!file) return;
    var okExt = /\.(docx|pdf|txt)$/i.test(file.name);
    if (!okExt) {
      window.TE.toast(
        "文件类型不支持",
        "请上传 DOCX、PDF 或 TXT；也可以直接粘贴教案文本。",
        "error",
      );
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      window.TE.toast("文件过大", "单个文件不超过 20MB。", "error");
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileMeta.textContent = " · " + humanSize(file.size);
    fileInfo.hidden = false;
  }

  dropZone.addEventListener("click", function () {
    fileInput.click();
  });
  dropZone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", function () {
    acceptFile(fileInput.files && fileInput.files[0]);
  });
  ["dragenter", "dragover"].forEach(function (type) {
    dropZone.addEventListener(type, function (e) {
      e.preventDefault();
      dropZone.style.borderColor = "#8fafc8";
      dropZone.style.background = "#eef5fa";
    });
  });
  ["dragleave", "drop"].forEach(function (type) {
    dropZone.addEventListener(type, function (e) {
      e.preventDefault();
      dropZone.style.borderColor = "#cfdde7";
      dropZone.style.background = "#f8fbfd";
    });
  });
  dropZone.addEventListener("drop", function (e) {
    acceptFile(e.dataTransfer && e.dataTransfer.files[0]);
  });

  /* ---------- 错误提示 ---------- */
  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    if (field) {
      field.focus();
      field.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  /* ---------- 草稿 ---------- */
  document.getElementById("saveDraft").addEventListener("click", function () {
    var draft = {
      grade: grade.value,
      subject: subject.value,
      planTitle: planTitle.value,
      lessonTitle: lessonTitle.value,
      concern: concern.value,
      text: planText.value,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      /* 忽略存储失败 */
    }
    window.TE.toast(
      "草稿已保存",
      "仅保存在本机浏览器，刷新后可继续编辑。",
      "success",
    );
  });

  function restoreDraft() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(DRAFT_KEY);
    } catch (err) {
      return;
    }
    if (!raw) return;
    try {
      var draft = JSON.parse(raw);
      if (!draft || !draft.text) return;
      grade.value = draft.grade || grade.value;
      subject.value = draft.subject || subject.value;
      planTitle.value = draft.planTitle || planTitle.value;
      lessonTitle.value = draft.lessonTitle || lessonTitle.value;
      concern.value = draft.concern || "";
      planText.value = draft.text;
      updateCount();
      window.TE.toast("已恢复上次草稿", "可继续编辑或重新提交。", "info");
    } catch (err) {
      /* 草稿损坏时忽略 */
    }
  }

  /* ---------- 提交 ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    if (!grade.value) return showError("请选择学段。", grade);
    if (!subject.value.trim()) return showError("请填写学科。", subject);
    if (!planTitle.value.trim())
      return showError("请填写教案主题，便于生成历史记录。", planTitle);
    if (!lessonTitle.value.trim())
      return showError("请填写教学课题。", lessonTitle);

    var text = planText.value.trim() || fallback.value.trim();
    var uploading = !uploadPanel.hidden;
    if (uploading && !selectedFile && text.length === 0) {
      return showError("请先选择教案文档，或粘贴教案文本。", dropZone);
    }
    if (!uploading && countText(text) < 100) {
      return showError(
        "教案正文过短，至少 100 字；内容不足会只得到“信息不足”提示。",
        planText,
      );
    }
    if (!privacy.checked) {
      return showError("请先确认隐私与用途说明。", privacy);
    }

    var submission = {
      grade: grade.value,
      subject: subject.value.trim(),
      planTitle: planTitle.value.trim(),
      lessonTitle: lessonTitle.value.trim(),
      concern: concern.value.trim(),
      chars: countText(text),
      fileName: selectedFile ? selectedFile.name : "",
      submittedAt: new Date().toISOString(),
      version: "v1",
    };

    try {
      window.localStorage.setItem(SUBMIT_KEY, JSON.stringify(submission));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      /* 存储失败时仍可走演示流程 */
    }

    window.TE.toast("提交成功", "正在进入分析进度页（演示流程）。", "success");
    setTimeout(function () {
      window.location.href = "lesson-review-status.html";
    }, 600);
  });

  restoreDraft();
})();
