/* =========================================================
 * 学习打卡 · 跨页面共享状态（PRD 5.3.6 / 5.9）
 * 首页与个人中心读同一份 localStorage 数据，保证天数一致。
 * 首次访问会写入一组明确标注为示例的历史打卡记录，供原型展示；
 * 用户点击打卡后按自然日去重，重复点击不会多加天数。
 * ========================================================= */
(function (window) {
  "use strict";

  var KEY = "te.checkins.v1";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toKey(date) {
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate())
    );
  }

  function today() {
    return toKey(new Date());
  }

  function addDays(date, delta) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + delta);
    return next;
  }

  /* 示例历史：最近 30 天里有 4 天休息，其余日期打卡；不含今天。 */
  function seedDates() {
    var list = [];
    var base = new Date();
    for (var i = 30; i >= 1; i -= 1) {
      var d = addDays(base, -i);
      // 固定节奏留出休息日，保证连续天数不是简单的 30
      if (i % 7 === 0 || i === 13) continue;
      list.push(toKey(d));
    }
    return list;
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.dates)) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function write(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      /* 隐私模式下写不进去也不影响本次浏览 */
    }
  }

  var data = read();
  if (!data) {
    data = { version: 1, demo: true, dates: seedDates() };
    write(data);
  }

  function sortedDates() {
    return data.dates.slice().sort();
  }

  function has(day) {
    return data.dates.indexOf(day) !== -1;
  }

  function streak() {
    var count = 0;
    var cursor = new Date();
    // 今天没打卡时，从昨天开始数，避免“今天没打就归零”
    if (!has(toKey(cursor))) cursor = addDays(cursor, -1);
    while (has(toKey(cursor))) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  function markToday() {
    var day = today();
    var already = has(day);
    if (!already) {
      data.dates.push(day);
      write(data);
    }
    return { date: day, already: already, streak: streak() };
  }

  function daysInMonth(year, month) {
    var prefix = year + "-" + pad(month) + "-";
    return sortedDates()
      .filter(function (d) {
        return d.indexOf(prefix) === 0;
      })
      .map(function (d) {
        return Number(d.slice(8));
      });
  }

  function totalThisMonth() {
    var now = new Date();
    return daysInMonth(now.getFullYear(), now.getMonth() + 1).length;
  }

  window.TE_CHECKIN = {
    today: today,
    has: has,
    hasToday: function () {
      return has(today());
    },
    streak: streak,
    totalThisMonth: totalThisMonth,
    markToday: markToday,
    daysInMonth: daysInMonth,
    isDemo: function () {
      return Boolean(data.demo);
    },
  };
})(window);
