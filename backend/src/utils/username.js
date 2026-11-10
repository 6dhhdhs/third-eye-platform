/**
 * users.username 是 NOT NULL + UNIQUE，但 PRD 的注册表单只收邮箱。
 * 因此注册时由邮箱本地部分派生一个登录名；冲突时追加序号。
 */
export function baseUsernameFromEmail(email) {
  const at = email.lastIndexOf('@')
  const local = at >= 0 ? email.slice(0, at) : email
  const cleaned = local
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9_.-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 40)

  return cleaned || 'user'
}

/** 第 0 次用原名，之后追加 2、3、4… 并保证总长不超过 50 */
export function usernameCandidate(base, attempt) {
  if (attempt === 0) return base.slice(0, 50)
  const suffix = String(attempt + 1)
  return `${base.slice(0, 50 - suffix.length)}${suffix}`
}
