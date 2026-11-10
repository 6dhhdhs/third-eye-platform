# 第三只眼 · 高保真原型

师范生智能学习与教学能力训练平台的前端高保真原型（PRD V1.2 · AI 评教案）。共 13 个页面，覆盖账号、课程学习、课堂观察与评课、AI 评教案、个人中心与异常态。全部页面共用首页的排版骨架：固定左侧导航 + 72px 顶栏 + 内容区。

- **产品定位**：观察他人的课，打磨自己的教案，让教学成长有据可依。
- **原型形态**：纯静态 HTML + CSS + 原生 JavaScript，无前端框架；登录 / 注册已接入 `backend`（Express 5 + MySQL + JWT），其余数据仍为示例数据。
- **设计依据**：[docs/PRD.md](docs/PRD.md)（V1.2 路由、跳转与交互规则）与 [docs/DESIGN.md](docs/DESIGN.md)（颜色、字体、间距令牌）。
- **入口**：打开 [index.html](index.html)（原型总览），或直接进入 [pages/home.html](pages/home.html)。

---

## 快速开始

```bash
npm install          # 安装 Tailwind / Prettier / 本地字体
npm run build:css    # 生成 assets/css/app.css
npm run serve        # http://localhost:4173
```

也可以直接双击 `index.html` 用浏览器打开 —— 项目不依赖网络请求，字体、图标、样式均为本地文件，离线可用。

开发时另开一个终端：

```bash
npm run watch:css    # 改动 class 后自动重建样式
npm run format       # Prettier 统一格式
```

> 改样式只改 `src/styles/input.css` 与 `tailwind.config.js`，不要手改 `assets/css/app.css`（构建产物）。

---

## 目录结构

```text
stitch_/
├─ index.html                 原型总览：页面地图、跳转关系、设计令牌
├─ pages/                     13 个页面
├─ assets/
│  ├─ css/app.css             Tailwind 构建产物
│  ├─ fonts/                  本地字体（Plus Jakarta Sans / Material Symbols）
│  ├─ img/                    本地插图、封面与截图
│  └─ js/
│     ├─ layout.js            统一顶栏、侧栏、页脚、原型地图
│     ├─ motion.js            内页动效：数字计数、进度条生长（首页不加载）
│     ├─ checkin.js           学习打卡状态（首页与个人中心共用）
│     ├─ ui.js                TE.toast / TE.confirm / TE.param
│     └─ pages/               每页一个交互脚本，与页面同名
├─ src/styles/input.css       样式源码入口（@font-face + 工作台设计系统）
├─ docs/                      PRD（V1.2）与设计规范
├─ archive/
│  ├─ originals/              Stitch 备选稿（不参与导航）
│  ├─ scripts/                一次性迁移脚本，保留作改动记录
│  └─ README.md               归档说明
├─ tailwind.config.js         设计令牌
└─ package.json
```

### 分层约定

| 层       | 位置                          | 职责                                                    |
| -------- | ----------------------------- | ------------------------------------------------------- |
| 结构     | `pages/*.html`                | 只写页面内容，不重复写导航与页脚                        |
| 布局     | `assets/js/layout.js`         | 注入统一顶栏 / 侧栏 / 页脚 / 原型地图，处理当前导航高亮 |
| 共享状态 | `assets/js/checkin.js`        | 打卡记录写入 localStorage，按自然日去重                 |
| 通用交互 | `assets/js/ui.js`             | 轻提示、确认弹窗、URL 参数读取                          |
| 页面交互 | `assets/js/pages/*.js`        | 只处理本页逻辑，不跨页复用                              |
| 样式     | `src/styles/input.css` + 配置 | 令牌驱动，构建后输出 `app.css`                          |

---

## 页面清单与路由

| 页面                 | 文件                              | PRD         | 主要出口                     |
| -------------------- | --------------------------------- | ----------- | ---------------------------- |
| 原型总览             | `index.html`                      | —           | 全部页面                     |
| 登录 / 注册          | `pages/login.html`                | P-01 / P-02 | 首页                         |
| 首页学习工作台       | `pages/home.html`                 | P-03        | 课程、观察、评教案、个人中心 |
| 课程列表             | `pages/courses.html`              | P-04        | 课程学习页                   |
| 课程学习页           | `pages/course-learn.html`         | P-05 / P-06 | 观察任务、评教案             |
| 课堂观察任务         | `pages/observe.html`              | P-07        | 观察工作台、能力报告         |
| 课堂观察工作台       | `pages/observe-workbench.html`    | P-08        | 能力报告、返回任务           |
| 观察能力报告         | `pages/observe-report.html`       | P-09        | 再练、补学、个人中心         |
| AI 评教案 · 新建评价 | `pages/lesson-review.html`        | P-10 / P-11 | 分析进度                     |
| 教案分析进度         | `pages/lesson-review-status.html` | P-12        | 评价报告、失败重试           |
| 教案评价报告         | `pages/lesson-review-report.html` | P-13        | 新建评价、个人中心           |
| 个人中心             | `pages/profile.html`              | P-14        | 各模块与最近记录             |
| 404 / 无权限         | `pages/404.html`                  | P-15        | 首页、返回上一页             |

### 导航结构（PRD 7.3）

一级导航固定五项：**首页工作台 · 课程学习 · 课堂观察与评课 · AI 评教案 · 个人中心**。

`layout.js` 依据 `<body data-page>` 自动高亮：`course-learn` 归入「课程学习」，`observe-workbench` / `observe-report` 归入「课堂观察与评课」，`lesson-review-status` / `lesson-review-report` 归入「AI 评教案」。

### 核心闭环

```text
课堂观察：首页 → 观察任务 → 观察工作台 → 三维能力报告 → 再练 / 补学 → 个人中心
AI 评教案：首页 → 新建评价（粘贴或上传 + 隐私确认）→ 分析进度 → 六维报告 → 修改后再提交
```

原型中所有按钮、卡片、面包屑、返回链接均已接通，没有指向 `#` 的死链。评审时可用右下角的「原型地图」浮层直达任意页面（含归档稿）。

---

## 新增页面的步骤

1. 在 `pages/` 新建 HTML，`<head>` 引入 `../assets/css/app.css`；
2. `<body class="workspace">` 写 `data-root=".."` 与 `data-page="<一级导航 key>"`，并保留 `<main id="main-content" class="ws-main">`；
3. 页面内容使用工作台类：`.page-head` / `.panel` / `.grid-main-side` / `.rows` / `.tag` 等，保持与首页同样的排版；
4. 页面底部按顺序引入 `ui.js` → `layout.js` → `pages/<同名>.js`；
5. 把新页面同时登记到 `layout.js` 的 `PAGE_GROUPS`，保证原型地图可直达；
6. `npm run build:css && npm run format`。

`data-root` 是相对项目根目录的层级（`index.html` 为 `.`，`pages/*.html` 为 `..`），导航与页脚链接都基于它拼接，层级写错会导致全站跳转失效。

---

## 交互与状态

- **反馈**：不使用 `alert`，统一调用 `window.TE.toast(title, detail, tone)`。
- **二次确认**：提交观察报告、提交教案、教师复核等操作使用 `window.TE.confirm()`。
- **表单校验**：登录、教案提交均为前端校验，错误信息就地显示并 `role="alert"`。
- **打卡状态**：`te.checkins.v1` 写入 localStorage，按自然日去重；首页与个人中心读同一份数据，跨标签页同步。
- **教案提交**：提交信息存入 `te.lesson-review.submission`，分析进度页与报告页读取后渲染标题与元信息；草稿存 `te.lesson-review.draft`。
- **演示标注**：所有 AI 结果页均标注「示例 / 演示」，不伪造引用、不自动改写用户教案。
- **动效**：内页沿用首页 `ws-enter` 淡入上浮语言，按 `stat-row / grid / rows / steps / 表格行` 错峰登场；数字进入视口时累加、能力条从 0 生长、封面图缓慢推近、登录页装饰圆浮动、日历逐日落位。`animation-fill-mode` 用 `backwards`，动画结束后释放 `transform`，悬停位移不被锁死。首页样式与首页动效未改动。
- **无障碍**：跳转链接、`aria-current`、可见焦点环、`aria-pressed` 标签按钮、44px 触控目标；系统开启「减少动态效果」时关闭全部动画与计数。
- **响应式**：侧栏 212px；≤1200px 收为 76px 图标栏；≤800px 收进移动导航抽屉；卡片在窄屏单列。

---

## 设计令牌

令牌与 `docs/DESIGN.md` 一一对应，集中定义在 `tailwind.config.js`；内页设计系统位于 `src/styles/input.css` 的 `.workspace` 作用域。

- **主色** `primary #426278`，容器色 `primary-container #8fafc8`
- **语义色** `tertiary #2c6954`（达成）、`error #a84646`（待改进）
- **表面** `surface #f6faff`，卡片 `#ffffff`，浅底色 `#eaf1f5 / #eef6f1 / #faf4ea / #f1eef9`
- **字体** Plus Jakarta Sans + 中文回退（PingFang SC / 微软雅黑）
- **字号** 标题 23 / 20 / 18，正文 12–13，说明 10–11
- **圆角** 面板 16–20px，控件 8–10px
- **间距** 面板内边距 18–22px，区块间距 22–28px

---

## 归档

`archive/originals/` 保留 Stitch 原始备选稿，仅用于答辩时说明设计取舍：

| 文件                         | 来源   | 说明                              |
| ---------------------------- | ------ | --------------------------------- |
| `home-alt-1.html`            | `_3`   | 能力仪表盘式首页                  |
| `home-alt-2.html`            | `_5`   | 品牌叙事式首页                    |
| `observe-workbench-alt.html` | `_4`   | 单列证据流观察台                  |
| `speaking-report-alt.html`   | `ai_2` | 雷达图为主的旧版报告（V1.0 说课） |

归档稿不参与导航；原始导出文件保存在项目外层 `_stitch_raw/`。

---

## 已知限制

- 登录 / 注册需要先启动 `backend` 与 MySQL；未启动时页面提示「无法连接后端 API」，不再降级为前端模拟。
- 除账号外，课程、观察、教案、分析、导出仍为前端模拟，分值为示例数据。
- 文档上传只做格式与大小校验，原型不解析 docx / pdf 内容；页面已如实提示。
- 视频区域使用封面图占位，未接入真实播放器。
- 页面为多页静态站点，表单状态依赖 localStorage，清空浏览器数据后回到示例状态。

---

## 更新记录

### 2026-10-26 · 内页动效层

- 新增 `assets/js/motion.js` 与 `src/styles/input.css` 末尾的「内页动效层」：除首页外全部 13 个页面共用一套 `ws-enter` 进场（0.62s，`backwards`），卡片、面板、表格行、步骤条、统计块按次序错峰出现。
- 数字计数（`.stat b` / `.dim-row b`，保留前缀、后缀与小数位）、能力条 `scaleX(0→1)` 生长，均由 IntersectionObserver 在进入视口时触发，滚回上方不会重播。
- 细节动效：课例封面 18s 缓推（Ken Burns）、登录页装饰圆浮动、个人中心日历逐日落位、404 图标弹入；卡片与封面悬停抬升、按钮按压缩放。
- 全部动效限定在 `body:not([data-page="home"])`，首页样式与首页轮播未改动；系统「减少动态效果」下自动关闭动画与计数。

### 2026-10-26 · 对齐 PRD V1.2（AI 评教案）

- 第二核心模块由「AI 说课实训」替换为「AI 评教案」，新增提交（P-10/P-11）、进度（P-12）、报告（P-13）三页；首页功能矩阵、课程列表与个人中心同步改写。
- 六维量表：教材内容与学情 15%、教学目标与重难点 20%、教学过程与活动 30%、学习评价与反馈 25%、资源与差异化 15%、规范与反思 10%；示例总分 86.7。
- 全部内页改为首页排版骨架（固定侧栏 + 72px 顶栏 + `.ws-main`），统一使用 `.panel` / `.grid-main-side` / `.rows` / `.tag` 等工作台类；首页样式本身未改动。
- 观察三维（注意 / 推理 / 表述）与教案六维在页面与文案中明确分开，不合并成单一能力值。
- 首页打卡与个人中心日历共用 `checkin.js`，日历按系统真实日期渲染与高亮。
- 文案统一「示例 / 演示」标注；教案提交、文档上传、报告结论均写明能力边界。

### 2026-10-22 · 首页工作台重构

首页采用固定侧栏 + 72px 顶栏、2:1 非对称分屏、课堂案例 Bento、横向训练路径、非对称功能矩阵及三种反馈视图。1440/1920 宽屏不再限制为 1240px；1200px 以下默认图标侧栏，800px 以下使用移动导航抽屉，540px 以下训练路径变为纵向时间线。

- `assets/js/components/vertical-carousel.js`：4500ms 停留、700ms 向上转场；悬停、键盘焦点与页面隐藏暂停，支持方向键与触屏滑动；系统减少动态效果时关闭自动播放。
- `assets/js/pages/home.js`：示例任务完成同步更新进度、状态及待办数；打卡写入共享状态。
- 首页只启用已有一级路由，未建立独立任务、收藏或日历假入口。
- 配色令牌保持兼容，首页样式限定 `.workspace`；修改样式后运行 `npm run build:css`，不手工修改构建产物。
