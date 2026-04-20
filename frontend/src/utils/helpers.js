// src/utils/helpers.js

// ── Date / Time ──────────────────────────────────────────────────────────
export function formatDate(d) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

export function formatTime(t) {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hr = parseInt(h, 10)
    return `${hr % 12 === 0 ? 12 : hr % 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

export function formatTimeRange(s, e) {
    return `${formatTime(s)} – ${formatTime(e)}`
}

export function formatDateTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export function todayISO() {
    return new Date().toISOString().split('T')[0]
}

export function isUpcoming(dateStr) {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateStr + 'T00:00:00') >= today
}

// ── Status metadata ──────────────────────────────────────────────────────
export const STATUS_META = {
    PENDING: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    IN_REVIEW: { label: 'In Review', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    APPROVED: { label: 'Approved', color: '#2d8653', bg: '#f2faf5', border: '#b8e6ca' },
    REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
}
export const getStatus = (s) => STATUS_META[s] || STATUS_META.PENDING

// ── Resource metadata ────────────────────────────────────────────────────
export const RESOURCE_ICON = {
    LECTURE_HALL: '🏛️', LAB: '🔬', MEETING_ROOM: '🪑', EQUIPMENT: '🎛️',
}
export const RESOURCE_LABEL = {
    LECTURE_HALL: 'Lecture Hall', LAB: 'Lab', MEETING_ROOM: 'Meeting Room', EQUIPMENT: 'Equipment',
}
export const RESOURCE_TYPE_COLOR = {
    LECTURE_HALL: { color: '#1e6b3f', bg: '#f2faf5', border: '#b8e6ca' },
    LAB: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    MEETING_ROOM: { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
    EQUIPMENT: { color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
}
export const getIcon = (t) => RESOURCE_ICON[t] || '📍'
export const getLabel = (t) => RESOURCE_LABEL[t] || t

// ── String utils ─────────────────────────────────────────────────────────
export function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}