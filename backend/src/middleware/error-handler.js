import { AppError, ErrorCodes } from '../utils/AppError.js'

export function notFoundHandler(req, res, next) {
  next(
    new AppError(
      404,
      ErrorCodes.NOT_FOUND,
      `接口不存在：${req.method} ${req.originalUrl}`,
    ),
  )
}

/**
 * 统一错误出口。响应结构固定为：
 * { ok: false, error: { code, message, details? } }
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let appError = error

  // express.json 解析失败
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    Object.prototype.hasOwnProperty.call(error, 'body')
  ) {
    appError = new AppError(
      400,
      ErrorCodes.INVALID_JSON,
      '请求体不是合法的 JSON。',
    )
  }

  if (!(appError instanceof AppError)) {
    console.error('[unhandled]', error)
    appError = new AppError(
      500,
      ErrorCodes.INTERNAL_ERROR,
      '服务器开小差了，请稍后再试。',
    )
  } else if (appError.status >= 500) {
    console.error('[server-error]', appError)
  }

  const payload = {
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
    },
  }
  if (appError.details) payload.error.details = appError.details

  res.status(appError.status).json(payload)
}
