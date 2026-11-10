import * as authService from '../services/auth.service.js'
import {
  assertValid,
  validateLogin,
  validateRegister,
} from '../utils/validation.js'
import { revokeToken } from '../utils/token-blacklist.js'

/** POST /api/auth/register */
export async function register(req, res) {
  const input = assertValid(validateRegister(req.body))
  const user = await authService.register(input)

  res.status(201).json({
    ok: true,
    data: {
      user,
      message: '注册成功，请登录。',
    },
  })
}

/** POST /api/auth/login */
export async function login(req, res) {
  const input = assertValid(validateLogin(req.body))
  const result = await authService.login(input)

  res.json({ ok: true, data: result })
}

/** GET /api/auth/me */
export async function me(req, res) {
  const user = await authService.getUserById(req.auth.userId)
  res.json({ ok: true, data: { user } })
}

/** POST /api/auth/logout */
export async function logout(req, res) {
  // 把当前 token 的 jti 加入黑名单，使旧 token 立即失效
  revokeToken(req.auth.jti, req.auth.exp)
  res.status(204).end()
}
