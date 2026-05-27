import { useState } from 'react'
import { toast } from 'sonner'
import { getRecommendations } from '../lib/api'

export function useRecommend() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)

  const analyze = async (description) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getRecommendations(description)
      setRecommendations(data.recommendations)
      toast.success('Stack recommendations ready')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to reach the API. Make sure the backend is running on port 8000.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRecommendations(null)
    setError(null)
  }

  return { loading, error, recommendations, analyze, reset }
}
