import { AppError, ErrorCodes } from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/token.js'

/**
 * 从 Authorization: Bearer <token> 解析登录态。
 * 校验签名、签发方、受众、过期时间与退出黑名单。
 */
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(
      new AppError(401, ErrorCodes.UNAUTHORIZED, '请先登录后再访问。'),
    )
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (error) {
    return next(error)
  }

  const userId = Number(payload.sub)
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return next(
      new AppError(401, ErrorCodes.UNAUTHORIZED, '登录凭据无效，请重新登录。'),
    )
  }

  req.auth = {
    userId,
    username: payload.username,
    role: payload.role,
    jti: payload.jti,
    exp: payload.exp,
  }
  next()
}

/** 角色守卫，供后续课程/教师接口复用 */
export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.auth) {
      return next(
        new AppError(401, ErrorCodes.UNAUTHORIZED, '请先登录后再访问。'),
      )
    }
    if (!roles.includes(req.auth.role)) {
      return next(
        new AppError(403, ErrorCodes.FORBIDDEN, '当前账号没有权限执行该操作。'),
      )
    }
    next()
  }
}
