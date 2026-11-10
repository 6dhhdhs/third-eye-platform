# 第三只眼 · 后端（登录 / 注册）

Express 5 + MySQL 8.4 + JWT 的 REST API。当前实现 PRD `F-01 用户注册与登录`，后续课程、观察、教案接口可按同样的分层继续加。

## 技术选型

| 层 | 选择 | 理由 |
| --- | --- | --- |
| Web 框架 | Express 5 | 生态最大、中文资料多，四人小组容易接手；async 路由自动转发异常 |
| 数据库 | mysql2 + 手写 SQL | 与 `db/init.sql` 一一对应，答辩时 SQL 可直接讲；连接池 + 参数化查询防注入 |
| 登录态 | JWT（Bearer） | 无状态、前端好接、以后拆前后端或做移动端不用改协议 |
| 密码 | bcryptjs | 纯 JS，Windows 无需编译；数据库只存哈希 |
| 校验 | 手写 validator | 规则集中在 `src/utils/validation.js`，不引入额外学习成本 |

## 目录结构

```
backend/
├── src/
│   ├── app.js                  # 组装 Express（CORS、Helmet、JSON、路由、错误处理）
│   ├── server.js               # 启动、数据库自检、优雅关闭
│   ├── config.js               # 读取 .env 并做启动校验
│   ├── db.js                   # mysql2 连接池
│   ├── routes/auth.routes.js   # /api/auth/*
│   ├── controllers/            # 解析请求、调用 service、组装响应
│   ├── services/auth.service.js# 注册 / 登录 / 当前用户
│   ├── middleware/             # 鉴权、限流、错误处理、访问日志
│   └── utils/                  # AppError、校验、密码、JWT、序列化
├── scripts/
│   ├── seed-demo-user.js       # 创建演示账号
│   └── smoke-auth.js           # 端到端冒烟测试
├── test/                       # node:test 单元 + API 测试（不依赖数据库）
├── .env.example
└── package.json
```

## 快速开始

### 1. 启动 MySQL

在项目根目录（`third_eye/`）：

```powershell
docker compose up -d
```

首次启动会自动执行 `db/init.sql` 建好 14 张表。已有 `mysql-data/` 数据卷时不会重复执行。

### 2. 配置环境变量

```powershell
cd backend
Copy-Item .env.example .env
```

编辑 `.env`，至少确认 `DB_PASSWORD` 与根目录 `.env` 的 `MYSQL_ROOT_PASSWORD` 一致，并把 `JWT_SECRET` 换成随机值：

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. 安装依赖并启动

```powershell
npm install
npm run seed   # 创建演示账号 linsiqi@example.com / demo1234
npm run dev    # http://127.0.0.1:3000
```

验证：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://127.0.0.1:3000/api/health/db
```

## API

统一响应结构：

```json
// 成功
{ "ok": true, "data": { } }

// 失败
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "请检查填写的内容。", "details": { "email": "请输入有效的邮箱地址。" } } }
```

### POST /api/auth/register

注册。请求体：

```json
{
  "nickname": "林思琪",
  "email": "linsiqi@example.com",
  "password": "demo1234",
  "confirmPassword": "demo1234",
  "username": "linsiqi"
}
```

- `username` 可选；不填时由邮箱本地部分自动生成（如 `lin.siqi@example.com` → `lin.siqi`），冲突时自动追加序号。
- 邮箱会去空格并转小写。
- 密码至少 8 位；后端同时校验两次密码一致。
- **注册成功返回 201，不下发 token**，与前端文案「注册成功，请登录」一致。

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "username": "linsiqi",
      "nickname": "林思琪",
      "email": "linsiqi@example.com",
      "role": "student",
      "timezone": "Asia/Shanghai",
      "avatarUrl": null,
      "createdAt": "2026-11-10 15:00:00"
    },
    "message": "注册成功，请登录。"
  }
}
```

### POST /api/auth/login

```json
{ "email": "linsiqi@example.com", "password": "demo1234", "remember": true }
```

`remember` 为 `true` 时 token 有效期 7 天，否则 2 小时（可在 `.env` 调整）。

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 604800,
    "expiresAt": "2026-11-17T07:00:00.000Z",
    "user": { "id": 1, "nickname": "林思琪", "role": "student" }
  }
}
```

邮箱不存在与密码错误统一返回 `401 INVALID_CREDENTIALS`，不泄露账号是否注册。

### GET /api/auth/me

请求头：`Authorization: Bearer <token>`

```json
{ "ok": true, "data": { "user": { "id": 1, "nickname": "林思琪" } } }
```

### POST /api/auth/logout

请求头：`Authorization: Bearer <token>`，返回 `204 No Content`。

退出会把当前 token 的 `jti` 加入进程内黑名单，旧 token 立即失效（`401 TOKEN_REVOKED`）。

> 黑名单存在进程内存中，单实例部署有效；多实例部署需换成 Redis 或数据库表。

## 错误码

| HTTP | code | 含义 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 字段不合法，`details` 给出字段级提示 |
| 400 | `INVALID_JSON` | 请求体不是合法 JSON |
| 401 | `INVALID_CREDENTIALS` | 邮箱或密码错误 |
| 401 | `UNAUTHORIZED` | 未登录 / token 无效 |
| 401 | `TOKEN_EXPIRED` | token 已过期 |
| 401 | `TOKEN_REVOKED` | 已退出登录，token 被撤销 |
| 403 | `FORBIDDEN` | 角色权限不足 |
| 404 | `NOT_FOUND` | 接口不存在 |
| 409 | `EMAIL_TAKEN` | 邮箱已注册 |
| 409 | `USERNAME_TAKEN` | 自定义用户名被占用 |
| 429 | `RATE_LIMITED` | 请求过于频繁 |
| 503 | `DATABASE_UNAVAILABLE` | 数据库不可用 |
| 500 | `INTERNAL_ERROR` | 未预期异常 |

## 安全措施

- 密码只存 bcrypt 哈希，任何响应都不返回 `password_hash`。
- 全部 SQL 使用 `?` 参数化，用户输入不拼进 SQL。
- 登录失败统一提示；邮箱不存在时也执行一次 bcrypt，降低时序枚举风险。
- 登录默认 15 分钟 10 次、注册 1 小时 5 次按 IP 限流（`.env` 可调）。
- Helmet 安全响应头、CORS 白名单、32 KB 请求体上限。
- JWT 校验 issuer / audience / 过期时间；退出后旧 token 进黑名单。
- 访问日志只记录方法、路径、状态、耗时，不记录请求体。

## 与 PRD F-01 的对应

| PRD | 实现 |
| --- | --- |
| F-01-01 注册（昵称/邮箱/密码/确认密码，邮箱合法、两次一致、≥8 位） | `POST /api/auth/register` + `validateRegister` |
| F-01-02 登录（邮箱 + 密码，服务端验证） | `POST /api/auth/login` + bcrypt 比对 |
| F-01-03 登录状态（受限页面检查） | `GET /api/auth/me` + `requireAuth` |
| F-01-04 退出（清除会话） | `POST /api/auth/logout` + jti 黑名单 |
| F-01-05 密码显示/隐藏 | 前端交互，后端无关 |
| 异常规则（邮箱已注册、密码错误、会话过期） | `EMAIL_TAKEN`、`INVALID_CREDENTIALS`、`TOKEN_EXPIRED` |

## 前端接入（已完成）

原型已接入本 API，不再需要手工替换提交逻辑：

| 文件 | 作用 |
| --- | --- |
| `prototype/assets/js/auth.js` | 请求封装、token/用户信息存取、登录态守卫、把昵称写回页面 |
| `prototype/assets/js/pages/login.js` | 登录 / 注册表单，调用 `TE_AUTH.login` / `TE_AUTH.register` |
| `prototype/assets/js/layout.js` | 顶栏头像、昵称、角色使用 `data-user-*` 占位 |
| 15 个页面 | 在 `layout.js` 之后引入 `auth.js` |

要点：

- `API_BASE` 默认 `http(s)://<当前主机>:3000`，可用 `window.TE_API_BASE` 覆盖。
- 「记住我」→ `localStorage`，否则 `sessionStorage`，键名 `te.auth.token` / `te.auth.user`。
- 受保护页面在 `data-page` 非 `index/login/404` 且无 token 时，跳转 `login.html?next=<当前页>`。
- `layout.js` 在 `DOMContentLoaded` 时才注入顶栏，因此 `auth.js` 需在其后再写一次昵称，否则顶栏会停留在「同学」。
- 注册成功不签发 token，页面切回「登录」并回填邮箱，与 PRD「注册成功，请登录」一致。

> token 存 `localStorage` 有 XSS 风险；课程项目可接受，生产环境建议改 HttpOnly Cookie + CSRF 防护。

## 数据库落库说明

账号写入 `third_eye.users`，`password_hash` 为 bcrypt（cost=10），接口与日志都不返回该列。注册账号长期保存，不随进程重启或 token 过期消失；只有执行 `docker compose down -v` 删除 `./mysql-data` 才会清空。JWT 本身会过期（默认 2h，「记住我」7d），过期后重新登录即可。

## 测试

```powershell
npm test      # 24 项：校验规则、错误响应、JWT 签发/撤销，不依赖数据库
npm run smoke # 端到端：需先启动 API 与 MySQL，会创建并清理临时账号
```

`npm run smoke` 覆盖：健康检查、错误密码、演示账号登录、`/me`、退出后 token 失效、注册、重复邮箱、密码哈希落库。

## 后续接口建议

按现有分层继续加：

- `GET /api/courses`、`GET /api/courses/:id/lessons`
- `POST /api/learning-events`（写 `learning_events` + `xapi_statements`）
- `POST /api/checkins`（按用户时区计算自然日，依赖 `UNIQUE(user_id, local_date)`）
- 课堂观察标注 / 评课稿 / 教案提交
- `requireRole('teacher','admin')` 已就绪，可直接用于指导教师接口
