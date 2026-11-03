/* =========================================================
 * 第三只眼 · 全局布局
 * 职责：
 *   1. 注入统一的顶栏、左侧导航（与首页同款）与页脚，保证所有页面
 *      的排版骨架完全一致。
 *   2. 根据 <body data-page="..."> 高亮当前一级导航（PRD 7.3）。
 *   3. 提供“原型地图”浮层，方便评审 / 答辩时直达任意页面。
 *
 * 页面约定：
 *   <body class="workspace" data-root=".." data-page="home">
 *   data-root：相对项目根目录的层级，index.html 为 "."，pages/*.html 为 ".."
 *   data-page：home | courses | observe | lesson-review | profile | index
 *   body 加 no-sidebar 类时不渲染左侧导航（登录页等外壳页）
 * ========================================================= */
(function (window, document) {
  "use strict";

  var body = document.body;
  var ROOT = body.getAttribute("data-root") || ".";
  var PAGE = body.getAttribute("data-page") || "";
  var IS_WORKSPACE = body.classList.contains("workspace");
  var HAS_SIDEBAR = IS_WORKSPACE && !body.classList.contains("no-sidebar");

  var NAV_ITEMS = [
    { key: "home", label: "首页工作台", file: "pages/home.html" },
    { key: "courses", label: "课程学习", file: "pages/courses.html" },
    { key: "observe", label: "课堂观察与评课", file: "pages/observe.html" },
    {
      key: "lesson-review",
      label: "AI 评教案",
      file: "pages/lesson-review.html",
    },
    { key: "profile", label: "个人中心与档案", file: "pages/profile.html" },
  ];

  var NAV_ICONS = [
    "space_dashboard",
    "menu_book",
    "frame_inspect",
    "fact_check",
    "person",
  ];

  var ACTIVE_MAP = {
    "course-learn": "courses",
    "observe-workbench": "observe",
    "observe-report": "observe",
    "lesson-review-status": "lesson-review",
    "lesson-review-report": "lesson-review",
  };

  var PAGE_GROUPS = [
    {
      title: "原型入口",
      items: [
        {
          file: "index.html",
          label: "原型总览",
          desc: "页面地图、跳转规则与设计说明",
        },
      ],
    },
    {
      title: "主流程",
      items: [
        {
          file: "pages/home.html",
          label: "首页学习工作台",
          desc: "学习入口 · 每日打卡",
        },
        {
          file: "pages/courses.html",
          label: "课程列表",
          desc: "搜索、筛选、课程卡片",
        },
        {
          file: "pages/course-learn.html",
          label: "课程学习页",
          desc: "视频、章节目录、学习任务",
        },
        {
          file: "pages/observe.html",
          label: "课堂观察任务",
          desc: "已授权课例与我的记录",
        },
        {
          file: "pages/observe-workbench.html",
          label: "课堂观察工作台",
          desc: "时间戳标注 + 评课撰写",
        },
        {
          file: "pages/observe-report.html",
          label: "观察能力报告",
          desc: "注意 / 推理 / 表述三维反馈",
        },
        {
          file: "pages/lesson-review.html",
          label: "AI 评教案 · 新建评价",
          desc: "学段学科、教案文本、文档提交",
        },
        {
          file: "pages/lesson-review-status.html",
          label: "教案分析进度",
          desc: "待分析 / 分析中 / 失败 / 完成",
        },
        {
          file: "pages/lesson-review-report.html",
          label: "教案评价报告",
          desc: "六维结果、原文依据与修改建议",
        },
        {
          file: "pages/profile.html",
          label: "个人中心",
          desc: "学习日历、记录与成长概览",
        },
      ],
    },
    {
      title: "辅助页面",
      items: [
        { file: "pages/login.html", label: "登录 / 注册", desc: "账号入口" },
        {
          file: "pages/404.html",
          label: "404 页面",
          desc: "内容不可用 / 无权限",
        },
      ],
    },
    {
      title: "设计归档",
      items: [
        {
          file: "archive/originals/home-alt-1.html",
          label: "首页备选方案 A",
          desc: "Stitch 原始稿 _3",
        },
        {
          file: "archive/originals/home-alt-2.html",
          label: "首页备选方案 B",
          desc: "Stitch 原始稿 _5",
        },
        {
          file: "archive/originals/observe-workbench-alt.html",
          label: "观察台备选方案",
          desc: "Stitch 原始稿 _4",
        },
        {
          file: "archive/originals/speaking-report-alt.html",
          label: "报告页备选方案",
          desc: "Stitch 原始稿 ai_2",
        },
      ],
    },
  ];

  function url(file) {
    return ROOT + "/" + file;
  }

  function activeKey() {
    return ACTIVE_MAP[PAGE] || PAGE;
  }

  /* ---------- 顶部导航 ---------- */
  function buildHeader() {
    var current = activeKey();

    var mobileNavHtml = NAV_ITEMS.map(function (item) {
      var active = item.key === current;
      return (
        '<a class="flex items-center justify-between rounded-lg px-space-md py-space-sm font-label-lg text-label-lg ' +
        (active
          ? "bg-secondary-container text-on-primary-container font-semibold"
          : "text-on-surface-variant hover:bg-surface-container-high") +
        '"' +
        (active ? ' aria-current="page"' : "") +
        ' href="' +
        url(item.file) +
        '">' +
        item.label +
        '<span class="material-symbols-outlined text-[18px]">chevron_right</span></a>'
      );
    }).join("");

    var header = document.createElement("header");
    header.className =
      "fixed inset-x-0 top-0 z-50 border-b border-outline-variant/40 bg-surface-container-lowest/90 backdrop-blur-md";
    header.innerHTML =
      '<div class="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-space-md px-margin-mobile lg:px-margin">' +
      '<div class="flex min-w-0 items-center gap-space-lg">' +
      '<a class="flex shrink-0 items-center gap-space-sm" href="' +
      url("pages/home.html") +
      '" aria-label="第三只眼首页">' +
      '<svg class="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<rect width="32" height="32" rx="10" fill="#426278" fill-opacity="0.12"/>' +
      '<path d="M6 16c2.6-4.3 6-6.5 10-6.5S23.4 11.7 26 16c-2.6 4.3-6 6.5-10 6.5S8.6 20.3 6 16Z" stroke="#426278" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<circle cx="16" cy="16" r="3.1" fill="#426278"/>' +
      "</svg>" +
      '<span class="flex min-w-0 flex-col">' +
      '<span class="truncate font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">第三只眼</span>' +
      '<span class="truncate font-label-sm text-label-sm font-medium text-on-surface-variant">师范生智能学习与教学能力训练平台</span>' +
      "</span>" +
      "</a>" +
      "</div>" +
      '<div class="flex shrink-0 items-center gap-space-sm md:gap-space-md">' +
      '<div class="relative hidden items-center md:flex">' +
      '<span class="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-on-surface-variant">search</span>' +
      '<input id="te-search" type="search" aria-label="搜索实训课例、技能指标或教案报告" class="w-56 rounded-lg bg-surface-container-low py-1.5 pl-9 pr-8 font-body-sm text-body-sm text-on-surface shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:outline-none lg:w-64" placeholder="搜索课例、指标或教案报告" />' +
      '<kbd class="absolute right-2 rounded bg-surface-container-highest px-1.5 py-0.5 font-label-sm text-[10px] text-on-surface-variant">⌘K</kbd>' +
      "</div>" +
      '<button id="te-notify" type="button" aria-label="通知提醒" class="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">' +
      '<span class="material-symbols-outlined text-[22px]">notifications</span>' +
      '<span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>' +
      "</button>" +
      '<a class="hidden items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-surface-container-high sm:flex" href="' +
      url("pages/profile.html") +
      '">' +
      '<span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary" aria-hidden="true">林</span>' +
      '<span class="hidden flex-col leading-tight lg:flex">' +
      '<span class="font-label-md text-label-md font-semibold text-on-surface">林思齐</span>' +
      '<span class="font-label-sm text-label-sm text-on-surface-variant">汉语言师范 2302 班</span>' +
      "</span>" +
      "</a>" +
      '<button id="te-menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="te-mobile-nav" class="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high xl:hidden">' +
      '<span class="material-symbols-outlined text-[24px]">menu</span>' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<nav id="te-mobile-nav" class="hidden border-t border-outline-variant/40 bg-surface-container-lowest px-margin-mobile py-space-sm xl:hidden" aria-label="移动端导航">' +
      '<div class="flex flex-col gap-1">' +
      mobileNavHtml +
      "</div>" +
      "</nav>";

    body.insertBefore(header, body.firstChild);
    if (IS_WORKSPACE) header.classList.add("ws-header");

    var menuBtn = header.querySelector("#te-menu-btn");
    var mobileNav = header.querySelector("#te-mobile-nav");
    menuBtn.addEventListener("click", function () {
      var open = !mobileNav.classList.contains("hidden");
      mobileNav.classList.toggle("hidden", open);
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.querySelector(".material-symbols-outlined").textContent = open
        ? "menu"
        : "close";
    });

    if (IS_WORKSPACE) {
      document.addEventListener("keydown", function (e) {
        if (mobileNav.classList.contains("hidden")) return;
        if (e.key === "Escape") {
          menuBtn.click();
          menuBtn.focus();
        }
        if (e.key === "Tab") {
          var links = Array.from(mobileNav.querySelectorAll("a"));
          var first = links[0],
            last = links[links.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            menuBtn.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            menuBtn.focus();
          } else if (e.shiftKey && document.activeElement === menuBtn) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === menuBtn) {
            e.preventDefault();
            first.focus();
          }
        }
      });
      menuBtn.addEventListener("click", function () {
        if (!mobileNav.classList.contains("hidden"))
          mobileNav.querySelector("a").focus();
      });
    }

    var search = header.querySelector("#te-search");
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && search.value.trim()) {
        window.location.href =
          url("pages/courses.html") +
          "?q=" +
          encodeURIComponent(search.value.trim());
      }
    });

    header.querySelector("#te-notify").addEventListener("click", function () {
      window.TE.toast(
        "暂无新通知",
        "完成课堂观察或教案评价后，这里会收到能力诊断提醒。",
        "info",
      );
    });
  }

  /* ---------- 左侧导航（所有内页与首页一致） ---------- */
  function buildSidebar() {
    if (!HAS_SIDEBAR) return;
    var current = activeKey();
    var sidebar = document.createElement("aside");
    sidebar.className = "ws-sidebar";
    sidebar.innerHTML =
      '<div class="sidebar-heading"><span>学习空间</span><button id="sidebar-toggle" type="button" aria-label="折叠侧边栏" aria-expanded="true"><span class="material-symbols-outlined">left_panel_close</span></button></div><nav aria-label="工作台导航">' +
      NAV_ITEMS.map(function (item, i) {
        return (
          '<a title="' +
          item.label +
          '" aria-label="' +
          item.label +
          '" href="' +
          url(item.file) +
          '"' +
          (item.key === current ? ' aria-current="page"' : "") +
          '><span class="material-symbols-outlined" aria-hidden="true">' +
          NAV_ICONS[i] +
          '</span><span class="sidebar-label">' +
          item.label +
          "</span></a>"
        );
      }).join("") +
      '</nav><div class="sidebar-bottom"><span class="eyebrow sidebar-label">每一次练习，都有迹可循</span><a href="' +
      url("pages/observe-workbench.html") +
      '" title="观察工作台 · 实训小助手"><span class="material-symbols-outlined">psychology_alt</span><span class="sidebar-label">实训小助手<small>前往现有观察工作台</small></span></a></div>';
    body.appendChild(sidebar);
    sidebar
      .querySelector("#sidebar-toggle")
      .addEventListener("click", function () {
        var collapsed = body.classList.toggle("sidebar-collapsed");
        this.setAttribute("aria-expanded", String(!collapsed));
        this.setAttribute(
          "aria-label",
          collapsed ? "展开侧边栏" : "折叠侧边栏",
        );
      });
  }

  /* ---------- 页脚 ---------- */
  function buildFooter() {
    var footer = document.createElement("footer");
    footer.className =
      "w-full bg-surface-container-lowest py-space-xl shadow-[0_-1px_6px_rgba(37,59,74,0.03)]";
    footer.innerHTML =
      '<div class="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-space-md px-margin-mobile font-body-sm text-body-sm text-on-surface-variant md:flex-row lg:px-margin">' +
      '<div class="flex flex-wrap items-center justify-center gap-space-sm">' +
      '<span class="material-symbols-outlined text-[20px] text-primary">psychology_alt</span>' +
      '<span class="font-medium text-on-surface">第三只眼 · 教学行为多模态诊断实验平台</span>' +
      '<span class="text-outline-variant">|</span>' +
      "<span>国家级教师教育实验教学示范中心技术支持</span>" +
      "</div>" +
      '<div class="flex flex-wrap items-center justify-center gap-space-lg">' +
      '<a class="transition-colors hover:text-on-surface" href="' +
      url("index.html") +
      '#guide">实训指南</a>' +
      '<a class="transition-colors hover:text-on-surface" href="' +
      url("index.html") +
      '#glossary">多模态指标词典</a>' +
      '<a class="transition-colors hover:text-on-surface" href="' +
      url("index.html") +
      '#privacy">学术研究与隐私说明</a>' +
      "<span>© 2026 第三只眼</span>" +
      "</div>" +
      "</div>";
    body.appendChild(footer);
  }

  /* ---------- 原型地图（仅原型阶段使用） ---------- */
  function buildPrototypeMap() {
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className =
      "fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-floating transition-transform hover:scale-[1.03] active:scale-[0.98]";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">map</span><span class="hidden sm:inline">原型地图</span>';

    var overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[95] hidden";
    overlay.innerHTML =
      '<div class="absolute inset-0 bg-on-surface/30 backdrop-blur-[2px]" data-close></div>' +
      '<aside role="dialog" aria-modal="true" aria-labelledby="te-map-title" class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-outline-variant/60 bg-surface-container-lowest shadow-floating">' +
      '<div class="flex items-center justify-between border-b border-outline-variant/50 px-6 py-4">' +
      "<div>" +
      '<h2 id="te-map-title" class="font-headline-sm text-headline-sm font-bold text-on-surface">原型地图</h2>' +
      '<p class="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">全部界面均可直达 · 对应 PRD 第 7 章路由</p>' +
      "</div>" +
      '<button type="button" data-close aria-label="关闭原型地图" class="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high">' +
      '<span class="material-symbols-outlined">close</span>' +
      "</button>" +
      "</div>" +
      '<div class="flex-1 overflow-y-auto px-6 py-4" data-list></div>' +
      "</aside>";

    var list = overlay.querySelector("[data-list]");
    PAGE_GROUPS.forEach(function (group) {
      var section = document.createElement("section");
      section.className = "mb-6";
      var items = group.items
        .map(function (item) {
          var href = ROOT + "/" + item.file;
          return (
            '<a class="group flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container-low" href="' +
            href +
            '">' +
            '<span class="flex flex-col">' +
            '<span class="font-label-lg text-label-lg font-semibold text-on-surface">' +
            item.label +
            "</span>" +
            '<span class="font-label-sm text-label-sm text-on-surface-variant">' +
            item.desc +
            "</span>" +
            "</span>" +
            '<span class="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-0.5">arrow_forward</span>' +
            "</a>"
          );
        })
        .join("");
      section.innerHTML =
        '<h3 class="mb-1 px-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">' +
        group.title +
        "</h3>" +
        '<div class="flex flex-col">' +
        items +
        "</div>";
      list.appendChild(section);
    });

    function open() {
      overlay.classList.remove("hidden");
      overlay.querySelector("[data-close]").focus();
    }
    function close() {
      overlay.classList.add("hidden");
      trigger.focus();
    }

    trigger.addEventListener("click", open);
    overlay.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
    });

    body.appendChild(trigger);
    body.appendChild(overlay);
  }

  /* ---------- 主内容锚点（无障碍） ---------- */
  function ensureMainAnchor() {
    var main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";
  }

  /* ---------- data-href：让按钮也能像链接一样跳转 ---------- */
  function bindDataHref() {
    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-href]");
      if (!target) return;
      var href = target.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  }

  function init() {
    bindDataHref();
    ensureMainAnchor();
    if (body.getAttribute("data-layout") !== "bare") {
      buildHeader();
      buildSidebar();
      buildFooter();
    }
    buildPrototypeMap();

    // 跳转链接必须排在 DOM 最前，键盘用户第一次 Tab 就能拿到
    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#main-content";
    skip.textContent = "跳到主要内容";
    body.insertBefore(skip, body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
