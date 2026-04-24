// src/components/tickets/TicketPriorityBadge.jsx
const PRIORITY_META = {
    CRITICAL: { label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    HIGH:     { label: 'High',     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    MEDIUM:   { label: 'Medium',   color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
    LOW:      { label: 'Low',      color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
}

export default function TicketPriorityBadge({ priority }) {
    const m = PRIORITY_META[priority] || { label: priority, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
            color: m.color, background: m.bg, border: `1px solid ${m.border}`,
            letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
            {m.label}
        </span>
    )
}
