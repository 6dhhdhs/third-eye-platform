# 第三只眼 · Third Eye

面向师范生的**课堂观察与评课分析平台**。不分析课堂，而分析"看课堂的人"——输入课堂录像 + 师范生的观察打点，输出**观察能力画像**。

> 江南大学 2026 秋 · 智能学习平台课程项目 · 第三组

## 小组成员

| 学号 | 姓名 | 分工 |
| --- | --- | --- |
| 1150424123 | 章乐 | 项目经理（主题 / 架构 / UI） |
| 1150424101 | 姚思雨 | — |
| 1150424108 | 孙慧敏 | — |
| 1101230202 | 刘瑞霖 | — |

## 理论模型

以教师教育中的 **Professional Vision（专业视域）** 为理论依据，拆成三个可计算维度：

- **Noticing** 注意 —— 看到了什么
- **Reasoning** 推理 —— 怎么解释
- **Articulating** 表述 —— 怎么表达

技术亮点：多观察者一致性分析（Cohen's Kappa），依赖 xAPI + LRS 的多人行为数据。

## 目录结构

```
.
├── 10.26/                    # 最新一版交付材料
│   ├── 第三只眼-高保真原型/  # 当前前端原型（Tailwind 静态站点）
│   ├── 新版prd文档.md
│   └── _提交截图/
├── 任务二前端/               # 任务二原生 HTML/CSS/JS 实现
├── 产品演示页/
├── 智能学习平台 PRD 需求规范.md
└── docker-compose.yml        # 本地 MySQL 环境
```

## 本地运行

### 1. 前端原型

```bash
cd "10.26/第三只眼-高保真原型/第三只眼-高保真原型"
npm install          # 首次
npm run serve        # 打开 http://localhost:4173
```

改了样式源文件后：`npm run build:css`

### 2. 数据库

需要 Docker Desktop 已启动。

```bash
cp .env.example .env    # 首次：复制后填入自己的密码
docker compose up -d
```

| 项 | 值 |
| --- | --- |
| 地址 | `127.0.0.1:3306` |
| 库名 | `third_eye`（见 `.env`） |
| 用户 / 密码 | 见 `.env` |

进入容器验证：

```bash
docker exec -it third-eye-mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SHOW DATABASES;"
```

> `.env` 已在 `.gitignore` 中，密码不会进仓库。

数据落在 `./mysql-data/`，该目录不进仓库。

## 协作约定

- 主干 `main`，各自开分支开发，提 Pull Request 合并
- 提交信息用中文，一句话说清"改了什么"
- `node_modules/`、`*.zip`、`mysql-data/` 不进仓库
