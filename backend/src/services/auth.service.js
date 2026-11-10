import { pool } from '../db.js'
import { AppError, ErrorCodes } from '../utils/AppError.js'
import { hashPassword, verifyPassword, burnPasswordCheck } from '../utils/password.js'
import { toPublicUser } from '../utils/serialize.js'
import { signAccessToken } from '../utils/token.js'
import { baseUsernameFromEmail, usernameCandidate } from '../utils/username.js'

const PUBLIC_COLUMNS =
  'id, username, nickname, email, role, timezone, avatar_url, created_at'

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY'

function emailTakenError() {
  return new AppError(
    409,
    ErrorCodes.EMAIL_TAKEN,
    '该邮箱已注册，请直接登录。',
    { email: '该邮箱已注册。' },
  )
}

function usernameTakenError() {
  return new AppError(
    409,
    ErrorCodes.USERNAME_TAKEN,
    '用户名已被占用，请换一个。',
    { username: '用户名已被占用。' },
  )
}

function invalidCredentialsError() {
  // 不区分「邮箱不存在」和「密码错误」，避免账号枚举
  return new AppError(
    401,
    ErrorCodes.INVALID_CREDENTIALS,
    '邮箱或密码错误，请重试。',
  )
}

function isDuplicateOf(error, keyName) {
  return (
    error?.code === DUPLICATE_ENTRY && String(error.message).includes(keyName)
  )
}

/**
 * 注册。PRD F-01-01。
 * 注册成功后不直接发 token——前端文案为「注册成功，请登录」。
 */
export async function register({ nickname, email, password, username }) {
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  )
  if (existing.length > 0) throw emailTakenError()

  const passwordHash = await hashPassword(password)
  const explicitUsername = Boolean(username)
  const base = username || baseUsernameFromEmail(email)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = usernameCandidate(base, attempt)
    try {
      const [result] = await pool.execute(
        `INSERT INTO users
           (username, password_hash, nickname, email, role, timezone)
         VALUES (?, ?, ?, ?, 'student', 'Asia/Shanghai')`,
        [candidate, passwordHash, nickname, email],
      )
      const user = await getUserById(result.insertId)
      return user
    } catch (error) {
      if (isDuplicateOf(error, 'uk_users_email')) throw emailTakenError()
      if (isDuplicateOf(error, 'uk_users_username')) {
        // 用户自己指定的用户名不自动改号；由邮箱派生的才追加序号
        if (explicitUsername) throw usernameTakenError()
        continue
      }
      throw error
    }
  }

  throw usernameTakenError()
}

/**
 * 登录。PRD F-01-02。
 * 邮箱不存在时也执行一次 bcrypt，避免通过响应时间枚举已注册邮箱。
 */
export async function login({ email, password, remember }) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email],
  )

  const row = rows[0]
  if (!row) {
    await burnPasswordCheck(password)
    throw invalidCredentialsError()
  }

  const passwordOk = await verifyPassword(password, row.password_hash)
  if (!passwordOk) throw invalidCredentialsError()

  const user = toPublicUser(row)
  const accessToken = signAccessToken(user, { remember })

  return {
    token: accessToken.token,
    tokenType: accessToken.tokenType,
    expiresIn: accessToken.expiresIn,
    expiresAt: accessToken.expiresAt,
    user,
  }
}

/** 受保护接口用：按主键取当前用户 */
export async function getUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id],
  )
  if (rows.length === 0) {
    throw new AppError(
      401,
      ErrorCodes.UNAUTHORIZED,
      '账号不存在或已被删除，请重新登录。',
    )
  }
  return toPublicUser(rows[0])
}

/** 仅供脚本/测试使用 */
export async function findPublicUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
    [email],
  )
  return rows.length > 0 ? toPublicUser(rows[0]) : null
}
