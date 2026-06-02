import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { exampleRouter } from './routes/example'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.use('/api', exampleRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// JSON error handler — must be last
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({ error: err.message ?? 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
