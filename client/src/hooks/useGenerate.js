import { useState } from 'react'
import { toast } from 'sonner'
import { generateProject } from '../lib/api'

export function useGenerate() {
  const [loading, setLoading] = useState(false)

  const generate = async ({ stack, projectName, description }) => {
    setLoading(true)
    try {
      const response = await generateProject(stack, projectName, description)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName || 'my-app'}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Project downloaded — follow the README to get started.')
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail) {
        toast.error(`Incompatible stack: ${detail}`)
      } else {
        toast.error('Generation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return { loading, generate }
}
