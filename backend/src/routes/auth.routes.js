import { Router } from 'express'
import {
  login,
  logout,
  me,
  register,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import {
  loginLimiter,
  registerLimiter,
} from '../middleware/rate-limit.js'

const router = Router()

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
router.get('/me', requireAuth, me)
router.post('/logout', requireAuth, logout)

export default router
