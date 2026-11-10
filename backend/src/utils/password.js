import bcrypt from 'bcryptjs'
import { config } from '../config.js'

/**
 * 一个固定的合法 bcrypt 哈希，仅用于「邮箱不存在」时消耗一次等量计算，
 * 避免攻击者通过响应时间判断邮箱是否注册。它不是任何真实账号的密码。
 */
const DUMMY_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

export function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptRounds)
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export async function burnPasswordCheck(password) {
  await bcrypt.compare(password, DUMMY_HASH)
  return false
}
