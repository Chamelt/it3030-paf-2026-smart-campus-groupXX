// src/layouts/AppShell.jsx
// Fixed left sidebar with navigation + scrollable main content area.

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Avatar } from '../components/ui/index.jsx'

const NAV_USER = [
    { label: 'Resources', path: '/resources', icon: '🏛️' },
    { label: 'My Bookings', path: '/my-bookings', icon: '📋' },
]
const NAV_ADMIN = [
    { label: 'Bookings', path: '/admin/bookings', icon: '📊' },
]

function NavItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 'var(--r-md)', border: 'none',
            background: active ? 'var(--primary)' : 'transparent',
            color: active ? '#fff' : 'var(--text-sec)',
            cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
            fontFamily: 'var(--font-body)', transition: 'all 150ms var(--ease)', textAlign: 'left',
        }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--gray100)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
        >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
        </button>
    )
}

export default function AppShell({ children }) {
    const { currentUser, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside style={{
                width: 230, flexShrink: 0, height: '100vh',
                background: 'var(--white)', borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)', zIndex: 10,
            }}>

                {/* Logo */}
                <div style={{ padding: '22px 18px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--r-md)',
                            background: 'linear-gradient(135deg, var(--g600), var(--g700))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 18, flexShrink: 0,
                        }}>🌿</div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.1 }}>SmartCampus</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>Operations Hub</div>
                        </div>
                    </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 14px' }} />

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {!isAdmin && (
                        <>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 6px 8px', textTransform: 'uppercase' }}>Menu</p>
                            {NAV_USER.map(n => (
                                <NavItem key={n.path} icon={n.icon} label={n.label}
                                    active={location.pathname === n.path}
                                    onClick={() => navigate(n.path)} />
                            ))}
                        </>
                    )}
                    {isAdmin && (
                        <>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 6px 8px', textTransform: 'uppercase' }}>Admin</p>
                            {NAV_ADMIN.map(n => (
                                <NavItem key={n.path} icon={n.icon} label={n.label}
                                    active={location.pathname.startsWith(n.path)}
                                    onClick={() => navigate(n.path)} />
                            ))}
                        </>
                    )}
                </nav>

                {/* User footer */}
                <div style={{ padding: '14px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={currentUser?.name || ''} size={34} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {currentUser?.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUser?.role}</div>
                        </div>
                        <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 17, padding: 4, lineHeight: 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >⏻</button>
                    </div>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────── */}
            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-subtle)' }}>
                {children}
            </main>
        </div>
    )
}