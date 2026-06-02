import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../db/connection'

export const exampleRouter = Router()

exampleRouter.get('/users/me', requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub as string

    const user = await prisma.user.findUnique({
      where: { auth0Id },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

exampleRouter.post('/users/me', requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub as string
    const { name, email } = req.body

    const user = await prisma.user.upsert({
      where: { auth0Id },
      update: { name, email },
      create: { auth0Id, name, email },
    })

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
