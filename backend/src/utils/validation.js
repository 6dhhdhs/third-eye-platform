import { AppError, ErrorCodes } from './AppError.js'

// 不追求 RFC 5322 全覆盖，覆盖常见邮箱格式即可；真正的可达性靠发信验证
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,50}$/

const NICKNAME_MAX = 50
const EMAIL_MAX = 120
const PASSWORD_MIN = 8
const PASSWORD_MAX_BYTES = 72 // bcrypt 只处理前 72 字节

export function asPlainObject(body) {
  if (body && typeof body === 'object' && !Array.isArray(body)) return body
  return {}
}

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * 校验注册入参。PRD F-01-01：昵称、邮箱、密码、确认密码。
 * username 为可选扩展字段；不填时由邮箱自动生成。
 */
export function validateRegister(body) {
  const input = asPlainObject(body)
  const errors = {}

  const nickname =
    typeof input.nickname === 'string' ? input.nickname.trim() : ''
  const email = normalizeEmail(input.email)
  const password = typeof input.password === 'string' ? input.password : ''
  const confirmRaw = input.confirmPassword ?? input.confirm
  const confirmPassword = typeof confirmRaw === 'string' ? confirmRaw : ''
  const username =
    typeof input.username === 'string' ? input.username.trim().toLowerCase() : ''

  if (!nickname) {
    errors.nickname = '请填写昵称。'
  } else if ([...nickname].length > NICKNAME_MAX) {
    errors.nickname = `昵称不能超过 ${NICKNAME_MAX} 个字符。`
  } else if (CONTROL_CHARS.test(nickname)) {
    errors.nickname = '昵称包含不可见控制字符。'
  }

  if (!email) {
    errors.email = '请填写邮箱。'
  } else if (email.length > EMAIL_MAX) {
    errors.email = `邮箱不能超过 ${EMAIL_MAX} 个字符。`
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = '请输入有效的邮箱地址。'
  }

  if (!password) {
    errors.password = '请填写密码。'
  } else if ([...password].length < PASSWORD_MIN) {
    errors.password = `密码至少需要 ${PASSWORD_MIN} 位字符。`
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    errors.password = '密码过长，请控制在 72 字节以内。'
  }

  if (!confirmPassword) {
    errors.confirmPassword = '请再次输入密码。'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = '两次输入的密码不一致。'
  }

  if (username && !USERNAME_PATTERN.test(username)) {
    errors.username =
      '用户名需为 3–50 位小写字母、数字、下划线、点或短横线。'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { nickname, email, password, username: username || null },
  }
}

/** 校验登录入参。PRD F-01-02：邮箱 + 密码。 */
export function validateLogin(body) {
  const input = asPlainObject(body)
  const errors = {}

  const email = normalizeEmail(input.email)
  const password = typeof input.password === 'string' ? input.password : ''

  if (!email) {
    errors.email = '请填写邮箱。'
  } else if (email.length > EMAIL_MAX) {
    errors.email = `邮箱不能超过 ${EMAIL_MAX} 个字符。`
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = '请输入有效的邮箱地址。'
  }

  if (!password) {
    errors.password = '请填写密码。'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { email, password, remember: input.remember === true },
  }
}

/** 校验失败时统一抛出 400，附带字段级错误 */
export function assertValid(result) {
  if (!result.ok) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      '请检查填写的内容。',
      result.errors,
    )
  }
  return result.value
}
