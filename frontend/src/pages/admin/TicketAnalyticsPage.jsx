// src/pages/admin/TicketAnalyticsPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Spinner, EmptyState } from '../../components/ui/index.jsx'
import { getAllTickets } from '../../services/ticketService.js'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'
import './TicketAnalyticsPage.css'

const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}
const PRIORITY_COLORS = { CRITICAL: '#dc2626', HIGH: '#c2410c', MEDIUM: '#d97706', LOW: '#15803d' }

function fmtMinutes(mins) {
    if (!mins && mins !== 0) return '—'
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function slaColor(mins) {
    if (!mins && mins !== 0) return 'var(--text-muted)'
    if (mins < 120) return '#15803d'
    if (mins < 240) return '#d97706'
    return '#dc2626'
}

function StatCard({ label, value, color, icon }) {
    return (
        <div className="analytics-stat-card">
            <p className="analytics-stat-label">{icon} {label}</p>
            <p className="analytics-stat-value" style={{ color }}>{value ?? '—'}</p>
        </div>
    )
}

function SLACard({ title, value, sub, mins }) {
    return (
        <div className="analytics-sla-card">
            <p className="analytics-sla-title">{title}</p>
            <p className="analytics-sla-value" style={{ color: slaColor(mins) }}>{value}</p>
            {sub && <p className="analytics-sla-sub">{sub}</p>}
        </div>
    )
}

const DATE_RANGES = ['This Week', 'This Month', 'All Time']

export default function TicketAnalyticsPage() {
    const [tickets,  setTickets]  = useState([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    const [range,    setRange]    = useState('This Month')

    const load = useCallback(() => {
        setLoading(true); setError(null)
        getAllTickets()
            .then(data => setTickets(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    // ── Date range filter ───────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (range === 'All Time') return tickets
        const now = new Date()
        if (range === 'This Week') {
            const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7)
            return tickets.filter(t => new Date(t.createdAt) >= cutoff)
        }
        // This Month
        const cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
        return tickets.filter(t => new Date(t.createdAt) >= cutoff)
    }, [tickets, range])

    // ── Summary counts ──────────────────────────────────────────────────────
    const total       = filtered.length
    const openPending = filtered.filter(t => ['OPEN','PENDING'].includes(t.status)).length
    const inProgress  = filtered.filter(t => t.status === 'IN_PROGRESS').length
    const resolved    = filtered.filter(t => t.status === 'RESOLVED').length

    // ── SLA metrics ─────────────────────────────────────────────────────────
    const withResponse = filtered.filter(t => t.assignedAt && t.createdAt)
    const avgResponseMins = withResponse.length
        ? withResponse.reduce((s, t) => s + (new Date(t.assignedAt) - new Date(t.createdAt)), 0) / withResponse.length / 60000
        : null

    const withWork = filtered.filter(t => t.resolvedAt && t.acceptedAt)
    const avgWorkMins = withWork.length
        ? withWork.reduce((s, t) => s + (new Date(t.resolvedAt) - new Date(t.acceptedAt)), 0) / withWork.length / 60000
        : null

    const withResourceWork = filtered.filter(t => t.resourceId && t.resolvedAt && t.acceptedAt)
    const avgDowntimeMins = withResourceWork.length
        ? withResourceWork.reduce((s, t) => s + (new Date(t.resolvedAt) - new Date(t.acceptedAt)), 0) / withResourceWork.length / 60000
        : null

    const slaBreach = withResponse.filter(t => (new Date(t.assignedAt) - new Date(t.createdAt)) > 4 * 3600000).length

    // ── Per-resource downtime ───────────────────────────────────────────────
    const resourceDowntime = useMemo(() => {
        const map = {}
        withResourceWork.forEach(t => {
            const key = t.resourceName || t.resourceId
            if (!map[key]) map[key] = { name: key, totalMins: 0, count: 0 }
            map[key].totalMins += (new Date(t.resolvedAt) - new Date(t.acceptedAt)) / 60000
            map[key].count++
        })
        return Object.values(map)
            .map(r => ({ ...r, avgMins: r.totalMins / r.count }))
            .sort((a, b) => b.avgMins - a.avgMins)
            .slice(0, 5)
    }, [withResourceWork])

    // ── Chart data ──────────────────────────────────────────────────────────
    const byCategory = useMemo(() => {
        const map = {}
        filtered.forEach(t => { map[t.category] = (map[t.category] || 0) + 1 })
        return Object.entries(map).map(([k, v]) => ({ name: CATEGORY_LABEL[k] || k, count: v }))
    }, [filtered])

    const byPriority = useMemo(() => {
        const map = {}
        filtered.forEach(t => { map[t.priority] = (map[t.priority] || 0) + 1 })
        return Object.entries(map).map(([k, v]) => ({ name: k, value: v, fill: PRIORITY_COLORS[k] || '#6b7280' }))
    }, [filtered])

    const byStatus = useMemo(() => {
        const map = {}
        filtered.forEach(t => { map[t.status] = (map[t.status] || 0) + 1 })
        return Object.entries(map).map(([k, v]) => ({ name: k.replace('_',' '), count: v }))
    }, [filtered])

    const topResources = useMemo(() => {
        const map = {}
        filtered.filter(t => t.resourceName).forEach(t => {
            map[t.resourceName] = (map[t.resourceName] || 0) + 1
        })
        return Object.entries(map)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
    }, [filtered])

    const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-body)' }

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <h1>📊 Ticket Analytics</h1>
                <p>Campus maintenance and incident performance metrics</p>
            </div>

            {/* Date range tabs */}
            <div className="analytics-date-tabs">
                {DATE_RANGES.map(r => (
                    <button key={r} className={`analytics-date-tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>
                        {r}
                    </button>
                ))}
            </div>

            {loading && <Spinner />}
            {!loading && error && <EmptyState icon="⚠️" title="Failed to load data" desc={error} />}

            {!loading && !error && (
                <>
                    {/* Summary cards */}
                    <p className="analytics-section-label">Summary</p>
                    <div className="analytics-stat-row">
                        <StatCard label="Total Tickets"    value={total}       color="var(--primary)" icon="🎫" />
                        <StatCard label="Awaiting Action"  value={openPending} color="#d97706"         icon="⏳" />
                        <StatCard label="In Progress"      value={inProgress}  color="#c2410c"         icon="🔧" />
                        <StatCard label="Resolved"         value={resolved}    color="#15803d"         icon="✅" />
                    </div>

                    {/* SLA metrics */}
                    <p className="analytics-section-label">SLA Performance</p>
                    <div className="analytics-sla-grid" style={{ marginBottom: 36 }}>
                        <SLACard
                            title="Avg Response Time"
                            value={fmtMinutes(avgResponseMins)}
                            sub={`Across ${withResponse.length} tickets`}
                            mins={avgResponseMins}
                        />
                        <SLACard
                            title="Avg Resolution Time"
                            value={fmtMinutes(avgWorkMins)}
                            sub={`Across ${withWork.length} tickets`}
                            mins={avgWorkMins}
                        />
                        <SLACard
                            title="Avg Resource Downtime"
                            value={fmtMinutes(avgDowntimeMins)}
                            sub={`Across ${withResourceWork.length} resource tickets`}
                            mins={avgDowntimeMins}
                        />
                        <div className="analytics-sla-card">
                            <p className="analytics-sla-title">SLA Breaches</p>
                            <p className="analytics-sla-value" style={{ color: slaBreach > 0 ? '#dc2626' : '#15803d' }}>
                                {slaBreach > 0 ? `⚠️ ${slaBreach}` : '✓ 0'}
                            </p>
                            <p className="analytics-sla-sub">Response &gt; 4 hours</p>
                        </div>
                    </div>

                    {/* Resource downtime table */}
                    {resourceDowntime.length > 0 && (
                        <>
                            <p className="analytics-section-label">Top Resources by Downtime</p>
                            <div className="analytics-downtime-list" style={{ marginBottom: 36 }}>
                                {resourceDowntime.map(r => (
                                    <div key={r.name} className="analytics-downtime-row">
                                        <span className="analytics-downtime-name">{r.name}</span>
                                        <span className="analytics-downtime-value" style={{ color: slaColor(r.avgMins) }}>
                                            avg {fmtMinutes(r.avgMins)} · {r.count} ticket{r.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Charts */}
                    {filtered.length > 0 ? (
                        <>
                            <p className="analytics-section-label">Charts</p>
                            <div className="analytics-charts-grid">
                                {/* Tickets by Category */}
                                <div className="analytics-chart-card">
                                    <p className="analytics-chart-title">Tickets by Category</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={byCategory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'Tickets']} />
                                            <Bar dataKey="count" fill="var(--primary)" radius={[4,4,0,0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Tickets by Priority */}
                                <div className="analytics-chart-card">
                                    <p className="analytics-chart-title">Tickets by Priority</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine>
                                                {byPriority.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Tickets by Status */}
                                <div className="analytics-chart-card">
                                    <p className="analytics-chart-title">Tickets by Status</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={byStatus} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'Tickets']} />
                                            <Bar dataKey="count" fill="#7c3aed" radius={[4,4,0,0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Top 5 resources */}
                                {topResources.length > 0 && (
                                    <div className="analytics-chart-card">
                                        <p className="analytics-chart-title">Top 5 Resources by Ticket Count</p>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={topResources} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                                                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'Tickets']} />
                                                <Bar dataKey="count" fill="#c2410c" radius={[0,4,4,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <EmptyState icon="📊" title="No data for this period" desc="Try selecting a wider date range." />
                    )}
                </>
            )}
        </div>
    )
}
