import { createApp } from './app.js'
import { config } from './config.js'
import { closePool, pingDatabase } from './db.js'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`[third-eye] API 已启动：http://127.0.0.1:${config.port}`)
  console.log(`[third-eye] 健康检查：http://127.0.0.1:${config.port}/api/health`)
})

// 启动时自检数据库；失败不退出进程，便于先起服务再排查 MySQL
pingDatabase()
  .then(() => {
    console.log(`[third-eye] 数据库已连接：${config.db.database}`)
  })
  .catch((error) => {
    console.warn(`[third-eye] 数据库连接失败：${error.message}`)
    console.warn(
      '[third-eye] 请确认 MySQL 已启动，并检查 backend/.env 中的 DB_* 配置。',
    )
  })

let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n[third-eye] 收到 ${signal}，正在关闭…`)

  server.close(async (error) => {
    if (error) {
      console.error('[third-eye] 关闭 HTTP 服务失败：', error)
    }
    try {
      await closePool()
    } catch (poolError) {
      console.error('[third-eye] 关闭数据库连接池失败：', poolError)
    }
    process.exit(error ? 1 : 0)
  })

  // 兜底：10 秒内没关完就强制退出
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
