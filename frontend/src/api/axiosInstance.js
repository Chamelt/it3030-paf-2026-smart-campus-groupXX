// Feature branch: feature/E-auth-context-axios
// Configured Axios instance for all API calls to the backend.
// Request interceptor: attaches the JWT from localStorage as a Bearer token.
// Response interceptor: clears the token and redirects to /login on 401 Unauthorized.
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If 401, clear token and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
