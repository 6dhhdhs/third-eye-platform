/* =========================================================
 * 课堂观察工作台
 * 标注 → 证据链 → 引用到评课稿 → 提交生成三维报告（PRD 5.5 / 5.6）
 * 原型阶段不加载真实视频，时间戳固定为示例值 15:42。
 * ========================================================= */
(function initClassroomWorkbench() {
  "use strict";

  var NOW = "15:42";

  /* ---------- 1. 事件类型单选 ---------- */
  var pills = Array.prototype.slice.call(
    document.querySelectorAll("#category-chips-group .cat-pill"),
  );
  var selectedCategory = "师生互动";

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (other) {
        other.classList.remove("is-on");
        other.setAttribute("aria-pressed", "false");
      });
      pill.classList.add("is-on");
      pill.setAttribute("aria-pressed", "true");
      selectedCategory = pill.getAttribute("data-tag");
    });
  });

  /* ---------- 2. 字数统计 ---------- */
  var descInput = document.getElementById("event-desc-input");
  var charCounter = document.getElementById("char-count");
  if (descInput && charCounter) {
    descInput.addEventListener("input", function () {
      charCounter.textContent = descInput.value.length;
    });
  }

  /* ---------- 3. 时间戳跳转 ---------- */
  function bindTimestamp(btn) {
    btn.addEventListener("click", function () {
      window.TE.toast(
        "已定位到片段 " + btn.getAttribute("data-time"),
        "演示阶段不播放真实视频；正式版会让播放器跳到该时间点。",
        "info",
      );
    });
  }
  document.querySelectorAll(".timestamp-chip").forEach(bindTimestamp);

  /* ---------- 4. 引用到评课稿 ---------- */
  function insertCitation(citationStr) {
    if (!citationStr) return;
    var target = document.getElementById("critique-section-1");
    if (!target) return;
    var pos =
      typeof target.selectionStart === "number"
        ? target.selectionStart
        : target.value.length;
    var pre = target.value.substring(0, pos);
    var post = target.value.substring(pos);
    target.value = pre + " " + citationStr + " " + post;
    target.focus();
    target.selectionStart = target.selectionEnd = pos + citationStr.length + 2;
  }

  function bindCite(btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      insertCitation(btn.getAttribute("data-cite"));
      window.TE.toast(
        "已插入引用",
        "评课稿中已带上时间戳，可回跳录像核对。",
        "success",
      );
    });
  }
  document.querySelectorAll(".insert-cite-btn").forEach(bindCite);

  /* ---------- 5. 新增标注 ---------- */
  var saveBtn = document.getElementById("save-event-btn");
  var clearBtn = document.getElementById("clear-input-btn");
  var container = document.getElementById("evidence-container");
  var myCount = document.getElementById("my-count");

  function bumpCount() {
    if (!myCount) return;
    myCount.textContent = String(
      container.querySelectorAll(".evidence").length,
    );
  }

  if (clearBtn && descInput) {
    clearBtn.addEventListener("click", function () {
      descInput.value = "";
      charCounter.textContent = "0";
      descInput.focus();
    });
  }

  function buildEvidenceCard(text, category) {
    var card = document.createElement("article");
    card.className = "evidence is-fresh";

    var head = document.createElement("div");
    head.className = "evidence-head";

    var tags = document.createElement("div");
    tags.className = "tags";

    var stamp = document.createElement("button");
    stamp.type = "button";
    stamp.className = "stamp red timestamp-chip";
    stamp.setAttribute("data-time", NOW);
    stamp.innerHTML =
      '<span class="material-symbols-outlined">play_circle</span>';
    stamp.appendChild(document.createTextNode(NOW + " (刚刚)"));

    var cat = document.createElement("span");
    cat.className = "tag tag-blue";
    cat.textContent = category;

    tags.appendChild(stamp);
    tags.appendChild(cat);

    var status = document.createElement("span");
    status.className = "tag tag-grey";
    status.textContent = "新生成证据";

    head.appendChild(tags);
    head.appendChild(status);

    var body = document.createElement("p");
    body.textContent = text;

    var foot = document.createElement("div");
    foot.className = "evidence-foot";

    var hint = document.createElement("span");
    hint.textContent = "实训证据链已入库";

    var cite = document.createElement("button");
    cite.type = "button";
    cite.className = "insert-cite-btn cite";
    cite.setAttribute("data-cite", "[#" + NOW + " " + category + "]");
    cite.textContent = "引用到评课稿";

    foot.appendChild(hint);
    foot.appendChild(cite);

    card.appendChild(head);
    card.appendChild(body);
    card.appendChild(foot);

    bindTimestamp(stamp);
    bindCite(cite);
    return card;
  }

  if (saveBtn && descInput && container) {
    saveBtn.addEventListener("click", function () {
      var text = descInput.value.trim();
      if (!text) {
        window.TE.toast(
          "请先填写观察事实",
          "标注正文为必填项，描述师生具体语言与行为即可。",
          "error",
        );
        descInput.focus();
        return;
      }

      container.prepend(buildEvidenceCard(text, selectedCategory));
      bumpCount();
      descInput.value = "";
      charCounter.textContent = "0";

      var original = saveBtn.innerHTML;
      saveBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size:18px">done</span>已保存到证据列表';
      saveBtn.disabled = true;
      window.TE.toast(
        "证据已入库",
        "点“引用到评课稿”即可把这条时间戳写进正文。",
        "success",
      );
      window.setTimeout(function () {
        saveBtn.innerHTML = original;
        saveBtn.disabled = false;
      }, 1600);
    });
  }

  /* ---------- 6. 我的标注 / 专家参考 ---------- */
  var tabMyBtn = document.getElementById("tab-my-btn");
  var tabExpertBtn = document.getElementById("tab-expert-btn");
  var expertList = document.getElementById("expert-list");

  function setTab(isMine) {
    [tabMyBtn, tabExpertBtn].forEach(function (btn) {
      var on = btn === (isMine ? tabMyBtn : tabExpertBtn);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", String(on));
    });
    container.hidden = !isMine;
    expertList.hidden = isMine;
  }
  if (tabMyBtn && tabExpertBtn) {
    tabMyBtn.addEventListener("click", function () {
      setTab(true);
    });
    tabExpertBtn.addEventListener("click", function () {
      setTab(false);
    });
  }

  /* ---------- 7. 专家对照显隐 ---------- */
  var toggleExpertBtn = document.getElementById("toggle-expert-btn");
  var expertCard = document.getElementById("expert-benchmark-card");
  var expertToggleText = document.getElementById("expert-toggle-text");
  var expertActive = true;

  if (toggleExpertBtn && expertCard) {
    toggleExpertBtn.addEventListener("click", function () {
      expertActive = !expertActive;
      expertCard.hidden = !expertActive;
      expertToggleText.textContent = expertActive
        ? "专家参考对照 (已开启)"
        : "专家参考对照 (已隐藏)";
      toggleExpertBtn.setAttribute("aria-pressed", String(expertActive));
    });
  }

  /* ---------- 8. 草稿 ---------- */
  var draftBtn = document.getElementById("save-draft-btn");
  if (draftBtn) {
    draftBtn.addEventListener("click", function () {
      var original = draftBtn.textContent;
      draftBtn.textContent = "已保存草稿 ✓";
      window.TE.toast(
        "草稿已保存（演示）",
        "正式版会把标注与评课正文暂存到账号，刷新后可继续。",
        "success",
      );
      window.setTimeout(function () {
        draftBtn.textContent = original;
      }, 1600);
    });
  }

  /* ---------- 9. 播放（演示） ---------- */
  var playBtn = document.getElementById("play-video-btn");
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      window.TE.toast(
        "演示播放器",
        "原型使用静态封面，不播放真实录像；新标注时间戳固定为 15:42。",
        "info",
      );
    });
  }

  /* ---------- 10. 提交评课 ---------- */
  document.querySelectorAll("[data-submit-report]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var critique = document.getElementById("critique-section-1");
      if (!critique || !critique.value.trim()) {
        window.TE.toast(
          "评课正文不能为空",
          "请至少写一段“事实—解释—建议”，或引用一条标注后再提交。",
          "error",
        );
        if (critique) critique.focus();
        return;
      }

      window.TE.confirm({
        title: "提交评课报告？",
        message:
          "提交后系统将生成三维课堂观察能力报告（注意 / 推理 / 表述），生成期间评课正文不可修改。示例流程不会上传真实视频。",
        confirmText: "提交报告",
      }).then(function (ok) {
        if (!ok) return;
        window.TE.toast(
          "已提交观察证据",
          "正在生成能力诊断报告（演示）…",
          "success",
        );
        window.setTimeout(function () {
          window.location.href = "observe-report.html";
        }, 900);
      });
    });
  });

  bumpCount();
})();
