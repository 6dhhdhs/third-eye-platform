/**
 * 登录/注册端到端冒烟测试。
 * 需要 API 已启动（npm run dev 或 npm start）且 MySQL 可用。
 *
 *   npm run smoke
 *
 * 会创建一个临时账号，结束后删除。
 */
import assert from 'node:assert/strict'
import { closePool, pool } from '../src/db.js'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const DEMO = { email: 'linsiqi@example.com', password: 'demo1234' }
const tempEmail = `smoke-${Date.now()}@example.com`
let tempUserId = null

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  }
}

function step(label) {
  console.log(`✓ ${label}`)
}

async function main() {
  let result = await call('/api/health')
  assert.equal(result.status, 200)
  step('健康检查')

  result = await call('/api/health/db')
  assert.equal(result.status, 200)
  step('数据库健康检查')

  result = await call('/api/auth/login', {
    method: 'POST',
    body: { ...DEMO, password: 'wrong-password' },
  })
  assert.equal(result.status, 401)
  assert.equal(result.body.error.code, 'INVALID_CREDENTIALS')
  step('错误密码被拒绝，且不泄露账号是否存在')

  result = await call('/api/auth/login', {
    method: 'POST',
    body: { ...DEMO, remember: true },
  })
  assert.equal(result.status, 200)
  const demoToken = result.body.data.token
  assert.ok(demoToken)
  step('演示账号登录成功（记住我 7 天）')

  result = await call('/api/auth/me', { token: demoToken })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.user.email, DEMO.email)
  assert.equal(result.body.data.user.passwordHash, undefined)
  step('携带 token 获取当前用户，且响应不含密码哈希')

  result = await call('/api/auth/logout', { method: 'POST', token: demoToken })
  assert.equal(result.status, 204)
  result = await call('/api/auth/me', { token: demoToken })
  assert.equal(result.status, 401)
  assert.equal(result.body.error.code, 'TOKEN_REVOKED')
  step('退出后旧 token 立即失效')

  result = await call('/api/auth/register', {
    method: 'POST',
    body: {
      nickname: '冒烟测试',
      email: tempEmail,
      password: 'smoke1234',
      confirmPassword: 'smoke1234',
    },
  })
  assert.equal(result.status, 201)
  assert.equal(result.body.data.user.email, tempEmail)
  assert.equal(result.body.data.token, undefined)
  tempUserId = result.body.data.user.id
  step('注册成功，且不直接下发 token（与「注册成功，请登录」一致）')

  result = await call('/api/auth/register', {
    method: 'POST',
    body: {
      nickname: '重复注册',
      email: tempEmail,
      password: 'smoke1234',
      confirmPassword: 'smoke1234',
    },
  })
  assert.equal(result.status, 409)
  assert.equal(result.body.error.code, 'EMAIL_TAKEN')
  step('重复邮箱注册返回 409 EMAIL_TAKEN')

  result = await call('/api/auth/login', {
    method: 'POST',
    body: { email: tempEmail, password: 'smoke1234' },
  })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.token)
  step('新账号可正常登录')

  const [rows] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ?',
    [tempUserId],
  )
  assert.ok(rows[0].password_hash.startsWith('$2'))
  assert.notEqual(rows[0].password_hash, 'smoke1234')
  step('数据库中密码为 bcrypt 哈希，不是明文')

  console.log('\n全部冒烟测试通过。')
}

main()
  .catch((error) => {
    console.error('\n冒烟测试失败：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    if (tempUserId) {
      try {
        await pool.execute('DELETE FROM users WHERE id = ?', [tempUserId])
        console.log(`已清理临时账号 ${tempEmail}`)
      } catch (error) {
        console.warn('清理临时账号失败：', error.message)
      }
    }
    await closePool()
  })
