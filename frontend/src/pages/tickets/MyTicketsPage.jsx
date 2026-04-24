// src/pages/tickets/MyTicketsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, EmptyState, Toast } from '../../components/ui/index.jsx'
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx'
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge.jsx'
import { getMyTickets } from '../../services/ticketService.js'
import { formatDateTime } from '../../utils/helpers.js'
import './MyTicketsPage.css'

const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}

const STATUSES = ['OPEN','PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED']
const CATEGORIES = ['ELECTRICAL','PLUMBING','AV_EQUIPMENT','FURNITURE','IT','OTHER']
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL']

export default function MyTicketsPage() {
    const navigate = useNavigate()
    const [tickets,  setTickets]  = useState([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    const [toast,    setToast]    = useState(null)

    // Filters
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterPriority, setFilterPriority] = useState('')

    const load = useCallback(() => {
        setLoading(true)
        setError(null)
        getMyTickets()
            .then(data => setTickets(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = tickets.filter(t => {
        if (filterStatus   && t.status   !== filterStatus)   return false
        if (filterCategory && t.category !== filterCategory) return false
        if (filterPriority && t.priority !== filterPriority) return false
        return true
    })

    const location = t => t.resourceName || t.locationText || '—'

    return (
        <div className="my-tickets-page">
            <div className="my-tickets-header">
                <h1>🔧 My Tickets</h1>
                <p>Track and manage your maintenance and incident reports</p>
            </div>

            {/* Filter bar */}
            <div className="tickets-filter-bar">
                <select className="tickets-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
                <select className="tickets-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <select className="tickets-filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="tickets-count">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading && <Spinner />}

            {!loading && error && (
                <div className="tickets-error">Failed to load tickets: {error}</div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <EmptyState
                    icon="🎫"
                    title="No tickets found"
                    desc={tickets.length === 0 ? 'You have not submitted any tickets yet.' : 'Try adjusting your filters.'}
                />
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="tickets-grid stagger">
                    {filtered.map(t => (
                        <div key={t.ticketId} className="ticket-card scale-in" onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                            <div className="ticket-card-header">
                                <div>
                                    <p className="ticket-card-id">#{t.ticketId?.slice(0, 8).toUpperCase()}</p>
                                    <p className="ticket-card-category">{CATEGORY_LABEL[t.category] || t.category}</p>
                                </div>
                                <div className="ticket-card-badges">
                                    <TicketPriorityBadge priority={t.priority} />
                                    <TicketStatusBadge status={t.status} />
                                </div>
                            </div>
                            <p className="ticket-card-location">📍 {location(t)}</p>
                            <div className="ticket-card-date">
                                <span>Submitted: {formatDateTime(t.createdAt)}</span>
                            </div>
                            <p className="ticket-card-cta">View details →</p>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
