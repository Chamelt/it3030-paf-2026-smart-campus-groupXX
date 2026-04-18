// src/pages/LoginPage.jsx
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const BASE = import.meta.env.VITE_API_URL || ''

export default function LoginPage() {
    const { login } = useAuth()

    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // ── Email / Password Login ────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const res = await fetch(`${BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Login failed')
            login(data.token)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // ── Email / Password Register ─────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const res = await fetch(`${BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Registration failed')
            login(data.token)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // ── Google OAuth ──────────────────────────────────────────────────
    const handleGoogle = () => {
        window.location.href = `${BASE}/api/auth/google`
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gray50)',
            fontFamily: 'var(--font-body)',
        }}>
            <div style={{
                background: 'var(--white)', borderRadius: 16,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                padding: '40px 36px', width: '100%', maxWidth: 420,
            }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: 'var(--primary)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, marginBottom: 12,
                    }}>🏛️</div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: 0 }}>
                        SmartCampus
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                        Operations Hub
                    </p>
                </div>

                {/* Tab toggle */}
                <div style={{
                    display: 'flex', background: 'var(--gray100)', borderRadius: 8,
                    padding: 3, marginBottom: 24,
                }}>
                    {['login', 'register'].map(m => (
                        <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                            flex: 1, padding: '8px', borderRadius: 6, border: 'none',
                            background: mode === m ? 'var(--white)' : 'transparent',
                            color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                            fontWeight: mode === m ? 600 : 400,
                            fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            boxShadow: mode === m ? 'var(--shadow-xs)' : 'none',
                            transition: 'all 150ms',
                        }}>
                            {m === 'login' ? 'Sign In' : 'Register'}
                        </button>
                    ))}
                </div>

                {/* Google button */}
                <button onClick={handleGoogle} style={{
                    width: '100%', padding: '11px', borderRadius: 10,
                    border: '1.5px solid var(--border)', background: 'var(--white)',
                    fontSize: 15, fontFamily: 'var(--font-body)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    marginBottom: 18, fontWeight: 500,
                    transition: 'background 150ms',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
                >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Form */}
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                    {mode === 'register' && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 6 }}>
                                Full Name
                            </label>
                            <input
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Your name" required
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 6 }}>
                            Email
                        </label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="you@campus.edu" required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 6 }}>
                            Password
                        </label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16,
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                        background: loading ? 'var(--gray300)' : 'var(--primary)',
                        color: '#fff', fontSize: 15, fontWeight: 600,
                        fontFamily: 'var(--font-body)', cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'filter 150ms',
                    }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(0.92)' }}
                        onMouseLeave={e => e.currentTarget.style.filter = ''}
                    >
                        {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid var(--border)', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none',
    background: 'var(--white)', boxSizing: 'border-box',
    transition: 'border-color 150ms',
}