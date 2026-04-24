// src/components/tickets/TicketStatusBadge.jsx
const STATUS_META = {
    OPEN:        { label: 'Open',        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    PENDING:     { label: 'Pending',     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    ASSIGNED:    { label: 'Assigned',    color: '#3730a3', bg: '#e0e7ff', border: '#c7d2fe' },
    IN_PROGRESS: { label: 'In Progress', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    RESOLVED:    { label: 'Resolved',    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    CLOSED:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
    REJECTED:    { label: 'Rejected',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

export default function TicketStatusBadge({ status }) {
    const m = STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
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
