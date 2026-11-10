import mysql from 'mysql2/promise'
import { config } from './config.js'

/**
 * MySQL 连接池。
 * - utf8mb4：与 db/init.sql 保持一致，支持中文与 emoji
 * - dateStrings：DATETIME 直接返回 'YYYY-MM-DD HH:mm:ss'，避免时区二次转换
 * - 参数化查询由 mysql2 的 execute() 保证，禁止把用户输入拼进 SQL
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
  timezone: '+08:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

/** 执行一次轻量查询，用于健康检查与启动自检 */
export async function pingDatabase() {
  const [rows] = await pool.query('SELECT 1 AS ok')
  return rows[0]?.ok === 1
}

/** 优雅关闭连接池 */
export async function closePool() {
  await pool.end()
}
