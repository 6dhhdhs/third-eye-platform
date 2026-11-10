process.env.NODE_ENV = 'test'
process.env.JWT_SECRET =
  'test-secret-0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.BCRYPT_ROUNDS = '4'
process.env.RATE_LIMIT_LOGIN_MAX = '1000'
process.env.RATE_LIMIT_REGISTER_MAX = '1000'

import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'

const { createApp } = await import('../src/app.js')
const { signAccessToken, verifyAccessToken } = await import(
  '../src/utils/token.js'
)
const { revokeToken } = await import('../src/utils/token-blacklist.js')

let server
let baseUrl

before(async () => {
  server = createApp().listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

async function request(path, { method = 'GET', body, rawBody, token } = {}) {
  const headers = {}
  if (body !== undefined || rawBody !== undefined) {
    headers['content-type'] = 'application/json'
  }
  if (token) headers.authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body:
      rawBody !== undefined
        ? rawBody
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  })

  const text = await response.text()
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  }
}

test('GET /api/health 返回服务状态', async () => {
  const { status, body } = await request('/api/health')
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.data.status, 'ok')
})

test('注册：非法邮箱返回 400 与字段错误', async () => {
  const { status, body } = await request('/api/auth/register', {
    method: 'POST',
    body: {
      nickname: '测试',
      email: 'bad-email',
      password: 'demo1234',
      confirmPassword: 'demo1234',
    },
  })
  assert.equal(status, 400)
  assert.equal(body.ok, false)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.ok(body.error.details.email)
})

test('注册：密码太短返回 400', async () => {
  const { status, body } = await request('/api/auth/register', {
    method: 'POST',
    body: {
      nickname: '测试',
      email: 'test@example.com',
      password: '1234567',
      confirmPassword: '1234567',
    },
  })
  assert.equal(status, 400)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.ok(body.error.details.password)
})

test('注册：两次密码不一致返回 400', async () => {
  const { status, body } = await request('/api/auth/register', {
    method: 'POST',
    body: {
      nickname: '测试',
      email: 'test@example.com',
      password: 'demo1234',
      confirmPassword: 'demo12345',
    },
  })
  assert.equal(status, 400)
  assert.ok(body.error.details.confirmPassword)
})

test('登录：缺少密码返回 400', async () => {
  const { status, body } = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'test@example.com' },
  })
  assert.equal(status, 400)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.ok(body.error.details.password)
})

test('登录：非法邮箱返回 400', async () => {
  const { status, body } = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'nope', password: 'demo1234' },
  })
  assert.equal(status, 400)
  assert.ok(body.error.details.email)
})

test('非法 JSON 返回 400 INVALID_JSON', async () => {
  const { status, body } = await request('/api/auth/login', {
    method: 'POST',
    rawBody: '{"email":',
  })
  assert.equal(status, 400)
  assert.equal(body.error.code, 'INVALID_JSON')
})

test('未携带 token 访问 /api/auth/me 返回 401', async () => {
  const { status, body } = await request('/api/auth/me')
  assert.equal(status, 401)
  assert.equal(body.error.code, 'UNAUTHORIZED')
})

test('伪造 token 访问 /api/auth/me 返回 401', async () => {
  const { status, body } = await request('/api/auth/me', {
    token: 'this.is.not-a-jwt',
  })
  assert.equal(status, 401)
  assert.equal(body.error.code, 'UNAUTHORIZED')
})

test('未知接口返回 404', async () => {
  const { status, body } = await request('/api/does-not-exist')
  assert.equal(status, 404)
  assert.equal(body.error.code, 'NOT_FOUND')
})

test('token 可签发、可校验', () => {
  const token = signAccessToken({ id: 7, username: 'demo', role: 'student' })
  const payload = verifyAccessToken(token.token)
  assert.equal(payload.sub, '7')
  assert.equal(payload.username, 'demo')
  assert.equal(payload.role, 'student')
  assert.ok(token.expiresIn > 0)
})

test('token 被撤销后无法通过校验', () => {
  const token = signAccessToken({ id: 8, username: 'demo8', role: 'student' })
  revokeToken(token.jti, token.exp)
  assert.throws(
    () => verifyAccessToken(token.token),
    (error) => error.code === 'TOKEN_REVOKED',
  )
})
