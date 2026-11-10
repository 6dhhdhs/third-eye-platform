import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { ErrorCodes } from '../utils/AppError.js'

function limitHandler(req, res) {
  res.status(429).json({
    ok: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: '操作过于频繁，请稍后再试。',
    },
  })
}

const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler,
}

/** 登录：默认 15 分钟 10 次，按 IP 限制；成功的登录不计入 */
export const loginLimiter = rateLimit({
  ...common,
  windowMs: config.rateLimit.loginWindowMs,
  limit: config.rateLimit.loginMax,
  skipSuccessfulRequests: true,
})

/** 注册：默认 1 小时 5 次，按 IP 限制 */
export const registerLimiter = rateLimit({
  ...common,
  windowMs: config.rateLimit.registerWindowMs,
  limit: config.rateLimit.registerMax,
})
