import axios from 'axios'

// VITE_API_URL is the base server URL, e.g. "https://krishirakshak-ai-8.onrender.com"
// All FastAPI routes are under /api prefix
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,  // 60s — AI Vision APIs can take 15-25 seconds
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Disease Detection — multipart/form-data
export const detectDisease = async (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await axios.post(`${BASE_URL}/api/detect`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return response.data
}

// Weather — always pass real lat/lon from browser geolocation
export const getWeather = async (lat, lon) => api.get(`/weather?lat=${lat}&lon=${lon}`)

// Chat
export const getChatResponse = async (message, language = 'en') =>
  api.post('/chat', { message, language })

// Dashboard
export const getDashboardData = async () => api.get('/dashboard')

// History
export const getHistory = async () => api.get('/history')
export const saveScan   = async data => api.post('/history', data)

export default api
