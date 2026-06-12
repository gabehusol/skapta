import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getSupabase } from '../db/connection'

export const exampleRouter = Router()

exampleRouter.get('/users/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id as string
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

exampleRouter.post('/users/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id as string
    const { name, email } = req.body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabase() as any)
      .from('profiles')
      .upsert({ id: userId, name, email }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
