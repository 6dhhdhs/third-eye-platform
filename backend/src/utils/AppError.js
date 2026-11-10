/**
 * 业务异常：带 HTTP 状态码、稳定的错误码，以及可选的字段级错误。
 * 前端可依赖 error.code 做分支，不依赖中文提示文本。
 */
export class AppError extends Error {
  /**
   * @param {number} status HTTP 状态码
   * @param {string} code 稳定错误码，如 EMAIL_TAKEN
   * @param {string} message 面向用户的提示
   * @param {Record<string, string>} [details] 字段级错误
   */
  constructor(status, code, message, details) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    if (details) this.details = details
  }
}

export const ErrorCodes = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
})
