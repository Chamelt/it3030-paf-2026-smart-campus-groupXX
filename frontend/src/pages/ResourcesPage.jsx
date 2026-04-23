// src/pages/ResourcesPage.jsx
import React, { useState, useEffect } from 'react'
import { resourceApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner, EmptyState, Toast } from '../components/ui/index.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import ResourceHero from '../components/resources/ResourceHero.jsx'
import ResourceCard from '../components/resources/ResourceCard.jsx'
import ResourceFilterBar from '../components/resources/ResourceFilterBar.jsx'
import './ResourcesPage.css'

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
            <ResourceHero
                imageSrc="/campus_resources.png"
                title="🏢 Campus Resources"
                subtitle="Horizonia University — Browse and book facilities & equipment"
            />

            <main className="resources-main">
            <ResourceFilterBar
                search={search} setSearch={setSearch}
                typeFilter={typeFilter} setType={setType}
                floorFilter={floorFilter} setFloorFilter={setFloorFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                filteredCount={filtered.length} totalCount={resources.length}
            />

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
