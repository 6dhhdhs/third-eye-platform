import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeEmail,
  validateLogin,
  validateRegister,
} from '../src/utils/validation.js'
import {
  baseUsernameFromEmail,
  usernameCandidate,
} from '../src/utils/username.js'

const validRegister = {
  nickname: '林思琪',
  email: 'LinSiqi@Example.com ',
  password: 'demo1234',
  confirmPassword: 'demo1234',
}

test('邮箱会去除首尾空格并转小写', () => {
  assert.equal(normalizeEmail('  A@B.COM '), 'a@b.com')
})

test('合法的注册输入通过校验', () => {
  const result = validateRegister(validRegister)
  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, {})
  assert.equal(result.value.email, 'linsiqi@example.com')
  assert.equal(result.value.username, null)
})

test('注册：昵称必填', () => {
  const result = validateRegister({ ...validRegister, nickname: '   ' })
  assert.equal(result.ok, false)
  assert.match(result.errors.nickname, /请填写昵称/)
})

test('注册：邮箱格式不合法', () => {
  const result = validateRegister({ ...validRegister, email: 'not-an-email' })
  assert.equal(result.ok, false)
  assert.match(result.errors.email, /有效的邮箱/)
})

test('注册：密码至少 8 位', () => {
  const result = validateRegister({
    ...validRegister,
    password: '1234567',
    confirmPassword: '1234567',
  })
  assert.equal(result.ok, false)
  assert.match(result.errors.password, /至少需要 8 位/)
})

test('注册：两次密码不一致', () => {
  const result = validateRegister({
    ...validRegister,
    confirmPassword: 'demo12345',
  })
  assert.equal(result.ok, false)
  assert.match(result.errors.confirmPassword, /不一致/)
})

test('注册：确认密码必填', () => {
  const result = validateRegister({ ...validRegister, confirmPassword: '' })
  assert.equal(result.ok, false)
  assert.match(result.errors.confirmPassword, /再次输入/)
})

test('注册：自定义用户名格式受限', () => {
  const result = validateRegister({ ...validRegister, username: '林思琪' })
  assert.equal(result.ok, false)
  assert.match(result.errors.username, /用户名需为/)
})

test('登录：邮箱与密码必填', () => {
  const result = validateLogin({ email: '', password: '' })
  assert.equal(result.ok, false)
  assert.ok(result.errors.email)
  assert.ok(result.errors.password)
})

test('登录：remember 只接受布尔 true', () => {
  assert.equal(validateLogin({ ...validRegister, remember: true }).value.remember, true)
  assert.equal(validateLogin({ ...validRegister, remember: 'true' }).value.remember, false)
})

test('由邮箱派生用户名', () => {
  assert.equal(baseUsernameFromEmail('lin.siqi+edu@example.com'), 'lin.siqiedu')
  assert.equal(baseUsernameFromEmail('@example.com'), 'user')
  assert.equal(baseUsernameFromEmail('林思琪@example.com'), 'user')
})

test('用户名冲突时追加序号且不超过 50 字符', () => {
  assert.equal(usernameCandidate('linsiqi', 0), 'linsiqi')
  assert.equal(usernameCandidate('linsiqi', 1), 'linsiqi2')
  const longBase = 'a'.repeat(50)
  const candidate = usernameCandidate(longBase, 9)
  assert.equal(candidate.length, 50)
  assert.ok(candidate.endsWith('10'))
})
