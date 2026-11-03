/* ==========================================================================
   第三只眼 · P-03 首页学习工作台 —— 交互与状态管理
   --------------------------------------------------------------------------
   本文件对应《智能学习平台 PRD 需求规范》：
     · 5.3  每日学习打卡（打卡状态机、有效学习条件、统计与边界规则）
     · 9.2  统一状态规范（初始/加载/空/编辑/成功/失败/禁用）
     · 11.3 原型数据存储（localStorage 保存演示数据）
     · 16.2 任务二最低可运行交互要求
   所有数据均为本地演示数据，不含真实用户信息，不代表正式产品的持久化方案。
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     1. 常量与演示数据
     ====================================================================== */

  /** localStorage 键名（PRD 11.3：仅保存非敏感演示信息） */
  var STORAGE_KEY = 'thirdeye_p03_demo_v1';

  /** 模拟读取本地数据的加载态时长（对应 PRD 9.2「加载态」） */
  var LOADING_MS = 650;

  /** 三类模拟有效学习任务（PRD 5.3.3） */
  var TASK_KEYS = ['course', 'observe', 'speaking'];

  /** 打卡状态机五个状态（PRD 5.3.4） */
  var S = {
    NOT_LOGGED_IN: 'not-logged-in',
    NOT_QUALIFIED: 'not-qualified',
    QUALIFIED: 'qualified',
    CHECKED: 'checked',
    FAILED: 'failed'
  };

  /** 演示课程数据（PRD 5.4 内容范围建议 + 11.3 本地演示数据） */
  var COURSES = [
    { id: 'c1', name: '课堂观察基础：从看见到看懂', subject: '课堂观察', chapters: 8, status: '学习中', progress: 60 },
    { id: 'c2', name: '高中信息技术课程教学案例', subject: '课堂观察', chapters: 5, status: '已完成', progress: 100 },
    { id: 'c3', name: '弗兰德斯互动分析（FIAS）入门', subject: '课堂观察', chapters: 4, status: '未开始', progress: 0 },
    { id: 'c4', name: '教学设计入门：目标、活动与评价', subject: '教学设计', chapters: 10, status: '未开始', progress: 0 },
    { id: 'c5', name: '教学评价方法与实践', subject: '教学评价', chapters: 6, status: '未开始', progress: 0 },
    { id: 'c6', name: '说课方法：讲清“为什么这样教”', subject: '说课方法', chapters: 7, status: '未开始', progress: 0 }
  ];

  /** 演示最近学习记录 */
  var RECENT_RECORDS = [
    { kind: '课堂观察', title: '高中信息技术课《算法与程序设计》', meta: '事件标注 6 条 · 评课已提交', time: '今天 14:20' },
    { kind: '课程学习', title: '课堂观察基础：从看见到看懂 · 第 3 章', meta: '已观看 12 分钟', time: '昨天 20:05' },
    { kind: 'AI说课', title: '说课练习：算法与程序设计', meta: '演示报告已生成（示例数据）', time: '10月08日' }
  ];

  /** 进行中的课程（用于「继续学习」卡） */
  var CURRENT_COURSE = { name: '课堂观察基础：从看见到看懂', chapter: '第 3 章 · 教学事件的识别与标注', progress: 60 };

  var WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

  /* ======================================================================
     2. 状态模型
     ====================================================================== */

  var state = {
    loading: true,                 // 加载态开关
    loggedIn: true,                // 登录态
    tasks: { course: false, observe: false, speaking: false },
    checkedDates: [],              // 已打卡日期（'YYYY-MM-DD' 字符串数组）
    dayOffset: 0,                  // 演示用：相对真实今天的偏移天数
    saveError: false,              // 最近一次打卡是否保存失败（失败态）

    // 以下为「演示控制台」专用的界面状态开关，不参与持久化
    saveFailMode: false,           // 模拟保存失败
    noCourse: false,               // 演示「无进行中课程」初始态
    noRecent: false,               // 演示「最近学习记录为空」空状态
    onlyObserve: false             // 推荐课程筛选：只看课堂观察类
  };

  /** 缓存 DOM 引用 */
  var dom = {};

  function cacheDom() {
    dom.headerUser = document.getElementById('header-user');
    dom.welcomeName = document.getElementById('welcome-name');
    dom.continueBody = document.getElementById('continue-body');
    dom.taskList = document.getElementById('task-list');
    dom.status = document.getElementById('checkin-status');
    dom.statusIcon = document.getElementById('status-icon');
    dom.statusTitle = document.getElementById('status-title');
    dom.statusDesc = document.getElementById('status-desc');
    dom.actions = document.getElementById('checkin-actions');
    dom.hint = document.getElementById('checkin-hint');
    dom.streak = document.getElementById('streak-count');
    dom.total = document.getElementById('total-count');
    dom.week = document.getElementById('week-calendar');
    dom.weekTitle = document.getElementById('week-title');
    dom.courseGrid = document.getElementById('course-grid');
    dom.recentBody = document.getElementById('recent-body');
    dom.filterBtn = document.getElementById('recommend-filter');
    dom.navToggle = document.getElementById('nav-toggle');
    dom.nav = document.getElementById('main-nav');
    dom.demoPanel = document.getElementById('demo-panel');
    dom.demoToggle = document.getElementById('demo-toggle');
    dom.demoDate = document.getElementById('demo-date');
    dom.toast = document.getElementById('toast');
    dom.live = document.getElementById('live-region');
  }

  /* ======================================================================
     3. 本地存储（PRD 11.3）
     --------------------------------------------------------------------
     localStorage 在隐私模式或禁用站点数据时可能抛异常，
     因此所有读写都包 try/catch 并优雅降级为「仅本次会话有效」。
     ====================================================================== */

  function loadPersisted() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[第三只眼] 无法读取本地演示数据，将使用默认值。', err);
      return;
    }
    if (!raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.warn('[第三只眼] 本地演示数据格式异常，已忽略。', err);
      return;
    }
    if (!data || typeof data !== 'object') return;

    if (typeof data.loggedIn === 'boolean') state.loggedIn = data.loggedIn;
    if (data.tasks && typeof data.tasks === 'object') {
      TASK_KEYS.forEach(function (key) {
        if (typeof data.tasks[key] === 'boolean') state.tasks[key] = data.tasks[key];
      });
    }
    if (Array.isArray(data.checkedDates)) {
      state.checkedDates = data.checkedDates.filter(function (item) {
        return typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item);
      });
    }
    if (typeof data.dayOffset === 'number' && isFinite(data.dayOffset)) {
      state.dayOffset = data.dayOffset;
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        loggedIn: state.loggedIn,
        tasks: state.tasks,
        checkedDates: state.checkedDates,
        dayOffset: state.dayOffset
      }));
      return true;
    } catch (err) {
      console.warn('[第三只眼] 无法保存本地演示数据。', err);
      return false;
    }
  }

  function clearPersisted() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[第三只眼] 无法清除本地演示数据。', err);
    }
  }

  /* ======================================================================
     4. 纯函数层（与 DOM 无关，便于单独验证）
     ====================================================================== */

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /** Date → 'YYYY-MM-DD'（按用户本地时区，PRD 5.3.5） */
  function toDateKey(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  /** 'YYYY-MM-DD' → Date（本地零点，避免 UTC 偏移导致跨天错判） */
  function fromDateKey(key) {
    var parts = key.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function shiftDateKey(key, deltaDays) {
    var d = fromDateKey(key);
    d.setDate(d.getDate() + deltaDays);
    return toDateKey(d);
  }

  /** 当前「今天」（含演示用日期偏移） */
  function getTodayKey() {
    var d = new Date();
    d.setDate(d.getDate() + state.dayOffset);
    return toDateKey(d);
  }

  /**
   * 连续打卡天数（PRD 5.3.5）
   * · 今天已打卡 → 从今天向前连续统计
   * · 今天未打卡但昨天已打卡 → 统计截至昨天
   * · 更早中断 → 从零开始（历史累计天数不清零，另由 total 展示）
   */
  function computeStreak(checkedDates, todayKey) {
    var set = {};
    checkedDates.forEach(function (k) { set[k] = true; });

    var cursor = set[todayKey] ? todayKey : shiftDateKey(todayKey, -1);
    if (!set[cursor]) return 0;

    var days = 0;
    var guard = 0;                          // 防止脏数据造成死循环
    while (set[cursor] && guard < 4000) {
      days += 1;
      cursor = shiftDateKey(cursor, -1);
      guard += 1;
    }
    return days;
  }

  /** 是否获得今日打卡资格：任一项模拟有效学习任务完成即可（PRD 5.3.3） */
  function hasQualification(tasks) {
    return TASK_KEYS.some(function (key) { return tasks[key] === true; });
  }

  /** 派生打卡状态机的当前状态（PRD 5.3.4） */
  function deriveCheckInState() {
    var today = getTodayKey();
    if (!state.loggedIn) return S.NOT_LOGGED_IN;
    if (state.checkedDates.indexOf(today) !== -1) return S.CHECKED;
    if (state.saveError) return S.FAILED;
    if (hasQualification(state.tasks)) return S.QUALIFIED;
    return S.NOT_QUALIFIED;
  }

  /* ======================================================================
     5. 状态呈现配置（文案逐条对齐 PRD 5.3.4 表格）
     ====================================================================== */

  var STATE_VIEW = {};

  STATE_VIEW[S.NOT_LOGGED_IN] = {
    icon: '→',
    title: '登录后开启今日学习',
    desc: '登录后可保存学习任务与打卡记录。',
    chip: '',
    actions: [
      { label: '登录', kind: 'primary', action: 'login' }
    ],
    hint: ''
  };

  STATE_VIEW[S.NOT_QUALIFIED] = {
    icon: '○',
    title: '完成一项学习任务后即可打卡',
    desc: '今天还没有完成任何一项有效学习任务。',
    chip: '',
    actions: [
      { label: '去学习', kind: 'primary', action: 'go-learn' },
      { label: '完成今日打卡', kind: 'secondary', action: 'checkin', disabled: true }
    ],
    hint: '打卡按钮暂不可用：今天尚未完成任何一项有效学习任务（课程学习 / 课堂观察 / 说课训练）。'
  };

  STATE_VIEW[S.QUALIFIED] = {
    icon: '!',
    title: '今天的学习任务已完成',
    desc: '已获得今日打卡资格，可以打卡了。',
    chip: '待打卡',
    actions: [
      { label: '完成今日打卡', kind: 'primary', action: 'checkin' },
      { label: '查看学习日历', kind: 'secondary', action: 'calendar' }
    ],
    hint: ''
  };

  STATE_VIEW[S.CHECKED] = {
    icon: '✓',
    title: '今日已打卡，继续保持！',
    desc: '今天已完成打卡，明天再来。',
    chip: '已完成',
    actions: [
      { label: '今日已打卡', kind: 'primary', action: 'checkin', disabled: true },
      { label: '查看学习日历', kind: 'secondary', action: 'calendar' }
    ],
    hint: '打卡按钮已禁用：同一天不能重复计入打卡天数（PRD 5.3.5 每日最多计入一次）。'
  };

  STATE_VIEW[S.FAILED] = {
    icon: '✕',
    title: '暂时无法保存，请重试',
    desc: '打卡记录未能保存，本次未新增打卡天数。',
    chip: '保存失败',
    actions: [
      { label: '重试', kind: 'primary', action: 'checkin' },
      { label: '查看学习日历', kind: 'secondary', action: 'calendar' }
    ],
    hint: '本次失败没有新增打卡记录，可点击「重试」再次提交。'
  };

  /* ======================================================================
     6. 渲染层
     ====================================================================== */

  /** 记录各可变区域的「渲染签名」，结构未变时不重建 DOM，避免丢失键盘焦点 */
  var sig = { actions: null, courses: null, recent: null, header: null };

  function render() {
    renderHeader();
    renderContinueCard();
    syncTaskInputs();
    renderCheckIn();
    renderCourses();
    renderRecent();
    renderDemoConsole();
  }

  /* ---- 顶部登录态（PRD 7.3） ---- */
  function renderHeader() {
    var key = String(state.loggedIn);
    if (sig.header === key) return;
    sig.header = key;

    if (state.loggedIn) {
      dom.headerUser.className = 'header-user';
      dom.headerUser.innerHTML =
        '<span class="avatar" aria-hidden="true">章</span>' +
        '<span class="header-user-info">' +
          '<span class="header-user-name">章乐</span>' +
          '<span class="header-user-role">师范生 · 演示账号</span>' +
        '</span>';
      dom.welcomeName.textContent = '欢迎回来';
    } else {
      dom.headerUser.className = 'header-user is-guest';
      dom.headerUser.innerHTML =
        '<span class="header-user-info">' +
          '<span class="header-user-name">未登录</span>' +
          '<span class="header-user-role">登录后可记录学习</span>' +
        '</span>';
      dom.welcomeName.textContent = '请先登录';
    }
  }

  /* ---- 继续学习卡：加载态 / 初始态 / 正常态 ---- */
  function renderContinueCard() {
    // 加载态（PRD 9.2）
    if (state.loading) {
      dom.continueBody.innerHTML =
        '<div class="skeleton skeleton-cover"></div>' +
        '<div class="skeleton skeleton-line w-60"></div>' +
        '<div class="skeleton skeleton-line w-40"></div>' +
        '<p class="loading-note"><span class="spinner" aria-hidden="true"></span>正在加载学习数据…</p>';
      return;
    }

    // 初始态：没有进行中的课程（PRD 9.2 初始态）
    if (state.noCourse) {
      dom.continueBody.innerHTML =
        '<div class="state-block">' +
          '<div class="state-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none">' +
              '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
              '<path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5A1.5 1.5 0 0 0 20 17.5v-12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<p class="state-title">还没有正在学习的课程</p>' +
          '<p class="state-desc">从课程列表选择一门课程开始，学习进度会保存在这里。</p>' +
          '<div class="state-actions">' +
            '<button class="btn btn-primary" type="button" data-action="browse-courses">浏览课程列表</button>' +
          '</div>' +
        '</div>';
      return;
    }

    // 正常态
    dom.continueBody.innerHTML =
      '<div class="course-cover">课堂观察 · 专题课程</div>' +
      '<p class="continue-title">' + escapeHtml(CURRENT_COURSE.name) + '</p>' +
      '<p class="continue-meta">' + escapeHtml(CURRENT_COURSE.chapter) + '</p>' +
      '<div class="progress-row">' +
        '<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" ' +
             'aria-valuenow="' + CURRENT_COURSE.progress + '" aria-label="课程学习进度">' +
          '<div class="progress-fill" style="width:' + CURRENT_COURSE.progress + '%"></div>' +
        '</div>' +
        '<span class="progress-text">' + CURRENT_COURSE.progress + '%</span>' +
      '</div>' +
      '<div class="continue-actions">' +
        '<button class="btn btn-primary" type="button" data-action="continue-learn">继续学习</button>' +
        '<button class="btn btn-secondary" type="button" data-action="browse-courses">全部课程</button>' +
      '</div>';
  }

  /* ---- 任务复选框：与状态同步 ---- */
  function syncTaskInputs() {
    var inputs = dom.taskList.querySelectorAll('input[data-task]');
    Array.prototype.forEach.call(inputs, function (input) {
      var key = input.getAttribute('data-task');
      input.checked = state.tasks[key] === true;
      input.disabled = state.loading || !state.loggedIn;
    });
  }

  /* ---- 打卡状态机渲染 ---- */
  function renderCheckIn() {
    var current = deriveCheckInState();
    var view = STATE_VIEW[current];

    // 加载态：状态区先显示读取中
    if (state.loading) {
      dom.status.setAttribute('data-state', 'loading');
      dom.statusIcon.textContent = '';
      dom.statusTitle.textContent = '正在加载打卡记录…';
      dom.statusDesc.textContent = '';
      dom.hint.hidden = true;
      dom.streak.textContent = '—';
      dom.total.textContent = '—';
      dom.week.innerHTML = '';
      renderActions([]);
      return;
    }

    dom.status.setAttribute('data-state', current);
    dom.statusIcon.textContent = view.icon;
    dom.statusTitle.innerHTML = escapeHtml(view.title) +
      (view.chip ? ' <span class="badge">' + escapeHtml(view.chip) + '</span>' : '');
    dom.statusDesc.textContent = view.desc;

    // 禁用原因 / 失败说明（PRD 9.2 禁用态与失败态要求）
    if (view.hint) {
      dom.hint.hidden = false;
      dom.hint.textContent = view.hint;
      dom.hint.setAttribute('data-tone', current === S.FAILED ? 'danger' : '');
    } else {
      dom.hint.hidden = true;
      dom.hint.textContent = '';
      dom.hint.removeAttribute('data-tone');
    }

    renderActions(view.actions);

    var today = getTodayKey();
    if (state.loggedIn) {
      dom.streak.textContent = computeStreak(state.checkedDates, today);
      dom.total.textContent = state.checkedDates.length;   // 累计天数不因中断清零
    } else {
      // 未登录不展示打卡数据，避免显示非本人记录（PRD 11.2 数据一致性）
      dom.streak.textContent = '—';
      dom.total.textContent = '—';
    }
    renderWeekCalendar(!state.loggedIn);
  }

  /** 按钮结构未变化时不重建，避免键盘焦点丢失 */
  function renderActions(actions) {
    var key = JSON.stringify(actions);
    if (sig.actions === key) return;
    sig.actions = key;

    dom.actions.innerHTML = '';
    actions.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ' + (item.kind === 'primary' ? 'btn-primary' : 'btn-secondary');
      btn.textContent = item.label;
      btn.setAttribute('data-action', item.action);
      if (item.disabled) btn.disabled = true;
      dom.actions.appendChild(btn);
    });
  }

  /* ---- 最近七日日历（PRD 8.1 / 10.4） ---- */
  function renderWeekCalendar(locked) {
    var today = getTodayKey();
    var checked = {};
    if (!locked) {
      state.checkedDates.forEach(function (k) { checked[k] = true; });
    }
    dom.weekTitle.textContent = locked ? '最近七日（登录后显示打卡记录）' : '最近七日';

    var html = '';
    for (var i = 6; i >= 0; i--) {
      var key = shiftDateKey(today, -i);
      var date = fromDateKey(key);
      var isToday = i === 0;
      var isDone = checked[key] === true;

      var classes = 'day-cell';
      if (isToday) classes += ' is-today';
      if (isDone) classes += ' is-done';

      // 颜色 + 图标 + 文字三重标识，不只靠颜色区分（PRD 10.4 / 10.6）
      var label = key + ' 周' + WEEKDAY_LABELS[date.getDay()] + '，' +
                  (isDone ? '已打卡' : '未打卡') + (isToday ? '，今天' : '');

      html +=
        '<li class="' + classes + '" title="' + label + '" aria-label="' + label + '">' +
          '<span class="day-weekday" aria-hidden="true">周' + WEEKDAY_LABELS[date.getDay()] + '</span>' +
          '<span class="day-date" aria-hidden="true">' + date.getDate() + '</span>' +
          '<span class="day-mark" aria-hidden="true">' + (isDone ? '✓' : '') + '</span>' +
        '</li>';
    }
    dom.week.innerHTML = html;
  }

  /* ---- 推荐课程（PRD 5.4；含空状态见 9.2） ---- */
  function renderCourses() {
    var list = state.onlyObserve
      ? COURSES.filter(function (c) { return c.subject === '课堂观察'; })
      : COURSES.slice();

    var key = list.map(function (c) { return c.id; }).join(',');
    dom.filterBtn.setAttribute('aria-pressed', String(state.onlyObserve));
    dom.filterBtn.textContent = state.onlyObserve ? '显示全部课程' : '只看课堂观察类';

    if (sig.courses === key) return;
    sig.courses = key;

    if (!list.length) {
      // 空状态：说明原因并给出下一步（PRD 9.1 / 9.2）
      dom.courseGrid.innerHTML =
        '<div class="state-block" style="grid-column:1/-1">' +
          '<p class="state-title">未找到匹配课程</p>' +
          '<p class="state-desc">当前筛选条件下没有课程，可以清空筛选后重新查看。</p>' +
          '<div class="state-actions">' +
            '<button class="btn btn-secondary" type="button" data-action="clear-filter">清空筛选条件</button>' +
          '</div>' +
        '</div>';
      return;
    }

    dom.courseGrid.innerHTML = list.map(function (c) {
      return '' +
        '<article class="course-card">' +
          '<div class="course-cover" aria-hidden="true">' + escapeHtml(c.subject) + '</div>' +
          '<div class="course-card-body">' +
            '<h3 class="course-name">' + escapeHtml(c.name) + '</h3>' +
            '<p class="course-meta">' + c.chapters + ' 个章节</p>' +
            '<div class="course-tags">' +
              '<span class="tag is-status">' + escapeHtml(c.status) + '</span>' +
              '<span class="tag">' + escapeHtml(c.subject) + '</span>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ---- 最近学习记录（含空状态） ---- */
  function renderRecent() {
    var key = state.noRecent ? 'empty' : 'list';
    if (sig.recent === key) return;
    sig.recent = key;

    if (state.noRecent) {
      dom.recentBody.innerHTML =
        '<div class="state-block">' +
          '<div class="state-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none">' +
              '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/>' +
              '<path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
            '</svg>' +
          '</div>' +
          '<p class="state-title">还没有学习记录</p>' +
          '<p class="state-desc">完成一次课程学习、课堂观察或说课训练后，记录会显示在这里。</p>' +
          '<div class="state-actions">' +
            '<button class="btn btn-primary" type="button" data-action="browse-courses">去课程学习</button>' +
          '</div>' +
        '</div>';
      return;
    }

    dom.recentBody.innerHTML =
      '<ul class="recent-list">' +
      RECENT_RECORDS.map(function (r) {
        return '' +
          '<li class="recent-item">' +
            '<span class="recent-kind">' + escapeHtml(r.kind) + '</span>' +
            '<span class="recent-main">' +
              '<span class="recent-title">' + escapeHtml(r.title) + '</span>' +
              '<span class="recent-meta">' + escapeHtml(r.meta) + '</span>' +
            '</span>' +
            '<span class="recent-time">' + escapeHtml(r.time) + '</span>' +
          '</li>';
      }).join('') +
      '</ul>';
  }

  /* ---- 演示控制台 ---- */
  function renderDemoConsole() {
    dom.demoDate.textContent = getTodayKey() + (state.dayOffset ? '（模拟）' : '');
    setChip('toggle-fail', state.saveFailMode, '模拟保存失败');
    setChip('toggle-nocourse', state.noCourse, '无进行中课程');
    setChip('toggle-norecent', state.noRecent, '最近记录为空');
  }

  function setChip(action, on, label) {
    var btn = dom.demoPanel.querySelector('[data-demo="' + action + '"]');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = label + '：' + (on ? '开' : '关');
  }

  /* ======================================================================
     7. 交互动作
     ====================================================================== */

  /** 打卡（PRD 5.3.4 / 5.3.5） */
  function doCheckIn() {
    var today = getTodayKey();

    if (!state.loggedIn) {
      showToast('请先登录后再打卡');
      return;
    }
    // 同日唯一：重复操作不重复增加天数
    if (state.checkedDates.indexOf(today) !== -1) {
      showToast('今日已打卡，同一天不重复计次');
      return;
    }
    // 资格判断
    if (!hasQualification(state.tasks)) {
      showToast('还没有完成有效学习任务，先完成一项再打卡', 'danger');
      announce('打卡未成功：今天尚未完成任何一项有效学习任务');
      return;
    }
    // 失败态演示：不写入记录，只切换状态
    if (state.saveFailMode) {
      state.saveError = true;
      render();
      showToast('暂时无法保存，请重试', 'danger');
      announce('打卡失败：暂时无法保存，请重试。本次未新增打卡记录');
      return;
    }

    state.checkedDates.push(today);
    state.saveError = false;
    persist();
    render();

    var streak = computeStreak(state.checkedDates, today);
    showToast('今日打卡成功', 'success');
    announce('今日打卡成功，连续打卡 ' + streak + ' 天，累计 ' + state.checkedDates.length + ' 天');
  }

  /** 模拟任务完成状态切换（演示用） */
  function setTask(key, checked) {
    if (!state.loggedIn) {
      showToast('未登录状态下无法记录学习任务');
      return;
    }
    state.tasks[key] = checked;
    state.saveError = false;         // 任务变化后退出失败态
    persist();
    render();
  }

  /** 演示控制台动作分发 */
  function runDemoAction(action) {
    switch (action) {
      case 'login-on':
        state.loggedIn = true;
        persist(); render();
        showToast('演示：已切换到登录状态');
        break;
      case 'login-off':
        state.loggedIn = false;
        state.saveError = false;
        persist(); render();
        showToast('演示：已切换到未登录状态');
        break;
      case 'task-none':
        TASK_KEYS.forEach(function (k) { state.tasks[k] = false; });
        state.saveError = false;
        persist(); render();
        showToast('演示：已清除今日学习任务');
        break;
      case 'task-one':
        TASK_KEYS.forEach(function (k, i) { state.tasks[k] = i === 0; });
        state.saveError = false;
        persist(); render();
        showToast('演示：已完成一项学习任务，获得打卡资格');
        break;
      case 'checkin-set':
        if (state.checkedDates.indexOf(getTodayKey()) === -1) {
          state.checkedDates.push(getTodayKey());
        }
        state.saveError = false;
        persist(); render();
        showToast('演示：已标记今日打卡');
        break;
      case 'checkin-clear':
        state.checkedDates = state.checkedDates.filter(function (k) {
          return k !== getTodayKey();
        });
        state.saveError = false;
        persist(); render();
        showToast('演示：已清除今日打卡记录');
        break;
      case 'toggle-fail':
        state.saveFailMode = !state.saveFailMode;
        if (!state.saveFailMode) state.saveError = false;
        render();
        break;
      case 'toggle-nocourse':
        state.noCourse = !state.noCourse;
        render();
        break;
      case 'toggle-norecent':
        state.noRecent = !state.noRecent;
        render();
        break;
      case 'day-prev':
        state.dayOffset -= 1;
        state.saveError = false;
        persist(); render();
        showToast('演示：日期已切换到 ' + getTodayKey());
        break;
      case 'day-reset':
        state.dayOffset = 0;
        state.saveError = false;
        persist(); render();
        showToast('演示：已回到真实今天 ' + getTodayKey());
        break;
      case 'day-next':
        state.dayOffset += 1;
        state.saveError = false;
        persist(); render();
        showToast('演示：日期已切换到 ' + getTodayKey());
        break;
      case 'reset':
        clearPersisted();
        state.loggedIn = true;
        state.tasks = { course: false, observe: false, speaking: false };
        state.checkedDates = [];
        state.dayOffset = 0;
        state.saveError = false;
        state.saveFailMode = false;
        state.noCourse = false;
        state.noRecent = false;
        state.onlyObserve = false;
        sig = { actions: null, courses: null, recent: null, header: null };
        render();
        showToast('演示数据已重置');
        break;
      default:
        break;
    }
    if (action !== 'toggle-fail' && action !== 'toggle-nocourse' && action !== 'toggle-norecent') {
      renderDemoConsole();
    }
  }

  /** 页面内其它动作 */
  function runPageAction(action) {
    switch (action) {
      case 'checkin':
        doCheckIn();
        break;
      case 'login':
        state.loggedIn = true;
        persist(); render();
        showToast('演示：已模拟登录（正式版将跳转登录页 P-01）');
        break;
      case 'go-learn':
        showToast('请先完成一项学习任务：课程学习 / 课堂观察 / 说课训练');
        scrollToSection('#course-grid');
        break;
      case 'calendar':
        showToast('演示原型：「学习日历」位于个人中心（P-14），本页为单一界面演示');
        break;
      case 'continue-learn':
        showToast('演示原型：课程学习页（P-06）将在后续阶段开发');
        break;
      case 'browse-courses':
        showToast('演示原型：课程列表页（P-04）将在后续阶段开发');
        scrollToSection('#course-grid');
        break;
      case 'clear-filter':
        state.onlyObserve = false;
        render();
        break;
      default:
        break;
    }
  }

  function scrollToSection(selector) {
    var el = document.querySelector(selector);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ======================================================================
     8. 轻提示与无障碍播报（PRD 9.1）
     ====================================================================== */

  var toastTimer = null;
  var toastHideTimer = null;

  function showToast(message, tone) {
    var el = dom.toast;
    el.textContent = message;

    if (tone) el.setAttribute('data-tone', tone);
    else el.removeAttribute('data-tone');

    el.hidden = false;
    void el.offsetWidth;                 // 触发重排，保证过渡生效
    el.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    window.clearTimeout(toastHideTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove('is-visible');
      toastHideTimer = window.setTimeout(function () { el.hidden = true; }, 240);
    }, 2600);

    announce(message);
  }

  /** aria-live 播报，供屏幕阅读器获取状态变化 */
  function announce(message) {
    dom.live.textContent = message;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ======================================================================
     9. 事件绑定
     ====================================================================== */

  function bindEvents() {
    // 任务复选框（事件委托，兼容动态渲染）
    dom.taskList.addEventListener('change', function (event) {
      var input = event.target;
      if (!input || input.type !== 'checkbox') return;
      var key = input.getAttribute('data-task');
      if (!key) return;
      setTask(key, input.checked);
    });

    // 打卡卡操作区（按钮由状态机动态渲染，故用委托）
    dom.actions.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      runPageAction(btn.getAttribute('data-action'));
    });

    // 继续学习卡 / 课程网格 / 空状态按钮
    dom.continueBody.addEventListener('click', onDelegatedClick);
    dom.courseGrid.addEventListener('click', onDelegatedClick);
    dom.recentBody.addEventListener('click', onDelegatedClick);

    // 推荐课程筛选
    dom.filterBtn.addEventListener('click', function () {
      state.onlyObserve = !state.onlyObserve;
      render();
      announce(state.onlyObserve ? '已筛选：只看课堂观察类课程' : '已显示全部课程');
    });

    // 顶部导航：未开发页面给出可理解的演示反馈（PRD 9.1）
    document.querySelectorAll('[data-demo-page]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        showToast('演示原型：「' + link.getAttribute('data-demo-page') + '」将在后续阶段开发（PRD 16.1 第三阶段）');
        closeNav();
      });
    });

    // 移动端导航展开/收起
    dom.navToggle.addEventListener('click', function () {
      var open = dom.nav.classList.toggle('is-open');
      dom.navToggle.setAttribute('aria-expanded', String(open));
    });

    // 演示控制台
    dom.demoToggle.addEventListener('click', function () {
      var open = dom.demoPanel.hidden;
      dom.demoPanel.hidden = !open;
      dom.demoToggle.setAttribute('aria-expanded', String(open));
    });

    dom.demoPanel.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-demo]');
      if (!btn) return;
      runDemoAction(btn.getAttribute('data-demo'));
    });

    // Esc 收起演示控制台与移动端菜单
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!dom.demoPanel.hidden) {
        dom.demoPanel.hidden = true;
        dom.demoToggle.setAttribute('aria-expanded', 'false');
        dom.demoToggle.focus();
      }
      closeNav();
    });
  }

  function onDelegatedClick(event) {
    var btn = event.target.closest('[data-action]');
    if (!btn || btn.disabled) return;
    runPageAction(btn.getAttribute('data-action'));
  }

  function closeNav() {
    dom.nav.classList.remove('is-open');
    dom.navToggle.setAttribute('aria-expanded', 'false');
  }

  /* ======================================================================
     10. 初始化
     ====================================================================== */

  function init() {
    cacheDom();
    loadPersisted();
    bindEvents();

    render();                          // 先以加载态渲染

    // 模拟读取本地数据的耗时，用于展示 PRD 9.2「加载态」
    window.setTimeout(function () {
      state.loading = false;
      sig.actions = null;              // 加载结束后允许重建按钮
      render();
    }, LOADING_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
