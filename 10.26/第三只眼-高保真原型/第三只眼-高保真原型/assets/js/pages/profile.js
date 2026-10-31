/* =========================================================
 * 个人中心 · 学习日历与资料交互
 * 打卡数据来自 checkin.js（与首页共用 localStorage），
 * 不再写死日期；今天按系统真实日期高亮（PRD 5.3 / 5.9）。
 * ========================================================= */
(function initProfile() {
  "use strict";

  var grid = document.getElementById("calendarGrid");
  var monthLabel = document.getElementById("calendarMonth");
  var streakStat = document.getElementById("streakStat");
  var profileStreak = document.getElementById("profileStreak");
  var monthTotal = document.getElementById("monthTotal");

  var checkin = window.TE_CHECKIN;
  var now = new Date();
  var todayKey =
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate());
  var view = { year: now.getFullYear(), month: now.getMonth() + 1 };
  var WEEK = ["一", "二", "三", "四", "五", "六", "日"];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(year, month, day) {
    return year + "-" + pad(month) + "-" + pad(day);
  }

  function renderStats() {
    if (!checkin) return;
    var streak = checkin.streak();
    if (streakStat) {
      streakStat.innerHTML = streak + "<small>天</small>";
    }
    if (profileStreak) profileStreak.textContent = String(streak);
    if (monthTotal) {
      monthTotal.textContent = String(
        checkin.daysInMonth(now.getFullYear(), now.getMonth() + 1).length,
      );
    }
  }

  function render() {
    if (!grid) return;

    var first = new Date(view.year, view.month - 1, 1);
    var daysInMonth = new Date(view.year, view.month, 0).getDate();
    // 周一为一周开始：JS getDay() 周日 = 0
    var offset = (first.getDay() + 6) % 7;
    var checked = checkin ? checkin.daysInMonth(view.year, view.month) : [];
    var isCurrentMonth =
      view.year === now.getFullYear() && view.month === now.getMonth() + 1;

    monthLabel.textContent = view.year + " 年 " + view.month + " 月";
    grid.innerHTML = "";

    WEEK.forEach(function (label) {
      var head = document.createElement("span");
      head.className = "cal-week";
      head.textContent = label;
      grid.appendChild(head);
    });

    for (var i = 0; i < offset; i += 1) {
      var blank = document.createElement("span");
      blank.className = "cal-day blank";
      blank.setAttribute("aria-hidden", "true");
      grid.appendChild(blank);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var key = dateKey(view.year, view.month, day);
      var done = checked.indexOf(day) !== -1;
      var isToday = key === todayKey;
      var isFuture = key > todayKey;

      var cell = document.createElement("button");
      cell.type = "button";
      cell.className =
        "cal-day" + (done ? " checked" : "") + (isToday ? " today" : "");
      cell.textContent = String(day);
      /* 日历逐日落位：按日号递延，整月不超过 0.4s，切月时重播 */
      cell.style.animationDelay = (day * 0.012).toFixed(3) + "s";
      cell.setAttribute(
        "aria-label",
        view.year +
          " 年 " +
          view.month +
          " 月 " +
          day +
          " 日" +
          (done ? "，已打卡" : isToday ? "，今天" : "，未打卡"),
      );

      cell.addEventListener(
        "click",
        (function (d, wasDone, future) {
          return function () {
            var label = view.year + " 年 " + view.month + " 月 " + d + " 日";
            if (future) {
              window.TE.toast(label, "这一天还没到，不能提前打卡。", "info");
            } else if (wasDone) {
              window.TE.toast(
                label,
                "当日已完成有效学习并打卡（自然日去重，一天只计一次）。",
                "success",
              );
            } else if (key === todayKey) {
              window.TE.toast(
                label,
                "今天还没有打卡，可在首页点击「今日打卡」。",
                "info",
              );
            } else {
              window.TE.toast(label, "当日没有打卡记录。", "info");
            }
          };
        })(day, done, isFuture),
      );

      grid.appendChild(cell);
    }
  }

  function shift(delta) {
    var month = view.month + delta;
    var year = view.year;
    if (month === 0) {
      month = 12;
      year -= 1;
    } else if (month === 13) {
      month = 1;
      year += 1;
    }
    view = { year: year, month: month };
    render();
  }

  var prev = document.getElementById("prevMonth");
  var next = document.getElementById("nextMonth");
  if (prev)
    prev.addEventListener("click", function () {
      shift(-1);
    });
  if (next)
    next.addEventListener("click", function () {
      shift(1);
    });

  var editBtn = document.getElementById("editProfile");
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      window.TE.toast(
        "资料编辑",
        "演示阶段不提交真实修改；正式版将支持昵称、专业与头像维护。",
        "info",
      );
    });
  }

  var privacyBtn = document.getElementById("privacySettings");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", function () {
      window.TE.toast(
        "隐私设置",
        "可管理教案与观察记录的可见范围、报告留存与个人档案导出。",
        "info",
      );
    });
  }

  // 另一个标签页打卡后，回来时同步天数
  window.addEventListener("storage", function (event) {
    if (event.key === "te.checkins.v1") {
      renderStats();
      render();
    }
  });

  renderStats();
  render();
})();
