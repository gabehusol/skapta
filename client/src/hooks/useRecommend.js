import { useState } from 'react'
import { toast } from 'sonner'
import { getRecommendations } from '../lib/api'

export function useRecommend() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [lastDescription, setLastDescription] = useState(null)

  const analyze = async (description) => {
    setLoading(true)
    setError(null)
    setRecommendations(null)
    setLastDescription(description)
    try {
      const { data } = await getRecommendations(description)
      setRecommendations(data.recommendations)
      toast.success('Stack recommendations ready')
    } catch (err) {
      setError(true)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const retry = () => {
    if (lastDescription) analyze(lastDescription)
  }

  const reset = () => {
    setRecommendations(null)
    setError(null)
  }

  return { loading, error, recommendations, analyze, retry, reset }
}
