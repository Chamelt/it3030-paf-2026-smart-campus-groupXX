// src/components/ui/index.jsx
// Shared UI primitives used across the booking module.
// Btn, Card, Modal, Toast, StatusBadge, Avatar, Input, Textarea, Select,
// Spinner, EmptyState, SectionHeading, Divider

import React, { useEffect, useRef } from 'react'
import { getStatus, initials } from '../../utils/helpers.js'

/* ── Button ─────────────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
    primary: { background: 'var(--primary)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--white)', color: 'var(--text)', border: '1.5px solid var(--border)' },
    danger: { background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' },
    success: { background: 'var(--g50)', color: 'var(--g700)', border: '1.5px solid var(--g200)' },
    ghost: { background: 'transparent', color: 'var(--text-sec)', border: 'none' },
}
const BTN_SIZES = {
    sm: { padding: '5px 12px', fontSize: 13 },
    md: { padding: '8px 18px', fontSize: 14 },
    lg: { padding: '11px 24px', fontSize: 15 },
}

export function Btn({ children, variant = 'primary', size = 'md', disabled, loading, onClick, type = 'button', style = {} }) {
    const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary
    const s = BTN_SIZES[size] || BTN_SIZES.md
    const off = disabled || loading
    return (
        <button type={type} disabled={off} onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'var(--font-body)', fontWeight: 500, borderRadius: 'var(--r-md)',
                cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.55 : 1,
                transition: 'filter 150ms var(--ease)', outline: 'none', ...v, ...s, ...style,
            }}
            onMouseEnter={e => { if (!off) e.currentTarget.style.filter = 'brightness(0.92)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = '' }}
        >
            {loading && (
                <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
            )}
            {children}
        </button>
    )
}

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
    const m = getStatus(status)
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
            color: m.color, background: m.bg, border: `1px solid ${m.border}`,
            letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            {m.label}
        </span>
    )
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
export function Avatar({ name = '', size = 36 }) {
    const colors = ['#2d8653', '#7c3aed', '#d97706', '#1d4ed8', '#dc2626', '#0891b2']
    const idx = (name.charCodeAt(0) || 0) % colors.length
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: colors[idx], color: '#fff', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: size * 0.38, fontFamily: 'var(--font-body)',
        }}>
            {initials(name)}
        </div>
    )
}

/* ── Card ────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, onClick, className = '' }) {
    return (
        <div className={`scale-in ${className}`} onClick={onClick}
            style={{
                background: 'var(--surface)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 200ms var(--ease), transform 200ms var(--ease)',
                cursor: onClick ? 'pointer' : 'default', ...style,
            }}
            onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = '' }}
        >
            {children}
        </div>
    )
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
export function Spinner({ size = 32 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: size, height: size, border: '3px solid var(--gray200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}

/* ── EmptyState ──────────────────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, desc }) {
    return (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>{title}</p>
            {desc && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</p>}
        </div>
    )
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 560 }) {
    const ref = useRef()
    useEffect(() => {
        if (!open) return
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [open, onClose])
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])
    if (!open) return null
    return (
        <div className="fade-in" style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
            <div ref={ref} className="scale-in" style={{
                background: '#ffffff', borderRadius: 'var(--r-xl)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: width,
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                {title && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>{title}</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
                    </div>
                )}
                <div style={{ padding: '16px 24px 24px' }}>{children}</div>
            </div>
        </div>
    )
}

/* ── Toast ───────────────────────────────────────────────────────────────── */
export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t) }, [onClose])
    const C = {
        success: { bg: 'var(--g50)', border: 'var(--g200)', color: 'var(--g700)', icon: '✓' },
        error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '✕' },
        info: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', icon: 'ℹ' },
    }[type] || {}
    return (
        <div className="fade-in" style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
            background: C.bg, border: `1px solid ${C.border}`, color: C.color,
            padding: '12px 20px', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
            fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380,
        }}>
            <span style={{ fontSize: 16 }}>{C.icon}</span>
            {message}
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: 16 }}>✕</button>
        </div>
    )
}

/* ── Form fields ─────────────────────────────────────────────────────────── */
const fieldBase = {
    width: '100%', fontFamily: 'var(--font-body)', fontSize: 14,
    background: 'var(--white)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none',
    transition: 'border-color 150ms var(--ease)',
}

export function Input({ label, error, hint, ...props }) {
    return (
        <label style={{ display: 'block' }}>
            {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-sec)', marginBottom: 5 }}>{label}</span>}
            <input {...props}
                style={{ ...fieldBase, padding: '8px 12px', ...(error ? { borderColor: '#dc2626' } : {}) }}
                onFocus={e => { e.target.style.borderColor = error ? '#dc2626' : 'var(--primary)' }}
                onBlur={e => { e.target.style.borderColor = error ? '#dc2626' : 'var(--border)' }}
            />
            {hint && !error && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</span>}
            {error && <span style={{ display: 'block', fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</span>}
        </label>
    )
}

export function Textarea({ label, error, rows = 3, ...props }) {
    return (
        <label style={{ display: 'block' }}>
            {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-sec)', marginBottom: 5 }}>{label}</span>}
            <textarea rows={rows} {...props}
                style={{ ...fieldBase, padding: '8px 12px', resize: 'vertical', ...(error ? { borderColor: '#dc2626' } : {}) }}
                onFocus={e => { e.target.style.borderColor = error ? '#dc2626' : 'var(--primary)' }}
                onBlur={e => { e.target.style.borderColor = error ? '#dc2626' : 'var(--border)' }}
            />
            {error && <span style={{ display: 'block', fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</span>}
        </label>
    )
}

/* ── SectionHeading ──────────────────────────────────────────────────────── */
export function SectionHeading({ children, sub }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text)', lineHeight: 1.2 }}>{children}</h1>
            {sub && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</p>}
        </div>
    )
}