import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(currentDir, '..')

// 只读取 backend/.env，不覆盖进程中已存在的变量（测试时可直接注入）
dotenv.config({ path: path.join(rootDir, '.env') })

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `缺少环境变量 ${name}。请复制 backend/.env.example 为 backend/.env 并填写后重试。`,
    )
  }
  return value
}

function readInt(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number.parseInt(raw, 10)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`环境变量 ${name} 必须是非负整数，当前值：${raw}`)
  }
  return value
}

function readBool(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function readList(name, fallback) {
  const raw = process.env[name]
  if (!raw?.trim()) return fallback
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const jwtSecret = required('JWT_SECRET')
if (jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET 至少需要 32 个字符。可用 node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))" 生成。',
  )
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: readInt('PORT', 3000),
  trustProxy: readBool('TRUST_PROXY', false),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: readInt('DB_PORT', 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'third_eye',
    connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
  },

  jwt: {
    secret: jwtSecret,
    issuer: process.env.JWT_ISSUER || 'third-eye-api',
    audience: process.env.JWT_AUDIENCE || 'third-eye-web',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '7d',
  },

  bcryptRounds: readInt('BCRYPT_ROUNDS', 10),

  corsOrigins: readList('CORS_ORIGINS', [
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]),

  rateLimit: {
    loginWindowMs: readInt('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
    loginMax: readInt('RATE_LIMIT_LOGIN_MAX', 10),
    registerWindowMs: readInt('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
    registerMax: readInt('RATE_LIMIT_REGISTER_MAX', 5),
  },
}
