// src/pages/admin/ManageTechniciansPage.jsx
import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import './ManageTechniciansPage.css'

const SPECIALTIES = ['ELECTRICAL', 'PLUMBING', 'AV_EQUIPMENT', 'FURNITURE', 'IT', 'OTHER']
const SPECIALTY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}

function Initials({ name }) {
    const parts = (name || '?').split(' ')
    const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
    return <div className="tech-mgmt-initials">{initials.toUpperCase()}</div>
}

export default function ManageTechniciansPage() {
    const [technicians, setTechnicians] = useState([])
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState(null)
    const [search,      setSearch]      = useState('')
    const [updating,    setUpdating]    = useState(null)
    const [deleting,    setDeleting]    = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [toast,       setToast]       = useState(null)

    const load = () => {
        setLoading(true); setError(null)
        axiosInstance.get('/api/users')
            .then(res => {
                const all = Array.isArray(res.data) ? res.data : []
                setTechnicians(all.filter(u => u.role === 'TECHNICIAN'))
            })
            .catch(() => setError('Failed to load technicians.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 3000)
        return () => clearTimeout(t)
    }, [toast])

    const handleSpecialtyChange = async (userId, specialty) => {
        setUpdating(userId)
        try {
            const res = await axiosInstance.patch(`/api/users/${userId}/specialty`, { specialty })
            setTechnicians(prev => prev.map(u => u.userId === userId ? { ...u, ...res.data } : u))
            setToast({ message: 'Specialty updated.', type: 'success' })
        } catch {
            setToast({ message: 'Failed to update specialty.', type: 'error' })
        } finally {
            setUpdating(null)
        }
    }

    const handleDelete = async (userId) => {
        setDeleting(userId)
        try {
            await axiosInstance.delete(`/api/users/${userId}`)
            setTechnicians(prev => prev.filter(u => u.userId !== userId))
            setToast({ message: 'Technician removed.', type: 'success' })
        } catch {
            setToast({ message: 'Failed to delete technician.', type: 'error' })
        } finally {
            setDeleting(null)
            setConfirmDelete(null)
        }
    }

    const filtered = technicians.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="tech-mgmt-page">

            {/* Hero */}
            <div className="tech-mgmt-hero">
                <img src="/campus_admin.png" alt="Manage Technicians" className="tech-mgmt-hero-img" />
                <div className="tech-mgmt-hero-overlay">
                    <h1>🔧 Manage Technicians</h1>
                </div>
            </div>

            <main className="tech-mgmt-main">

                {/* Toolbar */}
                <div className="tech-mgmt-toolbar">
                    <div className="tech-mgmt-search">
                        <span className="tech-mgmt-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {!loading && !error && (
                        <span className="tech-mgmt-count">
                            {filtered.length} technician{filtered.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="tech-mgmt-table-card">
                    <table className="tech-mgmt-table">
                        <thead>
                            <tr>
                                <th>Technician</th>
                                <th>Email</th>
                                <th>Specialty</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    {Array.from({ length: 5 }).map((__, j) => (
                                        <td key={j}><div className="skeleton-line" style={{ width: j === 0 ? '140px' : j === 1 ? '180px' : '90px' }} /></td>
                                    ))}
                                </tr>
                            ))}

                            {!loading && filtered.map(u => (
                                <tr key={u.userId}>
                                    <td>
                                        <div className="tech-mgmt-cell">
                                            {u.profilePictureUrl
                                                ? <img src={u.profilePictureUrl} alt={u.name} className="tech-mgmt-avatar" referrerPolicy="no-referrer" />
                                                : <Initials name={u.name} />
                                            }
                                            <strong>{u.name}</strong>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>
                                        <select
                                            className="tech-mgmt-specialty-select"
                                            value={u.specialty || ''}
                                            disabled={updating === u.userId}
                                            onChange={e => handleSpecialtyChange(u.userId, e.target.value)}
                                        >
                                            <option value="">— None —</option>
                                            {SPECIALTIES.map(s => (
                                                <option key={s} value={s}>{SPECIALTY_LABEL[s]}</option>
                                            ))}
                                        </select>
                                        {updating === u.userId && (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Saving…</span>
                                        )}
                                    </td>
                                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                    <td>
                                        {confirmDelete === u.userId ? (
                                            <div className="tech-mgmt-confirm-del">
                                                <span>Remove?</span>
                                                <button
                                                    className="tech-mgmt-btn-danger"
                                                    disabled={deleting === u.userId}
                                                    onClick={() => handleDelete(u.userId)}
                                                >
                                                    {deleting === u.userId ? 'Removing…' : 'Yes'}
                                                </button>
                                                <button
                                                    className="tech-mgmt-btn-cancel"
                                                    onClick={() => setConfirmDelete(null)}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="tech-mgmt-btn-delete"
                                                onClick={() => setConfirmDelete(u.userId)}
                                            >
                                                🗑 Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="tech-mgmt-empty">
                                            <p>🔧 No technicians found{search ? ' matching your search' : ''}.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Toast */}
            {toast && (
                <div className={`tech-mgmt-toast${toast.type === 'error' ? ' error' : ''}`}>
                    {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
                </div>
            )}
        </div>
    )
}
