import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

export const getRecommendations = (description) =>
  api.post('/api/recommend', { description })

export const generateProject = (stack, projectName, description) =>
  api.post(
    '/api/generate',
    { stack, project_name: projectName, description },
    { responseType: 'blob' },
  )

export default api
