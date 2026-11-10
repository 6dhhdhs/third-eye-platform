import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { pingDatabase } from './db.js'
import authRouter from './routes/auth.routes.js'
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'
import { ErrorCodes } from './utils/AppError.js'

function corsOrigin(origin, callback) {
  // 同源请求、curl、服务端调用没有 Origin 头，直接放行
  if (!origin) return callback(null, true)
  if (
    config.corsOrigins.includes('*') ||
    config.corsOrigins.includes(origin)
  ) {
    return callback(null, true)
  }
  // 不抛错，只是不下发 CORS 头，由浏览器拦截
  return callback(null, false)
}

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (config.trustProxy) app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
  )
  app.use(express.json({ limit: '32kb' }))
  app.use(requestLogger)

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      data: {
        status: 'ok',
        service: 'third-eye-backend',
        time: new Date().toISOString(),
      },
    })
  })

  app.get('/api/health/db', async (req, res, next) => {
    try {
      await pingDatabase()
      res.json({ ok: true, data: { status: 'ok', database: config.db.database } })
    } catch (error) {
      console.error('[db-health]', error.message)
      res.status(503).json({
        ok: false,
        error: {
          code: ErrorCodes.DATABASE_UNAVAILABLE,
          message: '数据库暂时不可用，请确认 MySQL 已启动。',
        },
      })
    }
  })

  app.use('/api/auth', authRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
