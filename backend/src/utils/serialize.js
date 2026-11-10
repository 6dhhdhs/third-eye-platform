/**
 * 统一把数据库行转成前端使用的 camelCase 结构。
 * 任何情况下都不返回 password_hash。
 */
export function toPublicUser(row) {
  return {
    id: Number(row.id),
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    role: row.role,
    timezone: row.timezone,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
  }
}
