// src/pages/tickets/TicketDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast, Modal, Btn, Avatar } from '../../components/ui/index.jsx'
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx'
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge.jsx'
import SLATimer from '../../components/tickets/SLATimer.jsx'
import {
    getTicketById, getTechniciansByCategory,
    assignTechnician, acceptTicket, updateTicketStatus,
    addComment, editComment, deleteComment,
} from '../../services/ticketService.js'
import { formatDateTime } from '../../utils/helpers.js'
import './TicketDetailPage.css'

const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}

const TIMELINE_STEPS = ['OPEN', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const STEP_LABEL = {
    OPEN: 'Open', PENDING: 'Pending', ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed',
}

function StatusTimeline({ status }) {
    const isRejected = status === 'REJECTED'
    // When REJECTED, ticket went OPEN→PENDING→REJECTED. Show OPEN+PENDING as completed.
    const effectiveIdx = isRejected ? 1 : TIMELINE_STEPS.indexOf(status)

    return (
        <div className="ticket-timeline">
            {TIMELINE_STEPS.map((step, idx) => {
                const completed = effectiveIdx > idx
                const current   = !isRejected && effectiveIdx === idx
                return (
                    <React.Fragment key={step}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 64 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: completed ? '#15803d' : current ? 'var(--primary)' : 'var(--gray100)',
                                border: `2px solid ${completed ? '#15803d' : current ? 'var(--primary)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: completed || current ? '#fff' : 'var(--text-muted)',
                                fontSize: 13, fontWeight: 700, transition: 'all 200ms',
                            }}>
                                {completed ? '✓' : idx + 1}
                            </div>
                            <span style={{
                                fontSize: 10, whiteSpace: 'nowrap', fontWeight: current ? 700 : 400,
                                color: completed ? '#15803d' : current ? 'var(--primary)' : 'var(--text-muted)',
                            }}>
                                {STEP_LABEL[step]}
                            </span>
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                            <div style={{
                                flex: 1, height: 2, minWidth: 16, alignSelf: 'flex-start', marginTop: 15,
                                background: completed ? '#86efac' : 'var(--border)',
                            }} />
                        )}
                    </React.Fragment>
                )
            })}
            {isRejected && (
                <>
                    <div style={{ width: 24, height: 2, background: '#fecaca', alignSelf: 'flex-start', marginTop: 15, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 64 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#fef2f2', border: '2px solid #fecaca',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#dc2626', fontSize: 14, fontWeight: 700,
                        }}>✕</div>
                        <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>Rejected</span>
                    </div>
                </>
            )}
        </div>
    )
}

export default function TicketDetailPage() {
    const { id }                     = useParams()
    const navigate                   = useNavigate()
    const { user, isAdmin, isTechnician } = useAuth()

    const [ticket,  setTicket]  = useState(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)
    const [toast,   setToast]   = useState(null)

    // ── Modal visibility ───────────────────────────────────────────────────
    const [showAssign,     setShowAssign]     = useState(false)
    const [showReject,     setShowReject]     = useState(false)
    const [showResolve,    setShowResolve]    = useState(false)
    const [showStartWork,  setShowStartWork]  = useState(false)
    const [showClose,      setShowClose]      = useState(false)

    // ── Modal data ─────────────────────────────────────────────────────────
    const [technicians,     setTechnicians]     = useState([])
    const [selectedTechId,  setSelectedTechId]  = useState('')
    const [rejectReason,    setRejectReason]    = useState('')
    const [resolveNotes,    setResolveNotes]    = useState('')
    const [modalLoading,    setModalLoading]    = useState(false)
    const [modalError,      setModalError]      = useState('')

    // ── Comments ───────────────────────────────────────────────────────────
    const [newComment,       setNewComment]       = useState('')
    const [addingComment,    setAddingComment]    = useState(false)
    const [editingId,        setEditingId]        = useState(null)
    const [editingContent,   setEditingContent]   = useState('')
    const [savingEdit,       setSavingEdit]       = useState(false)
    const [deletingId,       setDeletingId]       = useState(null)
    const [deletingLoading,  setDeletingLoading]  = useState(false)

    // ── Load ticket ────────────────────────────────────────────────────────
    const loadTicket = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            setTicket(await getTicketById(id))
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => { loadTicket() }, [loadTicket])

    // ── Fetch technicians when assign modal opens ───────────────────────────
    useEffect(() => {
        if (!showAssign || !ticket) return
        setTechnicians([]); setSelectedTechId(''); setModalError('')
        getTechniciansByCategory(ticket.category)
            .then(setTechnicians)
            .catch(e => setModalError(e.message))
    }, [showAssign, ticket])

    // ── Admin actions ──────────────────────────────────────────────────────
    const handleAssign = async () => {
        if (!selectedTechId) { setModalError('Select a technician.'); return }
        setModalLoading(true); setModalError('')
        try {
            await assignTechnician(id, selectedTechId)
            setShowAssign(false)
            setToast({ message: 'Technician assigned successfully.', type: 'success' })
            loadTicket()
        } catch (e) {
            setModalError(e.message)
        } finally {
            setModalLoading(false)
        }
    }

    const handleReject = async () => {
        if (rejectReason.trim().length < 10) { setModalError('Reason must be at least 10 characters.'); return }
        setModalLoading(true); setModalError('')
        try {
            await updateTicketStatus(id, { status: 'REJECTED', rejectionReason: rejectReason.trim() })
            setShowReject(false); setRejectReason('')
            setToast({ message: 'Ticket rejected.', type: 'info' })
            loadTicket()
        } catch (e) {
            setModalError(e.message)
        } finally {
            setModalLoading(false)
        }
    }

    const handleClose = async () => {
        setModalLoading(true); setModalError('')
        try {
            await updateTicketStatus(id, { status: 'CLOSED' })
            setShowClose(false)
            setToast({ message: 'Ticket closed.', type: 'success' })
            loadTicket()
        } catch (e) {
            setModalError(e.message)
        } finally {
            setModalLoading(false)
        }
    }

    // ── Technician actions ─────────────────────────────────────────────────
    const handleStartWork = async (markOutOfService) => {
        setModalLoading(true); setModalError('')
        try {
            await acceptTicket(id, markOutOfService)
            setShowStartWork(false)
            setToast({ message: 'Work started. Ticket is now In Progress.', type: 'success' })
            loadTicket()
        } catch (e) {
            setModalError(e.message)
        } finally {
            setModalLoading(false)
        }
    }

    const handleResolve = async () => {
        if (resolveNotes.trim().length < 20) { setModalError('Resolution notes must be at least 20 characters.'); return }
        setModalLoading(true); setModalError('')
        try {
            await updateTicketStatus(id, { status: 'RESOLVED', resolutionNotes: resolveNotes.trim() })
            setShowResolve(false); setResolveNotes('')
            setToast({ message: 'Ticket marked as resolved.', type: 'success' })
            loadTicket()
        } catch (e) {
            setModalError(e.message)
        } finally {
            setModalLoading(false)
        }
    }

    // ── Comments ───────────────────────────────────────────────────────────
    const handleAddComment = async () => {
        if (!newComment.trim()) return
        setAddingComment(true)
        try {
            await addComment(id, newComment.trim())
            setNewComment('')
            loadTicket()
        } catch (e) {
            setToast({ message: e.message, type: 'error' })
        } finally {
            setAddingComment(false)
        }
    }

    const handleSaveEdit = async (commentId) => {
        if (!editingContent.trim()) return
        setSavingEdit(true)
        try {
            await editComment(id, commentId, editingContent.trim())
            setEditingId(null); setEditingContent('')
            loadTicket()
        } catch (e) {
            setToast({ message: e.message, type: 'error' })
        } finally {
            setSavingEdit(false)
        }
    }

    const handleDeleteComment = async (commentId) => {
        setDeletingLoading(true)
        try {
            await deleteComment(id, commentId)
            setDeletingId(null)
            loadTicket()
        } catch (e) {
            setToast({ message: e.message, type: 'error' })
        } finally {
            setDeletingLoading(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────
    if (loading) return <div style={{ padding: 48 }}><Spinner /></div>
    if (error)   return (
        <div style={{ padding: 48 }}>
            <EmptyState icon="⚠️" title="Failed to load ticket" desc={error} />
        </div>
    )
    if (!ticket) return null

    const loc = ticket.resourceName || ticket.locationText || '—'
    const isAssignedTech = isTechnician && ticket.assignedTechnicianId === user?.userId
    const canAdminAct = isAdmin && ['OPEN','PENDING'].includes(ticket.status)

    return (
        <div className="ticket-detail-page">
            {/* Back */}
            <button className="ticket-detail-back" onClick={() => navigate(-1)}>
                ← Back
            </button>

            {/* Title row */}
            <div className="ticket-detail-title-row">
                <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
                        #{ticket.ticketId?.slice(0, 8).toUpperCase()}
                    </p>
                    <h1>{CATEGORY_LABEL[ticket.category] || ticket.category} Issue — {loc}</h1>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                </div>
            </div>

            {/* Status timeline */}
            <StatusTimeline status={ticket.status} />

            {/* Admin action buttons */}
            {(canAdminAct || (isAdmin && ticket.status === 'RESOLVED')) && (
                <div className="ticket-actions-row">
                    {canAdminAct && (
                        <>
                            <Btn onClick={() => { setModalError(''); setShowAssign(true) }}>
                                👤 Assign Technician
                            </Btn>
                            <Btn variant="danger" onClick={() => { setModalError(''); setRejectReason(''); setShowReject(true) }}>
                                ✕ Reject
                            </Btn>
                        </>
                    )}
                    {isAdmin && ticket.status === 'RESOLVED' && (
                        <Btn variant="success" onClick={() => { setModalError(''); setShowClose(true) }}>
                            ✓ Close Ticket
                        </Btn>
                    )}
                </div>
            )}

            {/* Technician action buttons */}
            {isAssignedTech && (
                <div className="ticket-actions-row">
                    {ticket.status === 'ASSIGNED' && (
                        <Btn onClick={() => { setModalError(''); setShowStartWork(true) }}>
                            ▶ Start Work
                        </Btn>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                        <Btn variant="success" onClick={() => { setModalError(''); setResolveNotes(''); setShowResolve(true) }}>
                            ✓ Mark Resolved
                        </Btn>
                    )}
                </div>
            )}

            {/* Info grid */}
            <div className="ticket-info-grid">
                {[
                    ['Category',    CATEGORY_LABEL[ticket.category] || ticket.category],
                    ['Priority',    ticket.priority],
                    ['Location',    loc],
                    ['Reported by', ticket.reportedByName || '—'],
                    ['Contact',     ticket.contactDetails || '—'],
                    ['Assigned to', ticket.assignedTechnicianName || 'Unassigned'],
                    ['Submitted',   formatDateTime(ticket.createdAt)],
                    ['Last updated',formatDateTime(ticket.updatedAt)],
                ].map(([label, value]) => (
                    <div key={label} className="ticket-info-item">
                        <p className="ticket-info-label">{label}</p>
                        <p className="ticket-info-value">{value}</p>
                    </div>
                ))}
            </div>

            {/* Description */}
            <div className="ticket-panel">
                <p className="ticket-panel-title">Description</p>
                <p className="ticket-description">{ticket.description}</p>
            </div>

            {/* SLA Timer */}
            <div className="ticket-panel">
                <p className="ticket-panel-title">⏱ SLA Timers</p>
                <SLATimer
                    createdAt={ticket.createdAt}
                    assignedAt={ticket.assignedAt}
                    acceptedAt={ticket.acceptedAt}
                    resolvedAt={ticket.resolvedAt}
                />
            </div>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
                <div className="ticket-panel">
                    <p className="ticket-panel-title">📎 Attachments</p>
                    <div className="ticket-attachments">
                        {ticket.attachments.map(att => (
                            <a key={att.attachmentId} href={att.imageUrl} target="_blank" rel="noreferrer">
                                <img src={att.imageUrl} alt="attachment" className="ticket-attachment-thumb" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Rejection reason */}
            {ticket.rejectionReason && (
                <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-lg)', marginBottom: 24 }}>
                    <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>Rejection reason</p>
                    <p style={{ fontSize: 14, color: '#dc2626' }}>{ticket.rejectionReason}</p>
                </div>
            )}

            {/* Resolution notes */}
            {ticket.resolutionNotes && (
                <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r-lg)', marginBottom: 24 }}>
                    <p style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4 }}>Resolution notes</p>
                    <p style={{ fontSize: 14, color: '#15803d' }}>{ticket.resolutionNotes}</p>
                </div>
            )}

            {/* Comments */}
            <div className="ticket-panel">
                <p className="ticket-panel-title">💬 Comments ({ticket.comments?.length ?? 0})</p>

                {ticket.comments?.length > 0 && (
                    <div className="comment-list">
                        {ticket.comments.map(c => (
                            <div key={c.commentId} className="comment-item">
                                <Avatar name={c.authorName || '?'} size={32} />
                                <div className="comment-body">
                                    <div className="comment-meta">
                                        <span className="comment-author">{c.authorName}</span>
                                        <span className="comment-date">{formatDateTime(c.createdAt)}</span>
                                        {c.authorId === user?.userId && editingId !== c.commentId && deletingId !== c.commentId && (
                                            <div className="comment-actions">
                                                <button
                                                    className="comment-icon-btn"
                                                    title="Edit"
                                                    onClick={() => { setEditingId(c.commentId); setEditingContent(c.content) }}
                                                >✏️</button>
                                                <button
                                                    className="comment-icon-btn danger"
                                                    title="Delete"
                                                    onClick={() => setDeletingId(c.commentId)}
                                                >🗑</button>
                                            </div>
                                        )}
                                    </div>

                                    {editingId === c.commentId ? (
                                        <>
                                            <textarea
                                                className="modal-textarea"
                                                value={editingContent}
                                                onChange={e => setEditingContent(e.target.value)}
                                                rows={3}
                                                style={{ marginBottom: 8 }}
                                            />
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Btn size="sm" loading={savingEdit} disabled={!editingContent.trim()} onClick={() => handleSaveEdit(c.commentId)}>
                                                    Save
                                                </Btn>
                                                <Btn size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditingContent('') }}>
                                                    Cancel
                                                </Btn>
                                            </div>
                                        </>
                                    ) : deletingId === c.commentId ? (
                                        <div className="comment-delete-confirm">
                                            <span>Delete this comment?</span>
                                            <Btn size="sm" variant="danger" loading={deletingLoading} onClick={() => handleDeleteComment(c.commentId)}>
                                                Delete
                                            </Btn>
                                            <Btn size="sm" variant="secondary" onClick={() => setDeletingId(null)}>Cancel</Btn>
                                        </div>
                                    ) : (
                                        <p className="comment-content">{c.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add comment */}
                {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                    <div className="add-comment-form">
                        <textarea
                            placeholder="Add a comment…"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            rows={3}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Btn size="sm" loading={addingComment} disabled={!newComment.trim()} onClick={handleAddComment}>
                                Post comment
                            </Btn>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Assign Technician Modal ── */}
            <Modal open={showAssign} onClose={() => setShowAssign(false)} title="👤 Assign Technician" width={480}>
                <div className="modal-field">
                    <label>Technician</label>
                    {technicians.length === 0
                        ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No available technicians for this category.</p>
                        : (
                            <select className="modal-select" value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)}>
                                <option value="">— Select technician —</option>
                                {technicians.map(t => (
                                    <option key={t.userId} value={t.userId}>{t.name} ({t.email})</option>
                                ))}
                            </select>
                        )
                    }
                </div>
                {modalError && <div className="modal-error">{modalError}</div>}
                <div className="modal-actions">
                    <Btn variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Btn>
                    <Btn loading={modalLoading} disabled={!selectedTechId} onClick={handleAssign}>Assign</Btn>
                </div>
            </Modal>

            {/* ── Reject Modal ── */}
            <Modal open={showReject} onClose={() => setShowReject(false)} title="✕ Reject Ticket" width={480}>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 14, lineHeight: 1.5 }}>
                    Provide a reason for rejecting this ticket. The reporter will see this reason.
                </p>
                <div className="modal-field">
                    <label>Rejection Reason <span style={{ color: '#dc2626' }}>*</span> (min 10 chars)</label>
                    <textarea
                        className="modal-textarea"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Explain why this ticket is being rejected…"
                        rows={4}
                    />
                </div>
                {modalError && <div className="modal-error">{modalError}</div>}
                <div className="modal-actions">
                    <Btn variant="secondary" onClick={() => setShowReject(false)}>Cancel</Btn>
                    <Btn variant="danger" loading={modalLoading} disabled={rejectReason.trim().length < 10} onClick={handleReject}>
                        Confirm Rejection
                    </Btn>
                </div>
            </Modal>

            {/* ── Close Ticket Modal ── */}
            <Modal open={showClose} onClose={() => setShowClose(false)} title="✓ Close Ticket" width={440}>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
                    Close ticket <strong>#{ticket.ticketId?.slice(0, 8).toUpperCase()}</strong>?
                    This marks the issue as fully resolved and archived.
                </p>
                {modalError && <div className="modal-error">{modalError}</div>}
                <div className="modal-actions">
                    <Btn variant="secondary" onClick={() => setShowClose(false)}>Cancel</Btn>
                    <Btn variant="success" loading={modalLoading} onClick={handleClose}>Close Ticket</Btn>
                </div>
            </Modal>

            {/* ── Start Work Modal ── */}
            <Modal open={showStartWork} onClose={() => setShowStartWork(false)} title="▶ Start Work" width={460}>
                {ticket.resourceId ? (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.6 }}>
                            Do you want to mark <strong>{ticket.resourceName}</strong> as <strong>OUT OF SERVICE</strong> while you work on it?
                        </p>
                        {modalError && <div className="modal-error">{modalError}</div>}
                        <div className="modal-actions">
                            <Btn variant="secondary" onClick={() => setShowStartWork(false)}>Cancel</Btn>
                            <Btn variant="secondary" loading={modalLoading} onClick={() => handleStartWork(false)}>
                                No, keep it active
                            </Btn>
                            <Btn variant="danger" loading={modalLoading} onClick={() => handleStartWork(true)}>
                                Yes, mark Out of Service
                            </Btn>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.6 }}>
                            Accept this repair task and start working on it?
                        </p>
                        {modalError && <div className="modal-error">{modalError}</div>}
                        <div className="modal-actions">
                            <Btn variant="secondary" onClick={() => setShowStartWork(false)}>Cancel</Btn>
                            <Btn loading={modalLoading} onClick={() => handleStartWork(false)}>Confirm</Btn>
                        </div>
                    </>
                )}
            </Modal>

            {/* ── Resolve Modal ── */}
            <Modal open={showResolve} onClose={() => setShowResolve(false)} title="✓ Mark Resolved" width={500}>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 14, lineHeight: 1.5 }}>
                    Describe how the issue was resolved. The resource will automatically go back to <strong>ACTIVE</strong>.
                </p>
                <div className="modal-field">
                    <label>Resolution Notes <span style={{ color: '#dc2626' }}>*</span> (min 20 chars)</label>
                    <textarea
                        className="modal-textarea"
                        value={resolveNotes}
                        onChange={e => setResolveNotes(e.target.value)}
                        placeholder="Describe what was done to fix the issue…"
                        rows={4}
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {resolveNotes.trim().length}/20 minimum
                    </p>
                </div>
                {modalError && <div className="modal-error">{modalError}</div>}
                <div className="modal-actions">
                    <Btn variant="secondary" onClick={() => setShowResolve(false)}>Cancel</Btn>
                    <Btn variant="success" loading={modalLoading} disabled={resolveNotes.trim().length < 20} onClick={handleResolve}>
                        Mark as Resolved
                    </Btn>
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
