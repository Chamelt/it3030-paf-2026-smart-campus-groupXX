// Feature branch: feature/E-login-page
// Combined Sign In / Sign Up page — redesigned with blue palette, image carousel, smooth animations.
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'
import './LoginPage.css'

const SLIDES = [
  {
    bg: '/campus_hero.png',
    title: 'Welcome to Horizonia University',
    desc:  'Your smart campus management hub — all in one place.',
  },
  {
    bg: '/campus_bookings.png',
    title: 'Book Rooms & Equipment',
    desc:  'Reserve lecture halls, labs, and gear in seconds.',
  },
  {
    bg: '/campus_resources.png',
    title: 'Explore Campus Resources',
    desc:  'Browse the full catalogue of spaces and assets.',
  },
  {
    bg: '/campus_maintenance.png',
    title: 'Report & Track Issues',
    desc:  'Submit maintenance tickets and follow their progress live.',
  },
]

export default function LoginPage() {
  const { user, loading, loginWithToken } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]           = useState('signin')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  // Carousel state
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next])

  // Already logged in → go to dashboard
  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8081/api/auth/google'
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password })
      await loginWithToken(res.data.token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      const res = await axiosInstance.post('/api/auth/register', { name, email, password })
      await loginWithToken(res.data.token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">

      {/* ── LEFT: Image Carousel ── */}
      <div className="login-left">
        <div className="lp-carousel">
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className={`lp-slide${i === current ? ' active' : ''}`}
              style={{ backgroundImage: `url(${s.bg})` }}
            />
          ))}
          <div className="lp-carousel-text">
            <h2>{SLIDES[current].title}</h2>
            <p>{SLIDES[current].desc}</p>
          </div>
          <div className="lp-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`lp-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Form ── */}
      <div className="login-right">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-circle">H</div>
          <div className="login-brand-name">
            <strong>Smart Campus</strong>
            <span>Horizonia University</span>
          </div>
        </div>

        <div className="login-card">
          <h1>{tab === 'signin' ? 'Welcome back' : 'Create account'}</h1>
          <p className="login-subtitle">
            {tab === 'signin'
              ? 'Sign in to access the campus hub.'
              : "Join Horizonia University's operations hub."}
          </p>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError('') }}
            >
              Sign Up
            </button>
            <button
              className={`tab-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => { setTab('signin'); setError('') }}
            >
              Sign In
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* ── Sign Up Form ── */}
          {tab === 'signup' && (
            <form className="auth-form" onSubmit={handleSignUp}>
              <input type="text"     placeholder="Full Name"        value={name}     onChange={e => setName(e.target.value)}     required autoComplete="name" />
              <input type="email"    placeholder="Email"            value={email}    onChange={e => setEmail(e.target.value)}    required autoComplete="email" />
              <input type="password" placeholder="Password"         value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
              <input type="password" placeholder="Re-enter Password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
              <button type="submit" className="btn-submit" disabled={busy}>
                {busy ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* ── Sign In Form ── */}
          {tab === 'signin' && (
            <form className="auth-form" onSubmit={handleSignIn}>
              <input type="email"    placeholder="Email"    value={email}    onChange={e => setEmail(e.target.value)}    required autoComplete="email" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="submit" className="btn-submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="auth-divider"><span>or</span></div>

          <button className="google-btn" onClick={handleGoogleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          <p className="login-note">Only Horizonia University accounts are supported.</p>
        </div>
      </div>
    </div>
  )
}
