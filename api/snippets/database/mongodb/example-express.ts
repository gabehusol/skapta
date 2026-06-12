import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { User } from '../db/connection'

export const exampleRouter = Router()

exampleRouter.get('/users/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id as string

    const user = await User.findOne({ auth0Id: userId })

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
    const userId = (req as any).user?.id as string
    const { name, email } = req.body

    const user = await User.findOneAndUpdate(
      { auth0Id: userId },
      { $set: { name, email } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
