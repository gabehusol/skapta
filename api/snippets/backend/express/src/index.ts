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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
