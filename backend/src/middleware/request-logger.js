/** 极简访问日志：只记方法、路径、状态、耗时，不记录请求体（避免泄露密码） */
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    )
  })
  next()
}
