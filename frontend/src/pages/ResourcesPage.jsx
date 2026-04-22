// src/pages/ResourcesPage.jsx
import React, { useState, useEffect } from 'react'
import { resourceApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast } from '../components/ui/index.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import { getIcon, RESOURCE_LABEL, RESOURCE_TYPE_COLOR } from '../utils/helpers.js'
import './ResourcesPage.css'

const FILTERS = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT', 'SPORTS_FACILITY', 'CAFETERIA']
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
    const [floorFilter, setFloorFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ACTIVE')
    const [bookTarget, setBookTarget] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        resourceApi.getAll()
            .then(setResources)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    const filtered = resources.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || (r.locationDescription?.toLowerCase() || '').includes(search.toLowerCase())
        const matchesType = typeFilter === 'ALL' || r.type === typeFilter
        const matchesFloor = floorFilter === 'ALL' || r.floor === floorFilter
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
        return matchesSearch && matchesType && matchesFloor && matchesStatus
    })

    return (
        <div className="resources-page">
            <div className="resources-hero">
                <img src="/campus_resources.png" className="resources-hero-img" alt="" />
                <div className="resources-hero-overlay">
                    <h1>🏢 Campus Resources</h1>
                    <p>Horizonia University — Browse and book facilities &amp; equipment</p>
                </div>
            </div>

            <main className="resources-main">
            <div className="resources-filter-container">
                <div className="resources-filter-bar-card">
                    <input
                        className="resources-search-input"
                        placeholder="Search name or location…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="resources-filter-select"
                        value={typeFilter}
                        onChange={e => setType(e.target.value)}
                    >
                        {FILTERS.map(f => (
                            <option key={f} value={f}>{FILTER_LABEL[f]}</option>
                        ))}
                    </select>
                    <select
                        className="resources-filter-select"
                        value={floorFilter}
                        onChange={e => setFloorFilter(e.target.value)}
                    >
                        <option value="ALL">All Floors</option>
                        <option value="G">Ground (G)</option>
                        <option value="1F">First (1F)</option>
                        <option value="2F">Second (2F)</option>
                        <option value="3F">Third (3F)</option>
                        <option value="B">Basement (B)</option>
                    </select>
                    <select
                        className="resources-filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                </div>
                <p className="resources-filter-count">
                    Showing {filtered.length} of {resources.length} resources
                </p>
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
            </main>
        </div>
    )
}
