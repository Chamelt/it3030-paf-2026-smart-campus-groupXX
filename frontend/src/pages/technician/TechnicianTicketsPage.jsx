// src/pages/technician/TechnicianTicketsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, EmptyState, Toast, Modal, Btn } from '../../components/ui/index.jsx'
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge.jsx'
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx'
import { getAssignedTickets, acceptTicket, updateTicketStatus } from '../../services/ticketService.js'
import { formatDateTime } from '../../utils/helpers.js'
import './TechnicianTicketsPage.css'

const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL']

function SectionHeader({ title, count, accent }) {
    const colors = {
        orange: { title: '#c2410c', count: { bg: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }, line: '#fed7aa' },
        blue:   { title: '#1d4ed8', count: { bg: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }, line: '#bfdbfe' },
        gray:   { title: 'var(--text-muted)', count: { bg: 'var(--gray100)', color: 'var(--text-muted)', border: '1px solid var(--border)' }, line: 'var(--border)' },
    }[accent] || colors.gray
    return (
        <div className="tech-section-header">
            <h2 className="tech-section-title" style={{ color: colors.title }}>{title}</h2>
            <span className="tech-section-count" style={colors.count}>{count}</span>
            <div className="tech-section-line" style={{ background: `linear-gradient(90deg, ${colors.line}, transparent)` }} />
        </div>
    )
}

export default function TechnicianTicketsPage() {
    const navigate = useNavigate()
    const [tickets,  setTickets]  = useState([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    const [toast,    setToast]    = useState(null)
    const [filterPriority, setFilterPriority] = useState('')

    // Start Work modal
    const [startWorkTicket,  setStartWorkTicket]  = useState(null)
    const [startWorkLoading, setStartWorkLoading] = useState(false)
    const [startWorkError,   setStartWorkError]   = useState('')

    // Resolve modal
    const [resolveTicket,    setResolveTicket]    = useState(null)
    const [resolveNotes,     setResolveNotes]     = useState('')
    const [resolveLoading,   setResolveLoading]   = useState(false)
    const [resolveError,     setResolveError]     = useState('')

    const load = useCallback(() => {
        setLoading(true); setError(null)
        getAssignedTickets()
            .then(data => setTickets(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    const handleStartWork = async (markOutOfService) => {
        setStartWorkLoading(true); setStartWorkError('')
        try {
            await acceptTicket(startWorkTicket.ticketId, markOutOfService)
            setStartWorkTicket(null)
            setToast({ message: 'Work started. Ticket is now In Progress.', type: 'success' })
            load()
        } catch (e) {
            setStartWorkError(e.message)
        } finally {
            setStartWorkLoading(false)
        }
    }

    const handleResolve = async () => {
        if (resolveNotes.trim().length < 20) { setResolveError('Notes must be at least 20 characters.'); return }
        setResolveLoading(true); setResolveError('')
        try {
            await updateTicketStatus(resolveTicket.ticketId, { status: 'RESOLVED', resolutionNotes: resolveNotes.trim() })
            setResolveTicket(null); setResolveNotes('')
            setToast({ message: 'Ticket marked as resolved.', type: 'success' })
            load()
        } catch (e) {
            setResolveError(e.message)
        } finally {
            setResolveLoading(false)
        }
    }

    const filtered = tickets.filter(t => !filterPriority || t.priority === filterPriority)
    const inProgress = filtered.filter(t => t.status === 'IN_PROGRESS')
    const assigned   = filtered.filter(t => t.status === 'ASSIGNED')
    const others     = filtered.filter(t => !['IN_PROGRESS','ASSIGNED'].includes(t.status))

    const loc = t => t.resourceName || t.locationText || '—'

    const TicketCard = ({ t }) => (
        <div
            className={`tech-ticket-card${t.status === 'IN_PROGRESS' ? ' in-progress' : t.status === 'ASSIGNED' ? ' assigned' : ''}`}
            onClick={() => navigate(`/tickets/${t.ticketId}`)}
        >
            <div className="tech-card-top">
                <div>
                    <p className="tech-card-id">#{t.ticketId?.slice(0,8).toUpperCase()}</p>
                    <p className="tech-card-category">{CATEGORY_LABEL[t.category] || t.category}</p>
                </div>
                <TicketPriorityBadge priority={t.priority} />
            </div>
            <p className="tech-card-location">📍 {loc(t)}</p>
            {t.contactDetails && (
                <p className="tech-card-contact">📞 {t.contactDetails}</p>
            )}
            <p className="tech-card-date">Submitted: {formatDateTime(t.createdAt)}</p>

            {(t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && (
                <div className="tech-card-actions" onClick={e => e.stopPropagation()}>
                    {t.status === 'ASSIGNED' && (
                        <Btn size="sm" onClick={() => { setStartWorkError(''); setStartWorkTicket(t) }}>
                            ▶ Start Work
                        </Btn>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                        <Btn size="sm" variant="success"
                            style={{ background: '#15803d', color: '#fff', border: '1px solid #166534', borderRadius: 6, fontWeight: 700, letterSpacing: '0.01em' }}
                            onClick={() => { setResolveNotes(''); setResolveError(''); setResolveTicket(t) }}>
                            ✓ Resolve
                        </Btn>
                    )}
                    <Btn size="sm" variant="secondary" onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                        View
                    </Btn>
                </div>
            )}
        </div>
    )

    if (loading) return <div style={{ padding: 48 }}><Spinner /></div>

    return (
        <div className="tech-tickets-page">
            <div className="tech-tickets-header">
                <h1>📋 My Tasks</h1>
                <p>Tickets assigned to you — accept and resolve maintenance tasks</p>
            </div>

            {/* Filter bar */}
            <div className="tech-filter-bar">
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-md)', color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
                    Failed to load tickets: {error}
                </div>
            )}

            {!error && filtered.length === 0 && (
                <EmptyState icon="📋" title="No assigned tickets" desc="You have no tickets assigned to you right now." />
            )}

            {/* IN_PROGRESS section */}
            {inProgress.length > 0 && (
                <>
                    <SectionHeader title="In Progress" count={inProgress.length} accent="orange" />
                    <div className="tech-tickets-grid stagger" style={{ marginBottom: 32 }}>
                        {inProgress.map(t => <TicketCard key={t.ticketId} t={t} />)}
                    </div>
                </>
            )}

            {/* ASSIGNED section */}
            {assigned.length > 0 && (
                <>
                    <SectionHeader title="Assigned" count={assigned.length} accent="blue" />
                    <div className="tech-tickets-grid stagger" style={{ marginBottom: 32 }}>
                        {assigned.map(t => <TicketCard key={t.ticketId} t={t} />)}
                    </div>
                </>
            )}

            {/* Others */}
            {others.length > 0 && (
                <>
                    <SectionHeader title="Other" count={others.length} accent="gray" />
                    <div className="tech-tickets-grid stagger">
                        {others.map(t => (
                            <div key={t.ticketId} className="tech-ticket-card" onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                                <div className="tech-card-top">
                                    <div>
                                        <p className="tech-card-id">#{t.ticketId?.slice(0,8).toUpperCase()}</p>
                                        <p className="tech-card-category">{CATEGORY_LABEL[t.category] || t.category}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <TicketPriorityBadge priority={t.priority} />
                                        <TicketStatusBadge status={t.status} />
                                    </div>
                                </div>
                                <p className="tech-card-location">📍 {loc(t)}</p>
                                <p className="tech-card-date">{formatDateTime(t.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Start Work Modal ── */}
            <Modal open={!!startWorkTicket} onClose={() => setStartWorkTicket(null)} title="▶ Start Work" width={460}>
                {startWorkTicket && (
                    startWorkTicket.resourceId ? (
                        <>
                            <div className="tech-modal-info">
                                Do you want to mark <strong>{startWorkTicket.resourceName}</strong> as <strong>OUT OF SERVICE</strong> while you work on it?
                            </div>
                            {startWorkError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{startWorkError}</p>}
                            <div className="tech-modal-actions">
                                <Btn variant="secondary" onClick={() => setStartWorkTicket(null)}>Cancel</Btn>
                                <Btn variant="secondary" loading={startWorkLoading} onClick={() => handleStartWork(false)}>No, keep active</Btn>
                                <Btn variant="danger" loading={startWorkLoading} onClick={() => handleStartWork(true)}>Yes, Out of Service</Btn>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="tech-modal-info">
                                Accept this repair task and start working on it?
                            </div>
                            {startWorkError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{startWorkError}</p>}
                            <div className="tech-modal-actions">
                                <Btn variant="secondary" onClick={() => setStartWorkTicket(null)}>Cancel</Btn>
                                <Btn loading={startWorkLoading} onClick={() => handleStartWork(false)}>Confirm</Btn>
                            </div>
                        </>
                    )
                )}
            </Modal>

            {/* ── Resolve Modal ── */}
            <Modal open={!!resolveTicket} onClose={() => setResolveTicket(null)} title="✓ Mark Resolved" width={500}>
                {resolveTicket && (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 14, lineHeight: 1.5 }}>
                            Describe how the issue was resolved.
                        </p>
                        <textarea
                            className="tech-modal-textarea"
                            value={resolveNotes}
                            onChange={e => setResolveNotes(e.target.value)}
                            placeholder="Describe what was done to fix the issue… (min 20 chars)"
                            rows={4}
                        />
                        <p className="tech-modal-hint">{resolveNotes.trim().length}/20 minimum characters</p>
                        {resolveError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{resolveError}</p>}
                        <div className="tech-modal-actions">
                            <Btn variant="secondary" onClick={() => setResolveTicket(null)}>Cancel</Btn>
                            <Btn variant="success" loading={resolveLoading} disabled={resolveNotes.trim().length < 20}
                                style={{ background: '#15803d', color: '#fff', border: '1px solid #166534', borderRadius: 6, fontWeight: 700 }}
                                onClick={handleResolve}>
                                ✓ Mark as Resolved
                            </Btn>
                        </div>
                    </>
                )}
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
