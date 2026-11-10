/**
 * 创建与前端登录页预填一致的演示账号：
 *   邮箱：linsiqi@example.com
 *   密码：demo1234
 *
 * 可重复执行；账号已存在时跳过。
 */
import { closePool, pingDatabase } from '../src/db.js'
import {
  findPublicUserByEmail,
  register,
} from '../src/services/auth.service.js'

const DEMO = {
  nickname: '林思琪',
  email: 'linsiqi@example.com',
  password: 'demo1234',
}

async function main() {
  try {
    await pingDatabase()
  } catch (error) {
    console.error('数据库连接失败：', error.message)
    console.error('请先启动 MySQL（docker compose up -d），并检查 backend/.env。')
    process.exitCode = 1
    return
  }

  const existing = await findPublicUserByEmail(DEMO.email)
  if (existing) {
    console.log(`演示账号已存在，跳过：${DEMO.email}（id=${existing.id}）`)
    return
  }

  const user = await register(DEMO)
  console.log('演示账号创建成功：')
  console.log(`  邮箱：${DEMO.email}`)
  console.log(`  密码：${DEMO.password}`)
  console.log(`  昵称：${user.nickname}（id=${user.id}）`)
}

main()
  .catch((error) => {
    console.error('创建演示账号失败：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
