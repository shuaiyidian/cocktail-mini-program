import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cocktailsRouter from './routes/cocktails'
import recipesRouter from './routes/recipes'
import authRouter from './routes/auth'
import billingRouter from './routes/billing'
import eventsRouter from './routes/events'
import { optionalAuth } from './middleware/auth'
import { prisma } from './utils/db'

const app: Application = express()

// 安全头
app.use(helmet())

// CORS - 开发期放开
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
)

// 请求解析
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// 日志
app.use(morgan('dev'))

// 健康检查（轻量级）
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cocktail-server',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  })
})

// 深度健康检查（验证 DB 连接）
app.get('/api/health/deep', async (_req: Request, res: Response) => {
  try {
    await prisma.user.count()
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(503).json({ status: 'fail', db: 'disconnected', error: err.message })
  }
})

// 业务路由
app.use('/api/auth', authRouter)
app.use('/api', billingRouter)  // /plans, /payments/sandbox, /orders, /benefits
app.use('/api', eventsRouter)   // /events, /metrics
app.use('/api/cocktails', optionalAuth(), cocktailsRouter)
app.use('/api/recipes', optionalAuth(), recipesRouter)

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// 错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  if (res.headersSent) return
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 兜底：未捕获异常不能让进程退出
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

export default app
