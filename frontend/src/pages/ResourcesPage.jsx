// src/pages/ResourcesPage.jsx
import React, { useState, useEffect } from 'react'
import { resourceApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast } from '../components/ui/index.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import { getIcon, RESOURCE_LABEL, RESOURCE_TYPE_COLOR } from '../utils/helpers.js'

const FILTERS = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const FILTER_LABEL = { ALL: 'All Types', ...RESOURCE_LABEL }

function TypeBadge({ type }) {
    const c = RESOURCE_TYPE_COLOR[type] || { color: 'var(--text-sec)', bg: 'var(--gray100)', border: 'var(--gray200)' }
    return (
        <span style={{
            fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--r-full)',
            color: c.color, background: c.bg, border: `1px solid ${c.border}`,
            letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>{RESOURCE_LABEL[type] || type}</span>
    )
}

function FeatureTag({ label }) {
    return (
        <span style={{
            fontSize: 14, padding: '4px 12px', borderRadius: 'var(--r-full)',
            background: 'var(--gray100)', color: 'var(--text-sec)', border: '1px solid var(--border)',
        }}>{label.replace(/_/g, ' ')}</span>
    )
}

function ResourceCard({ resource, onBook }) {
    const active = resource.status === 'ACTIVE'
    return (
        <div onClick={active ? () => onBook(resource) : undefined} className="scale-in"
            style={{
                background: 'var(--white)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden', cursor: active ? 'pointer' : 'default',
                transition: 'box-shadow 200ms var(--ease), transform 200ms var(--ease)',
                display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => { if (active) { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = '' }}
        >
            <div style={{
                height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 52, position: 'relative',
                background: active ? 'linear-gradient(135deg, var(--g50) 0%, var(--g100) 100%)' : 'var(--gray100)',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                {getIcon(resource.type)}
                {!active && (
                    <span style={{
                        position: 'absolute', top: 10, right: 10, fontSize: 13, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 'var(--r-full)',
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                    }}>{resource.status}</span>
                )}
            </div>
            <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{resource.name}</h3>
                    <TypeBadge type={resource.type} />
                </div>
                <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
                    Floor {resource.floor}{resource.capacity ? ` · ${resource.capacity} seats` : ''}
                </p>
                <p style={{ fontSize: 15, color: 'var(--text-sec)' }}>
                    🕐 {resource.availabilityStart?.slice(0, 5)} – {resource.availabilityEnd?.slice(0, 5)}
                </p>
                {resource.features?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                        {resource.features.slice(0, 4).map(f => <FeatureTag key={f} label={f} />)}
                        {resource.features.length > 4 && <FeatureTag label={`+${resource.features.length - 4} more`} />}
                    </div>
                )}
                {active && (
                    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 600 }}>Click to book →</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ResourcesPage() {
    const { user: currentUser } = useAuth()
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setType] = useState('ALL')
    const [bookTarget, setBookTarget] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        resourceApi.getAll()
            .then(setResources)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    const filtered = resources.filter(r => {
        const s = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.locationDescription?.toLowerCase().includes(search.toLowerCase())
        return (s) && (typeFilter === 'ALL' || r.type === typeFilter)
    })

    return (
        <div style={{ padding: '36px 44px' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, lineHeight: 1.2 }}>Resources</h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Browse and book campus facilities and equipment</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Search resources…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                        fontSize: 15, fontFamily: 'var(--font-body)', width: 300, outline: 'none', background: 'var(--white)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setType(f)} style={{
                            padding: '9px 18px', borderRadius: 'var(--r-full)',
                            border: `1.5px solid ${typeFilter === f ? 'var(--primary)' : 'var(--border)'}`,
                            background: typeFilter === f ? 'var(--primary)' : 'var(--white)',
                            color: typeFilter === f ? '#fff' : 'var(--text-sec)',
                            fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            transition: 'all 150ms var(--ease)',
                        }}>{FILTER_LABEL[f]}</button>
                    ))}
                </div>
            </div>

            {loading && <Spinner />}
            {error && <p style={{ color: '#dc2626', fontSize: 14 }}>Failed to load resources: {error}</p>}
            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon="🔍" title="No resources found" desc="Try adjusting your search or filter." />
            )}
            {!loading && !error && filtered.length > 0 && (
                <div className="stagger" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 24,
                }}>
                    {filtered.map(r => <ResourceCard key={r.resourceId} resource={r} onBook={setBookTarget} />)}
                </div>
            )}

            {bookTarget && (
                <BookingModal
                    resource={bookTarget}
                    userId={currentUser?.userId}
                    onClose={() => setBookTarget(null)}
                    onSuccess={msg => { setBookTarget(null); setToast({ message: msg, type: 'success' }) }}
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}