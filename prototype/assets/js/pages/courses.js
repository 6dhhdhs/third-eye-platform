/* =========================================================
 * 课程列表 · 搜索与筛选（PRD 5.4，空状态见 9.2）
 * ========================================================= */
(function initCourses() {
  "use strict";

  var searchInput = document.getElementById("courseSearch");
  var grid = document.getElementById("courseGrid");
  var emptyState = document.getElementById("courseEmpty");
  var countLabel = document.getElementById("courseCount");
  var chips = Array.prototype.slice.call(
    document.querySelectorAll(".filter-chip"),
  );
  var cards = Array.prototype.slice.call(
    document.querySelectorAll(".course-card"),
  );

  var filters = { subject: "all", type: "all" };
  var keyword = (window.TE.param("q") || "").trim();

  if (keyword && searchInput) searchInput.value = keyword;

  function setChipState(chip, active) {
    chip.classList.toggle("is-on", active);
    chip.setAttribute("aria-pressed", String(active));
  }

  function render() {
    var visible = 0;

    cards.forEach(function (card) {
      var matchSubject =
        filters.subject === "all" || card.dataset.subject === filters.subject;
      var matchType =
        filters.type === "all" || card.dataset.type === filters.type;
      var haystack = card.dataset.title + " " + card.textContent;
      var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
      var show = matchSubject && matchType && matchKeyword;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (countLabel) countLabel.textContent = "共 " + visible + " 门";
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.dataset.filterGroup;
      filters[group] = chip.dataset.value;
      chips.forEach(function (other) {
        if (other.dataset.filterGroup === group)
          setChipState(other, other === chip);
      });
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      keyword = searchInput.value.trim();
      render();
    });
  }

  var clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      filters = { subject: "all", type: "all" };
      keyword = "";
      if (searchInput) searchInput.value = "";
      chips.forEach(function (chip) {
        setChipState(chip, chip.dataset.value === "all");
      });
      render();
    });
  }

  render();
})();
