// src/pages/MyBookingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { bookingApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { StatusBadge, Spinner, EmptyState, Btn, Modal, Textarea, Toast } from '../components/ui/index.jsx'
import { formatDate, formatTimeRange, isUpcoming } from '../utils/helpers.js'

/* ── Booking card ────────────────────────────────────────────────────────── */
function BookingCard({ booking, onCancel }) {
    const upcoming = isUpcoming(booking.bookingDate)
    const canCancel = upcoming && (booking.status === 'PENDING' || booking.status === 'IN_REVIEW')

    return (
        <div className="scale-in" style={{
            background: 'var(--white)', borderRadius: 14,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        {booking.resourceName}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-sec)' }}>
                        {formatDate(booking.bookingDate)} · {formatTimeRange(booking.startTime, booking.endTime)}
                    </p>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Purpose */}
            <p style={{ fontSize: 14, color: 'var(--text-sec)', fontStyle: 'italic' }}>
                "{booking.purpose}"
            </p>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {booking.expectedAttendees && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        👥 {booking.expectedAttendees} attendees
                    </p>
                )}
                {booking.isPriority && (
                    <p style={{ fontSize: 13, color: '#d97706' }}>⚡ Priority</p>
                )}
            </div>

            {/* Reason boxes */}
            {booking.rejectionReason && (
                <div style={{
                    marginTop: 4, padding: '10px 14px', background: '#fef2f2',
                    border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626',
                }}>
                    Rejection reason: {booking.rejectionReason}
                </div>
            )}
            {booking.cancellationReason && (
                <div style={{
                    marginTop: 4, padding: '10px 14px', background: 'var(--gray50)',
                    border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)',
                    display: 'flex', gap: 6, alignItems: 'flex-start',
                }}>
                    <span>ℹ️</span> {booking.cancellationReason}
                </div>
            )}

            {/* Cancel button */}
            {canCancel && (
                <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <Btn variant="danger" size="sm" onClick={() => onCancel(booking)}>
                        Cancel booking
                    </Btn>
                </div>
            )}
        </div>
    )
}

/* ── Cancel modal ────────────────────────────────────────────────────────── */
function CancelModal({ booking, userId, onClose, onDone }) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')

    const submit = async () => {
        setLoading(true)
        try {
            await bookingApi.cancel(booking.bookingId, reason || null, userId, 'USER')
            onDone()
        } catch (e) {
            setErr(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open onClose={onClose} title="Cancel Booking" width={480}>
            <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 16, lineHeight: 1.6 }}>
                Cancel your booking for <strong>{booking.resourceName}</strong> on {formatDate(booking.bookingDate)}?
                The slot will be freed for others immediately.
            </p>
            <Textarea label="Reason (optional)" rows={3} value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Let us know why you're cancelling…" />
            {err && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 8 }}>{err}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <Btn variant="secondary" onClick={onClose}>Keep booking</Btn>
                <Btn variant="danger" loading={loading} onClick={submit}>Yes, cancel it</Btn>
            </div>
        </Modal>
    )
}

/* ── Section label ───────────────────────────────────────────────────────── */
function SectionLabel({ title, count, accent }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, whiteSpace: 'nowrap' }}>
                {title}
            </h2>
            <span style={{
                fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 999,
                background: accent === 'green' ? 'var(--g50)' : 'var(--gray100)',
                color: accent === 'green' ? 'var(--g700)' : 'var(--text-muted)',
                border: `1px solid ${accent === 'green' ? 'var(--g200)' : 'var(--border)'}`,
            }}>{count}</span>
            <div style={{
                flex: 1, height: 2,
                background: `linear-gradient(90deg, ${accent === 'green' ? 'var(--g300)' : 'var(--gray300)'}, transparent)`,
                borderRadius: 2,
            }} />
        </div>
    )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function MyBookingsPage() {
    const { currentUser } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [toast, setToast] = useState(null)

    const load = useCallback(() => {
        setLoading(true)
        bookingApi.getMyBookings(currentUser.id)
            .then(data => setBookings(Array.isArray(data) ? data : []))
            .catch(e => { setError(e.message); setBookings([]) })
            .finally(() => setLoading(false))
    }, [currentUser.id])

    useEffect(() => { load() }, [load])

    const upcoming = bookings.filter(b =>
        isUpcoming(b.bookingDate) &&
        (b.status === 'PENDING' || b.status === 'IN_REVIEW' || b.status === 'APPROVED')
    )
    const history = bookings.filter(b => !upcoming.includes(b))

    if (loading) return <div style={{ padding: 48 }}><Spinner /></div>

    return (
        <div style={{ padding: '36px 44px' }}>
            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, lineHeight: 1.2 }}>
                    My Bookings
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                    Track and manage your facility and equipment requests
                </p>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
                    {error}
                </div>
            )}

            {/* ── Upcoming ──────────────────────────────────────────── */}
            <section style={{ marginBottom: 48 }}>
                <SectionLabel title="Upcoming" count={upcoming.length} accent="green" />
                {upcoming.length === 0 ? (
                    <EmptyState icon="📅" title="No upcoming bookings"
                        desc="Go to Resources to make a new booking request." />
                ) : (
                    <div className="stagger" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 20,
                    }}>
                        {upcoming.map(b => (
                            <BookingCard key={b.bookingId} booking={b} onCancel={setCancelTarget} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── History ───────────────────────────────────────────── */}
            <section>
                <SectionLabel title="History" count={history.length} accent="gray" />
                {history.length === 0 ? (
                    <EmptyState icon="📂" title="No booking history yet"
                        desc="Your past and completed bookings will appear here." />
                ) : (
                    <div className="stagger" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 20,
                    }}>
                        {history.map(b => (
                            <BookingCard key={b.bookingId} booking={b} onCancel={setCancelTarget} />
                        ))}
                    </div>
                )}
            </section>

            {cancelTarget && (
                <CancelModal
                    booking={cancelTarget} userId={currentUser.id}
                    onClose={() => setCancelTarget(null)}
                    onDone={() => {
                        setCancelTarget(null)
                        load()
                        setToast({ message: 'Booking cancelled. The slot is now free.', type: 'info' })
                    }}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}