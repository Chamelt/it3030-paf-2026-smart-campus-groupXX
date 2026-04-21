// src/pages/ResourcesPage.jsx
import React, { useState, useEffect } from 'react'
import { resourceApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast } from '../components/ui/index.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import { getIcon, RESOURCE_LABEL, RESOURCE_TYPE_COLOR } from '../utils/helpers.js'
import './ResourcesPage.css'

const FILTERS = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const FILTER_LABEL = { ALL: 'All Types', ...RESOURCE_LABEL }

function TypeBadge({ type }) {
    const c = RESOURCE_TYPE_COLOR[type] || { color: 'var(--text-sec)', bg: 'var(--gray100)', border: 'var(--gray200)' }
    return (
        <span
            className="type-badge-pill"
            style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
        >
            {RESOURCE_LABEL[type] || type}
        </span>
    )
}

function FeatureTag({ label }) {
    return (
        <span className="feature-tag-pill">
            {label.replace(/_/g, ' ')}
        </span>
    )
}

function ResourceCard({ resource, onBook }) {
    const active = resource.status === 'ACTIVE'
    return (
        <div
            onClick={active ? () => onBook(resource) : undefined}
            className={`resource-card scale-in${active ? ' active' : ''}`}
        >
            {resource.imageUrl ? (
                <img
                    src={resource.imageUrl}
                    alt={resource.name}
                    className="resource-card-img"
                />
            ) : (
                <div className={`resource-card-placeholder ${active ? 'active-bg' : 'inactive-bg'}`}>
                    {getIcon(resource.type)}
                    {!active && (
                        <span className="resource-card-status-pill">{resource.status}</span>
                    )}
                </div>
            )}

            <div className="resource-card-body">
                <div className="resource-card-title-row">
                    <h3 className="resource-card-name">{resource.name}</h3>
                    <TypeBadge type={resource.type} />
                </div>
                <p className="resource-card-meta">
                    Floor {resource.floor}{resource.capacity ? ` · ${resource.capacity} seats` : ''}
                </p>
                <p className="resource-card-hours">
                    🕐 {resource.availabilityStart?.slice(0, 5)} – {resource.availabilityEnd?.slice(0, 5)}
                </p>
                {resource.features?.length > 0 && (
                    <div className="resource-card-features">
                        {resource.features.slice(0, 4).map(f => <FeatureTag key={f} label={f} />)}
                        {resource.features.length > 4 && <FeatureTag label={`+${resource.features.length - 4} more`} />}
                    </div>
                )}
                {active && (
                    <div className="resource-card-book-cta">
                        <span>Click to book →</span>
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
        <div className="resources-page">
            <div className="resources-page-header">
                <h1>Resources</h1>
                <p>Browse and book campus facilities and equipment</p>
            </div>

            <div className="resources-filter-bar">
                <input
                    className="resources-search-input"
                    placeholder="Search resources…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="resources-filter-buttons">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setType(f)}
                            className={`resources-filter-btn${typeFilter === f ? ' active' : ''}`}
                        >
                            {FILTER_LABEL[f]}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <Spinner />}
            {error && <p className="resources-error">Failed to load resources: {error}</p>}
            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon="🔍" title="No resources found" desc="Try adjusting your search or filter." />
            )}
            {!loading && !error && filtered.length > 0 && (
                <div className="resources-grid stagger">
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
