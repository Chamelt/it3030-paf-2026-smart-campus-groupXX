// Feature branch: feature/E-oauth2-redirect-handler
// Handles the callback from the backend after successful Google login.
// Reads ?token= and ?redirect= from the URL, stores the JWT, fetches the
// user profile, then navigates to the role-specific destination page.
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Landing page for the OAuth2 redirect:
 *   http://localhost:5173/oauth2/redirect?token=<jwt>
 *
 * Reads the token from the URL, stores it, loads the user profile,
 * then redirects to the dashboard.
 */
export default function OAuth2RedirectPage() {
  const [searchParams]  = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate        = useNavigate()
  const handled         = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      navigate('/login?error=oauth2_failed', { replace: true })
      return
    }

    const redirect = searchParams.get('redirect') || '/'

    loginWithToken(token)
      .then(() => navigate(redirect, { replace: true }))
      .catch(() => navigate('/login?error=profile_fetch_failed', { replace: true }))
  }, [])

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
