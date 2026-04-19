// src/pages/AdminBookingsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { bookingApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
    Card, StatusBadge, Spinner, EmptyState, SectionHeading,
    Btn, Modal, Textarea, Avatar, Toast,
} from '../components/ui/index.jsx'
import { formatDate, formatTimeRange, formatDateTime } from '../utils/helpers.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon }) {
    return (
        <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '18px 22px', flex: 1, minWidth: 130,
            boxShadow: 'var(--shadow-xs)',
        }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon} {label}
            </p>
            <p style={{ fontSize: 30, fontWeight: 700, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {value ?? '—'}
            </p>
        </div>
    )
}

/* ── Peak chart ──────────────────────────────────────────────────────────── */
function PeakChart({ data }) {
    if (!data.length) return null
    const max = Math.max(...data.map(d => d.count), 1)
    const chartData = data
        .filter(d => d.hour >= 7 && d.hour <= 22)
        .map(d => ({
            label: d.hour < 12 ? `${d.hour}am` : d.hour === 12 ? '12pm' : `${d.hour - 12}pm`,
            count: d.count,
            fill: d.count / max > 0.65 ? '#e55a3c' : d.count / max > 0.35 ? '#d97706' : '#3aa068',
        }))
    return (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 28px', boxShadow: 'var(--shadow-xs)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 18 }}>Peak booking hours</p>
            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={22} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--gray500)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--gray400)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)' }} formatter={v => [v, 'Bookings']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                Approved bookings per hour · 7 AM – 10 PM
            </p>
        </div>
    )
}

/* ── Admin booking card ──────────────────────────────────────────────────── */
function AdminBookingCard({ booking, onClick }) {
    const pending = booking.status === 'PENDING'
    const review = booking.status === 'IN_REVIEW'
    const accent = pending ? '#d97706' : review ? '#7c3aed' : 'transparent'

    return (
        <Card onClick={() => onClick(booking)} style={{
            padding: '18px 20px', cursor: 'pointer',
            borderLeft: `3px solid ${pending || review ? accent : 'transparent'}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={booking.userName} size={36} />
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{booking.resourceName}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{booking.userName}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(pending || review) && <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
                    <StatusBadge status={booking.status} />
                </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 4 }}>
                {formatDate(booking.bookingDate)} · {formatTimeRange(booking.startTime, booking.endTime)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', fontStyle: 'italic', marginBottom: 4 }}>
                "{booking.purpose}"
            </p>
            {booking.expectedAttendees && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {booking.expectedAttendees} attendees</p>
            )}
            {booking.isPriority && <p style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>⚡ Priority</p>}
            {(pending || review) && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>Click to review →</span>
                </div>
            )}
        </Card>
    )
}

/* ════════════════════════════════════════════════════════════════════════════
   BOOKING DETAIL MODAL
   
   Flow:
   • PENDING  → opening the modal auto-calls markInReview → status becomes IN_REVIEW
               → shows Approve + Reject buttons immediately
   • IN_REVIEW → shows Approve + Reject buttons
   • APPROVED  → shows Cancel button
   • REJECTED / CANCELLED → read-only
   ════════════════════════════════════════════════════════════════════════════ */
function BookingDetailModal({ booking: initialBooking, adminId, onClose, onRefresh }) {
    const [booking, setBooking] = useState(initialBooking)
    const [rejectReason, setRejectReason] = useState('')
    const [cancelReason, setCancelReason] = useState('')
    const [step, setStep] = useState('main')   // 'main' | 'reject' | 'cancel'
    const [loading, setLoading] = useState(false)
    const [transitioning, setTransitioning] = useState(false)
    const [err, setErr] = useState('')

    // ── Auto-mark IN_REVIEW when a PENDING booking is opened ──────────────
    useEffect(() => {
        if (initialBooking.status !== 'PENDING') return
        setTransitioning(true)
        bookingApi.markInReview(initialBooking.bookingId, adminId)
            .then(updated => {
                setBooking(updated)
                onRefresh() // update the background list too
            })
            .catch(e => setErr('Could not mark as In Review: ' + e.message))
            .finally(() => setTransitioning(false))
    }, []) // only on mount

    // Close on Escape
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onClose])

    const act = async (fn) => {
        setLoading(true); setErr('')
        try {
            const updated = await fn()
            setBooking(updated)   // update local state immediately
            onRefresh()           // refresh background list
            onClose()             // close modal
        } catch (e) {
            setErr(e.message)
        } finally {
            setLoading(false)
        }
    }

    const isReview = booking.status === 'IN_REVIEW'
    const isApproved = booking.status === 'APPROVED'
    const isTerminal = booking.status === 'REJECTED' || booking.status === 'CANCELLED'

    return (
        <div
            className="fade-in"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.4)',
                backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1000, padding: 24,
            }}
        >
            <div className="scale-in" style={{
                background: 'var(--white)', borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 560,
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                {/* Title bar with X */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>Booking Details</h2>
                    <button onClick={onClose} style={{
                        width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--border)',
                        background: 'var(--white)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--text-muted)',
                        transition: 'all 150ms',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >✕</button>
                </div>

                <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Transitioning banner */}
                    {transitioning && (
                        <div style={{ padding: '10px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--r-md)', fontSize: 13, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 14, height: 14, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                            Marking as In Review…
                        </div>
                    )}

                    {/* Header row */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, background: 'var(--gray50)', borderRadius: 'var(--r-md)' }}>
                        <Avatar name={booking.userName} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 16, fontWeight: 600 }}>{booking.resourceName}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>{booking.userName} · {booking.userEmail}</p>
                        </div>
                        <StatusBadge status={booking.status} />
                    </div>

                    {/* Detail grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            ['Date', formatDate(booking.bookingDate)],
                            ['Time', formatTimeRange(booking.startTime, booking.endTime)],
                            ['Floor', booking.resourceFloor || '—'],
                            ['Capacity', booking.resourceCapacity ?? 'N/A'],
                            ['Attendees', booking.expectedAttendees ?? '—'],
                            ['Priority', booking.isPriority ? '⚡ Yes' : 'No'],
                        ].map(([k, v]) => (
                            <div key={k} style={{ padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>{k}</p>
                                <p style={{ fontSize: 14, fontWeight: 500 }}>{v}</p>
                            </div>
                        ))}
                    </div>

                    {/* Purpose */}
                    <div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>Purpose</p>
                        <p style={{ fontSize: 14, color: 'var(--text)', background: 'var(--gray50)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}>
                            {booking.purpose}
                        </p>
                    </div>

                    {/* Priority reason */}
                    {booking.isPriority && booking.priorityReason && (
                        <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--r-md)' }}>
                            <p style={{ fontSize: 12, color: '#92400e', fontWeight: 500, marginBottom: 3 }}>⚡ Priority reason</p>
                            <p style={{ fontSize: 13, color: '#92400e' }}>{booking.priorityReason}</p>
                        </div>
                    )}

                    {/* Reviewed by */}
                    {booking.reviewedByName && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Reviewed by {booking.reviewedByName} · {formatDateTime(booking.reviewedAt)}
                        </p>
                    )}

                    {/* Rejection reason */}
                    {booking.rejectionReason && (
                        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-md)' }}>
                            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginBottom: 3 }}>Rejection reason</p>
                            <p style={{ fontSize: 13, color: '#dc2626' }}>{booking.rejectionReason}</p>
                        </div>
                    )}

                    {/* Cancellation reason */}
                    {booking.cancellationReason && (
                        <div style={{ padding: '10px 14px', background: 'var(--gray50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>Cancellation reason</p>
                            <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>{booking.cancellationReason}</p>
                        </div>
                    )}

                    {err && (
                        <p style={{ color: '#dc2626', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 'var(--r-md)', border: '1px solid #fecaca' }}>
                            {err}
                        </p>
                    )}

                    {/* ── Action buttons ─────────────────────────────────── */}
                    {step === 'main' && isReview && !transitioning && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Btn variant="success" loading={loading} style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => act(() => bookingApi.approve(booking.bookingId, adminId))}>
                                ✓ Approve
                            </Btn>
                            <Btn variant="danger" style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => setStep('reject')}>
                                ✕ Reject
                            </Btn>
                        </div>
                    )}

                    {step === 'main' && isApproved && (
                        <Btn variant="danger" onClick={() => setStep('cancel')}>
                            Cancel this booking
                        </Btn>
                    )}

                    {step === 'reject' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Textarea label="Rejection reason *" rows={3} value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Explain why this booking is being rejected…" />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Btn variant="secondary" onClick={() => setStep('main')}>← Back</Btn>
                                <Btn variant="danger" loading={loading} disabled={!rejectReason.trim()}
                                    onClick={() => act(() => bookingApi.reject(booking.bookingId, rejectReason, adminId))}>
                                    Confirm Rejection
                                </Btn>
                            </div>
                        </div>
                    )}

                    {step === 'cancel' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Textarea label="Cancellation reason *" rows={3} value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Reason for administrative cancellation…" />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Btn variant="secondary" onClick={() => setStep('main')}>← Back</Btn>
                                <Btn variant="danger" loading={loading} disabled={!cancelReason.trim()}
                                    onClick={() => act(() => bookingApi.cancel(booking.bookingId, cancelReason, adminId, 'ADMIN'))}>
                                    Confirm Cancellation
                                </Btn>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
const TABS = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'IN_REVIEW', label: 'In Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'ALL', label: 'All' },
]

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AdminBookingsPage() {
    const { currentUser } = useAuth()
    const [grouped, setGrouped] = useState([])
    const [stats, setStats] = useState(null)
    const [peakHours, setPeakHours] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('PENDING')
    const [search, setSearch] = useState('')
    const [detail, setDetail] = useState(null)
    const [toast, setToast] = useState(null)

    const load = useCallback(() => {
        setLoading(true)
        Promise.all([
            bookingApi.getAll(currentUser.id),
            bookingApi.getStats(currentUser.id),
            bookingApi.getPeakHours(currentUser.id),
        ])
            .then(([g, s, ph]) => {
                setGrouped(Array.isArray(g) ? g : [])
                setStats(s)
                setPeakHours(Array.isArray(ph) ? ph : [])
            })
            .catch(e => { console.error(e); setGrouped([]); setPeakHours([]) })
            .finally(() => setLoading(false))
    }, [currentUser.id])

    useEffect(() => { load() }, [load])

    const allBookings = useMemo(() => (Array.isArray(grouped) ? grouped : []).flatMap(g => g.bookings || []), [grouped])

    const filtered = useMemo(() =>
        allBookings.filter(b => {
            const matchTab = tab === 'ALL' || b.status === tab
            const matchSearch = !search ||
                b.resourceName?.toLowerCase().includes(search.toLowerCase()) ||
                b.userName?.toLowerCase().includes(search.toLowerCase()) ||
                b.purpose?.toLowerCase().includes(search.toLowerCase())
            return matchTab && matchSearch
        }),
        [allBookings, tab, search])

    return (
        <div style={{ padding: '36px 44px' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, lineHeight: 1.2 }}>Bookings</h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Review, approve, and manage all campus booking requests</p>
            </div>

            {/* Analytics */}
            {stats && (
                <section style={{ marginBottom: 40 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                        Booking Analytics
                    </p>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                        <StatCard label="Pending" value={stats.pending} color="#d97706" icon="⏳" />
                        <StatCard label="In Review" value={stats.inReview} color="#7c3aed" icon="🔍" />
                        <StatCard label="Approved Today" value={stats.approvedToday} color="var(--primary)" icon="✅" />
                        <StatCard label="Total Approved" value={stats.totalApproved} color="var(--g700)" icon="📈" />
                        <StatCard label="Rejected" value={stats.rejected} color="#dc2626" icon="✕" />
                        <StatCard label="Cancelled" value={stats.cancelled} color="var(--gray500)" icon="🗑️" />
                    </div>
                    <PeakChart data={peakHours} />
                </section>
            )}

            {/* Booking list */}
            <section>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                    All Bookings
                </p>

                {/* Tabs + search */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', flexShrink: 0 }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: '9px 16px', border: 'none', borderRight: '1px solid var(--border)',
                                background: tab === t.key ? 'var(--primary)' : 'transparent',
                                color: tab === t.key ? '#fff' : 'var(--text-sec)',
                                fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                                cursor: 'pointer', fontFamily: 'var(--font-body)',
                                transition: 'all 150ms var(--ease)',
                            }}>{t.label}</button>
                        ))}
                    </div>
                    <input placeholder="Search by resource, user, or purpose…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: '9px 16px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                            fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                            background: 'var(--white)', marginLeft: 'auto', width: 280,
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>

                {loading && <Spinner />}
                {!loading && filtered.length === 0 && (
                    <EmptyState icon="📭" title="No bookings found" desc="Try a different tab or search term." />
                )}
                {!loading && filtered.length > 0 && (
                    <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                        {filtered.map(b => (
                            <AdminBookingCard key={b.bookingId} booking={b} onClick={setDetail} />
                        ))}
                    </div>
                )}
            </section>

            {/* Detail modal — rendered outside the list so it can update booking state independently */}
            {detail && (
                <BookingDetailModal
                    booking={detail}
                    adminId={currentUser.id}
                    onClose={() => setDetail(null)}
                    onRefresh={() => {
                        load()
                        setToast({ message: 'Booking updated successfully.', type: 'success' })
                    }}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}