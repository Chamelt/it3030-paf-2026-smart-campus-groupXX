// src/pages/admin/AllTicketsPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast, Modal, Btn } from '../../components/ui/index.jsx'
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx'
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge.jsx'
import { getAllTickets, getTechniciansByCategory, assignTechnician } from '../../services/ticketService.js'
import { formatDateTime } from '../../utils/helpers.js'
import './AllTicketsPage.css'

const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}
const STATUSES   = ['OPEN','PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED']
const CATEGORIES = ['ELECTRICAL','PLUMBING','AV_EQUIPMENT','FURNITURE','IT','OTHER']
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL']
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function fmtDuration(ms) {
    if (!ms || ms <= 0) return null
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
    const d = Math.floor(h / 24)
    return `${d}d ${h % 24}h`
}

function getAlertInfo(t) {
    const now = Date.now()
    const createdMs  = t.createdAt  ? new Date(t.createdAt).getTime()  : 0
    const acceptedMs = t.acceptedAt ? new Date(t.acceptedAt).getTime() : 0
    const assignedMs = t.assignedAt ? new Date(t.assignedAt).getTime() : 0

    if (t.priority === 'CRITICAL' && !t.assignedToName && ['OPEN','PENDING'].includes(t.status)) {
        const hrs = (now - createdMs) / 3600000
        if (hrs >= 4) return { level: 'critical', text: `Unassigned ${Math.floor(hrs)}h+` }
    }
    if (t.status === 'IN_PROGRESS' && t.acceptedAt) {
        const days = (now - acceptedMs) / 86400000
        if (days >= 30) return { level: 'overdue', text: `${Math.floor(days)}d in progress` }
    }
    if (t.status === 'ASSIGNED' && t.assignedToName && t.assignedAt) {
        const hrs = (now - assignedMs) / 3600000
        if (hrs >= 4) return { level: 'warn', text: `Not started (${Math.floor(hrs)}h)` }
    }
    return null
}

function TicketDrawer({ ticket, seqId, onClose, onNavigate }) {
    if (!ticket) return null
    const loc = ticket.resourceName || ticket.locationText || '—'
    const responseMs   = ticket.assignedAt && ticket.createdAt
        ? new Date(ticket.assignedAt) - new Date(ticket.createdAt) : null
    const resolutionMs = ticket.resolvedAt && ticket.acceptedAt
        ? new Date(ticket.resolvedAt) - new Date(ticket.acceptedAt) : null

    return (
        <>
            <div className="drawer-backdrop" onClick={onClose} />
            <div className="ticket-drawer">
                <div className="drawer-header">
                    <div>
                        <span className="drawer-seq-id">{seqId}</span>
                        <p className="drawer-category">{CATEGORY_LABEL[ticket.category] || ticket.category} Issue</p>
                    </div>
                    <button className="drawer-close" onClick={onClose}>✕</button>
                </div>

                <div className="drawer-badges">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                </div>

                <div className="drawer-grid">
                    <div className="drawer-item">
                        <p className="drawer-label">Location</p>
                        <p className="drawer-value">📍 {loc}</p>
                    </div>
                    <div className="drawer-item">
                        <p className="drawer-label">Reported by</p>
                        <p className="drawer-value">{ticket.createdByName || '—'}</p>
                    </div>
                    <div className="drawer-item">
                        <p className="drawer-label">Submitted</p>
                        <p className="drawer-value">{formatDateTime(ticket.createdAt)}</p>
                    </div>
                    <div className="drawer-item">
                        <p className="drawer-label">Assigned to</p>
                        <p className="drawer-value">{ticket.assignedToName || 'Unassigned'}</p>
                    </div>
                    <div className="drawer-item">
                        <p className="drawer-label">Response Time</p>
                        <p className="drawer-value" style={{ color: responseMs ? (responseMs > 14400000 ? '#dc2626' : '#15803d') : 'var(--text-muted)' }}>
                            {responseMs ? fmtDuration(responseMs) : ticket.assignedAt ? '—' : 'Awaiting assignment'}
                        </p>
                    </div>
                    <div className="drawer-item">
                        <p className="drawer-label">Resolution Time</p>
                        <p className="drawer-value" style={{ color: resolutionMs ? '#15803d' : ticket.status === 'IN_PROGRESS' ? '#c2410c' : 'var(--text-muted)' }}>
                            {resolutionMs ? fmtDuration(resolutionMs) : ticket.status === 'IN_PROGRESS' ? 'In progress…' : '—'}
                        </p>
                    </div>
                    {ticket.contactDetails && (
                        <div className="drawer-item">
                            <p className="drawer-label">Contact</p>
                            <p className="drawer-value">{ticket.contactDetails}</p>
                        </div>
                    )}
                    <div className="drawer-item">
                        <p className="drawer-label">Last updated</p>
                        <p className="drawer-value">{formatDateTime(ticket.updatedAt)}</p>
                    </div>
                </div>

                {ticket.description && (
                    <div className="drawer-section">
                        <p className="drawer-section-label">Description</p>
                        <p className="drawer-desc">{ticket.description}</p>
                    </div>
                )}

                {ticket.rejectionReason && (
                    <div className="drawer-note drawer-note-red">
                        <p className="drawer-note-label">Rejection reason</p>
                        <p>{ticket.rejectionReason}</p>
                    </div>
                )}

                {ticket.resolutionNotes && (
                    <div className="drawer-note drawer-note-green">
                        <p className="drawer-note-label">Resolution notes</p>
                        <p>{ticket.resolutionNotes}</p>
                    </div>
                )}

                <div className="drawer-footer">
                    <button className="drawer-full-btn" onClick={() => onNavigate(ticket.ticketId)}>
                        Open full page →
                    </button>
                </div>
            </div>
        </>
    )
}

export default function AllTicketsPage() {
    const navigate        = useNavigate()
    const { isAdmin }     = useAuth()

    const [tickets,  setTickets]  = useState([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    const [toast,    setToast]    = useState(null)

    // Filters
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [filterAssigned, setFilterAssigned] = useState('')
    const [sortBy,         setSortBy]         = useState('date')

    // Drawer
    const [drawerTicket, setDrawerTicket] = useState(null)

    // Quick assign modal
    const [assignTicket,    setAssignTicket]    = useState(null)
    const [technicians,     setTechnicians]     = useState([])
    const [selectedTechId,  setSelectedTechId]  = useState('')
    const [assignLoading,   setAssignLoading]   = useState(false)
    const [assignError,     setAssignError]     = useState('')

    const load = useCallback(() => {
        setLoading(true); setError(null)
        getAllTickets()
            .then(data => setTickets(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (!assignTicket) return
        setTechnicians([]); setSelectedTechId(''); setAssignError('')
        getTechniciansByCategory(assignTicket.category === 'OTHER' ? null : assignTicket.category)
            .then(setTechnicians)
            .catch(e => setAssignError(e.message))
    }, [assignTicket])

    // Sequential T1, T2... map (sorted oldest first)
    const seqMap = useMemo(() => {
        const sorted = [...tickets].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        const map = {}
        sorted.forEach((t, i) => { map[t.ticketId] = `T${i + 1}` })
        return map
    }, [tickets])

    const handleAssign = async () => {
        if (!selectedTechId) { setAssignError('Select a technician.'); return }
        setAssignLoading(true); setAssignError('')
        try {
            await assignTechnician(assignTicket.ticketId, selectedTechId)
            setAssignTicket(null)
            setToast({ message: 'Technician assigned successfully.', type: 'success' })
            load()
        } catch (e) {
            setAssignError(e.message)
        } finally {
            setAssignLoading(false)
        }
    }

    const filtered = useMemo(() => {
        let list = tickets.filter(t => {
            if (filterStatus   && t.status   !== filterStatus)   return false
            if (filterCategory && t.category !== filterCategory) return false
            if (filterPriority && t.priority !== filterPriority) return false
            if (filterAssigned === 'assigned'   && !t.assignedToName) return false
            if (filterAssigned === 'unassigned' &&  t.assignedToName) return false
            return true
        })
        if (sortBy === 'date')     list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        if (sortBy === 'priority') list = [...list].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4))
        return list
    }, [tickets, filterStatus, filterCategory, filterPriority, filterAssigned, sortBy])

    const loc = t => t.resourceName || t.locationText || '—'

    return (
        <div className="all-tickets-page">
            <div className="all-tickets-header">
                <h1>🎫 All Tickets</h1>
                <p>Review and manage all campus maintenance and incident tickets</p>
            </div>

            {/* Toolbar */}
            <div className="all-tickets-toolbar">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                    <option value="">Assigned &amp; Unassigned</option>
                    <option value="assigned">Assigned only</option>
                    <option value="unassigned">Unassigned only</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="date">Newest first</option>
                    <option value="priority">Priority first</option>
                </select>
            </div>

            {!loading && <p className="all-tickets-count">Showing {filtered.length} of {tickets.length} tickets</p>}

            {loading && <Spinner />}

            {!loading && error && (
                <div className="tickets-error">Failed to load tickets: {error}</div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon="🎫" title="No tickets found" desc="Try adjusting your filters." />
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="all-tickets-table-wrap">
                    <table className="all-tickets-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Technician</th>
                                <th>Response</th>
                                <th>Resolution</th>
                                <th>Alert</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => {
                                const alert = getAlertInfo(t)
                                const responseMs   = t.assignedAt && t.createdAt
                                    ? new Date(t.assignedAt) - new Date(t.createdAt) : null
                                const resolutionMs = t.resolvedAt && t.acceptedAt
                                    ? new Date(t.resolvedAt) - new Date(t.acceptedAt) : null

                                return (
                                    <tr
                                        key={t.ticketId}
                                        className={alert?.level === 'critical' ? 'row-alert-critical' : ''}
                                        onClick={() => setDrawerTicket(t)}
                                    >
                                        <td>
                                            <span className="ticket-seq-id">{seqMap[t.ticketId]}</span>
                                        </td>
                                        <td>
                                            <span className="ticket-table-category">{CATEGORY_LABEL[t.category] || t.category}</span>
                                        </td>
                                        <td><TicketPriorityBadge priority={t.priority} /></td>
                                        <td><TicketStatusBadge status={t.status} /></td>
                                        <td>
                                            <span className="ticket-table-location" title={loc(t)}>{loc(t)}</span>
                                        </td>
                                        <td>
                                            <span className={`ticket-table-tech${t.assignedToName ? ' assigned' : ''}`}>
                                                {t.assignedToName || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ticket-time-cell${responseMs && responseMs > 14400000 ? ' over-sla' : responseMs ? ' ok' : ''}`}>
                                                {responseMs ? fmtDuration(responseMs) : t.status === 'REJECTED' ? '—' : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting</span>}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ticket-time-cell${resolutionMs ? ' ok' : t.status === 'IN_PROGRESS' ? ' active' : ''}`}>
                                                {resolutionMs ? fmtDuration(resolutionMs)
                                                    : t.status === 'IN_PROGRESS'
                                                    ? <span style={{ color: '#c2410c', fontStyle: 'italic' }}>Ongoing</span>
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {alert ? (
                                                <span className={`ticket-alert-badge alert-${alert.level}`}>
                                                    {alert.level === 'critical' ? '🚨' : alert.level === 'overdue' ? '⏰' : '⏳'} {alert.text}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="ticket-table-actions" onClick={e => e.stopPropagation()}>
                                                <Btn size="sm" variant="secondary" onClick={() => setDrawerTicket(t)}>
                                                    View
                                                </Btn>
                                                {isAdmin && !t.assignedToName && ['OPEN','PENDING'].includes(t.status) && (
                                                    <Btn size="sm" onClick={() => setAssignTicket(t)}>
                                                        Assign
                                                    </Btn>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Ticket Drawer */}
            <TicketDrawer
                ticket={drawerTicket}
                seqId={drawerTicket ? seqMap[drawerTicket.ticketId] : ''}
                onClose={() => setDrawerTicket(null)}
                onNavigate={id => navigate(`/tickets/${id}`)}
            />

            {/* Quick Assign Modal */}
            <Modal open={!!assignTicket} onClose={() => setAssignTicket(null)} title="👤 Quick Assign" width={460}>
                {assignTicket && (
                    <>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                            Assigning <strong>{seqMap[assignTicket.ticketId]}</strong> — {CATEGORY_LABEL[assignTicket.category] || assignTicket.category}
                        </p>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-sec)', marginBottom: 6 }}>Technician</label>
                            {technicians.length === 0 && !assignError
                                ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading technicians…</p>
                                : technicians.length === 0
                                ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No available technicians for this category.</p>
                                : (
                                    <select
                                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
                                        value={selectedTechId}
                                        onChange={e => setSelectedTechId(e.target.value)}
                                    >
                                        <option value="">— Select technician —</option>
                                        {technicians.map(t => (
                                            <option key={t.userId} value={t.userId}>
                                                {t.name}{assignTicket?.category === 'OTHER' && t.specialty ? ` [${t.specialty}]` : ''} · {t.email}
                                            </option>
                                        ))}
                                    </select>
                                )
                            }
                        </div>
                        {assignError && (
                            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-md)', padding: '8px 12px', marginBottom: 12 }}>
                                {assignError}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <Btn variant="secondary" onClick={() => setAssignTicket(null)}>Cancel</Btn>
                            <Btn loading={assignLoading} disabled={!selectedTechId} onClick={handleAssign}>Assign</Btn>
                        </div>
                    </>
                )}
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
