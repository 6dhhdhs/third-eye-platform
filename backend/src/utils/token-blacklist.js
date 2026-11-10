/**
 * JWT 本身无状态，退出登录默认只能靠客户端删除 token。
 * 为了让「退出后旧 token 立即失效」成立，这里维护进程内黑名单：
 * 只保存 jti + 过期时间，条目在 token 过期后自动清理。
 *
 * 注意：多实例部署时进程内黑名单不共享，需要换成 Redis 或数据库表。
 */
const revoked = new Map() // jti -> 过期时间（毫秒）

const sweeper = setInterval(
  () => {
    const now = Date.now()
    for (const [jti, expiresAt] of revoked) {
      if (expiresAt <= now) revoked.delete(jti)
    }
  },
  10 * 60 * 1000,
)
sweeper.unref()

export function revokeToken(jti, expiresAtSeconds) {
  if (!jti || !Number.isFinite(expiresAtSeconds)) return
  revoked.set(jti, expiresAtSeconds * 1000)
}

export function isTokenRevoked(jti) {
  if (!jti) return false
  const expiresAt = revoked.get(jti)
  if (expiresAt === undefined) return false
  if (expiresAt <= Date.now()) {
    revoked.delete(jti)
    return false
  }
  return true
}

/** 仅供测试使用 */
export function clearRevokedTokens() {
  revoked.clear()
}
