import express, { Application, NextFunction, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.routes.js'
import groupRoutes from './routes/group.routes.js'
import testRoutes from './routes/test.routes.js'

import { AuthError } from './services/auth.service.js'
import { GroupError } from './services/group.service.js'
import { TestError } from './services/test.service.js'

const app: Application = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.get('/demo', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/groups/:groupId/tests', testRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  if (err instanceof GroupError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  if (err instanceof TestError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

export default app