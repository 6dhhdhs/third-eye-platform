import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { AppError, ErrorCodes } from './AppError.js'
import { isTokenRevoked } from './token-blacklist.js'

/**
 * 签发 access token。
 * @param {{id:number, username:string, role:string}} user
 * @param {{remember?:boolean}} [options] 「记住我」使用更长的有效期
 */
export function signAccessToken(user, { remember = false } = {}) {
  const expiresIn = remember
    ? config.jwt.rememberExpiresIn
    : config.jwt.expiresIn

  const token = jwt.sign(
    { username: user.username, role: user.role },
    config.jwt.secret,
    {
      subject: String(user.id),
      jwtid: randomUUID(),
      expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    },
  )

  const decoded = jwt.decode(token)
  return {
    token,
    tokenType: 'Bearer',
    expiresIn: decoded.exp - decoded.iat,
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    jti: decoded.jti,
    exp: decoded.exp,
  }
}

/**
 * 校验 token，返回 payload。所有失败都转成 401 业务异常。
 */
export function verifyAccessToken(token) {
  let payload
  try {
    payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    })
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new AppError(
        401,
        ErrorCodes.TOKEN_EXPIRED,
        '登录状态已过期，请重新登录。',
      )
    }
    throw new AppError(
      401,
      ErrorCodes.UNAUTHORIZED,
      '登录凭据无效，请重新登录。',
    )
  }

  if (!payload || typeof payload !== 'object') {
    throw new AppError(
      401,
      ErrorCodes.UNAUTHORIZED,
      '登录凭据无效，请重新登录。',
    )
  }

  if (isTokenRevoked(payload.jti)) {
    throw new AppError(
      401,
      ErrorCodes.TOKEN_REVOKED,
      '登录状态已失效，请重新登录。',
    )
  }

  return payload
}
