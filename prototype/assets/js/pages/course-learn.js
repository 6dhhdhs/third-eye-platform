/* =========================================================
 * 课程学习页 · 播放、章节目录与完成学习
 * 原型阶段使用静态封面模拟播放器，不产生真实学习记录。
 * ========================================================= */
(function initCourseLearn() {
  "use strict";

  var playBtn = document.getElementById("playBtn");
  var videoProgress = document.getElementById("videoProgress");
  var lessonProgress = document.getElementById("lessonProgress");
  var lessonProgressText = document.getElementById("lessonProgressText");
  var chapters = Array.prototype.slice.call(
    document.querySelectorAll(".chapter-btn"),
  );
  var completeBtn = document.getElementById("completeLesson");
  var playing = false;
  var progress = 34;

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      playing = !playing;
      playBtn.querySelector(".material-symbols-outlined").textContent = playing
        ? "pause"
        : "play_arrow";
      window.TE.toast(
        playing ? "开始播放（演示）" : "已暂停",
        "原型阶段使用静态封面模拟播放器。",
        "info",
      );
    });
  }

  chapters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      chapters.forEach(function (other) {
        other.classList.remove("is-on");
        other.removeAttribute("aria-current");
        other.querySelector("[data-icon]").textContent =
          "radio_button_unchecked";
      });
      btn.classList.add("is-on");
      btn.setAttribute("aria-current", "true");
      btn.querySelector("[data-icon]").textContent = "play_circle";
      window.TE.toast(
        "已切换到 " + btn.dataset.chapter,
        "学习进度将按新章节重新计算。",
        "info",
      );
    });
  });

  if (completeBtn) {
    completeBtn.addEventListener("click", function () {
      progress = Math.min(100, progress + 18);
      if (lessonProgress) lessonProgress.style.width = progress + "%";
      if (videoProgress)
        videoProgress.style.width = Math.min(100, progress + 10) + "%";
      if (lessonProgressText) lessonProgressText.textContent = progress + "%";

      if (progress >= 100) {
        completeBtn.disabled = true;
        completeBtn.textContent = "本节已完成 ✓";
        window.TE.toast(
          "本节学习完成",
          "已计入今日打卡资格，可回到首页完成打卡。",
          "success",
        );
      } else {
        window.TE.toast(
          "进度已保存",
          "本节进度 " + progress + "%，可继续观看或前往观察工作台练习。",
          "success",
        );
      }
    });
  }
})();
