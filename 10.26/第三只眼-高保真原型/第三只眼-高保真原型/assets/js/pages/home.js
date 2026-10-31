/* 首页任务保留前端模拟状态，不将操作计为真实业务完成。 */
(function () {
  const tasks = [
    {
      type: "课程学习",
      color: "blue",
      name: "中学语文教学设计与课堂观察方法论",
      progress: 65,
      due: "示例任务 · 截止时间未设置",
      href: "course-learn.html",
    },
    {
      type: "课堂观察",
      color: "green",
      name: "《岳阳楼记》课堂证据与评课",
      progress: 40,
      due: "示例截止：10月20日 · 已过期",
      href: "observe-workbench.html",
    },
    {
      type: "AI 评教案",
      color: "purple",
      name: "《赤壁赋》教学设计教案检查",
      progress: 0,
      due: "示例任务 · 截止时间未设置",
      href: "lesson-review.html",
    },
  ];
  const list = document.getElementById("tasks");
  tasks.forEach((task, i) => {
    const card = document.createElement("article");
    card.className = "task-item";
    card.innerHTML = `<div class="task-meta"><span class="type-${task.color}">${task.type}</span><span data-status>${task.progress ? "进行中" : "待开始"}</span></div><h3>${task.name}</h3><div class="task-meter-row"><div class="meter" role="progressbar" aria-label="${task.name}进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${task.progress}"><span style="width:${task.progress}%"></span></div><span data-percent>${task.progress}%</span></div><small>${task.due}</small><div class="task-actions"><a href="${task.href}">进入任务 ↗</a><button type="button" data-complete="${i}">模拟完成</button></div>`;
    list.appendChild(card);
  });
  list.addEventListener("click", (e) => {
    const button = e.target.closest("[data-complete]");
    if (!button) return;
    const task = tasks[Number(button.dataset.complete)];
    if (task.progress === 100) return;
    task.progress = 100;
    const card = button.closest("article");
    card.querySelector(".meter span").style.width = "100%";
    card.querySelector(".meter").setAttribute("aria-valuenow", "100");
    card.querySelector("[data-percent]").textContent = "100%";
    card.querySelector("[data-status]").textContent = "已完成（模拟）";
    button.disabled = true;
    button.textContent = "已完成";
    document.getElementById("task-count").textContent =
      `${tasks.filter((t) => t.progress < 100).length} 项待完成`;
    window.TE.toast(
      "示例任务已完成",
      "任务进度和待办数量已同步更新；刷新后恢复示例。",
      "success",
    );
  });
  document.getElementById("today-date").textContent = new Intl.DateTimeFormat(
    "zh-CN",
    {
      timeZone: "Asia/Shanghai",
      month: "long",
      day: "numeric",
      weekday: "long",
    },
  ).format(new Date());
  const checkinBtn = document.getElementById("checkinBtn");
  const streakLabel = document.getElementById("streakDaysSummary");
  const checkin = window.TE_CHECKIN;

  function renderCheckin() {
    if (!checkin) return;
    streakLabel.textContent = checkin.streak();
    if (checkin.hasToday()) {
      checkinBtn.disabled = true;
      checkinBtn.textContent = "今日已打卡 ✓";
      checkinBtn.setAttribute(
        "aria-label",
        "今日已打卡，连续打卡 " + checkin.streak() + " 天",
      );
    }
  }

  checkinBtn.onclick = function () {
    if (!checkin) return;
    const result = checkin.markToday();
    this.disabled = true;
    this.textContent = "今日已打卡 ✓";
    this.setAttribute(
      "aria-label",
      "今日已打卡，连续打卡 " + result.streak + " 天",
    );
    streakLabel.textContent = result.streak;
    window.TE.toast(
      result.already ? "今天已经打过卡了" : "打卡成功",
      "连续打卡 " + result.streak + " 天（演示数据，按自然日去重）",
      "success",
    );
  };

  renderCheckin();

  const records = [
    ["09月28日", 72],
    ["10月05日", 77],
    ["10月12日", 75],
    ["10月19日", 82],
    ["10月26日", 86.7],
  ];
  const ys = [75, 58, 64, 36, 20];
  records.forEach((record, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "growth-point";
    b.style.left = `${6.67 + i * 21.66}%`;
    b.style.top = `${ys[i]}%`;
    const delta = i ? record[1] - records[i - 1][1] : null;
    const text = `${record[0]} · AI 评教案 · ${record[1]}分 · ${delta === null ? "首次记录" : `较上次 ${delta > 0 ? "+" : ""}${delta.toFixed(1)}分`}（示例）`;
    b.setAttribute("aria-label", text);
    const show = () => {
      document.getElementById("growth-detail").textContent = text;
    };
    b.onmouseenter = show;
    b.onfocus = show;
    b.onclick = show;
    document.getElementById("growth-points").appendChild(b);
  });
  document.querySelectorAll("[data-focus-entry]").forEach((a) =>
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.querySelector(".focus-transition").hidden = false;
      setTimeout(
        () => {
          window.location.href = a.href;
        },
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
      );
    }),
  );
})();
