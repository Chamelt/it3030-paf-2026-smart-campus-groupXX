import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getAllResources,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
} from '../../services/resourceService'
import './ManageResourcesPage.css'

export default function ManageResourcesPage() {
  const { user } = useAuth()

  // ── Data state ────────────────────────────────────────────────────────────
  const [resources,       setResources]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [successMessage,  setSuccessMessage]  = useState(null)

  // ── Form visibility ───────────────────────────────────────────────────────
  const [showForm,        setShowForm]        = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [formError,       setFormError]       = useState(null)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchTerm,    setSearchTerm]    = useState('')
  const [filterType,    setFilterType]    = useState('')
  const [filterFloor,   setFilterFloor]   = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')

  // ── Form field state ──────────────────────────────────────────────────────
  const [formName,                setFormName]                = useState('')
  const [formType,                setFormType]                = useState('LECTURE_HALL')
  const [formCapacity,            setFormCapacity]            = useState('')
  const [formFloor,               setFormFloor]               = useState('G')
  const [formLocationDescription, setFormLocationDescription] = useState('')
  const [formAvailabilityStart,   setFormAvailabilityStart]   = useState('07:00')
  const [formAvailabilityEnd,     setFormAvailabilityEnd]     = useState('22:00')
  const [formFeatures,            setFormFeatures]            = useState('')
  const [formImageFile,           setFormImageFile]           = useState(null)

  // ── Load resources ────────────────────────────────────────────────────────
  const loadResources = useCallback(() => {
    setLoading(true)
    setError(null)
    getAllResources()
      .then(data => {
        setResources(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load resources. Is the backend running?')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  // Auto-clear success message after 3 s
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 3000)
    return () => clearTimeout(t)
  }, [successMessage])

  // ── Form open / close ─────────────────────────────────────────────────────
  const openCreateForm = () => {
    setFormName('')
    setFormType('LECTURE_HALL')
    setFormCapacity('')
    setFormFloor('G')
    setFormLocationDescription('')
    setFormAvailabilityStart('07:00')
    setFormAvailabilityEnd('22:00')
    setFormFeatures('')
    setFormImageFile(null)
    setEditingResource(null)
    setFormError(null)
    setShowForm(true)
  }

  const openEditForm = (resource) => {
    setFormName(resource.name)
    setFormType(resource.type)
    setFormCapacity(resource.capacity ?? '')
    setFormFloor(resource.floor)
    setFormLocationDescription(resource.locationDescription)
    setFormAvailabilityStart((resource.availabilityStart || '').slice(0, 5))
    setFormAvailabilityEnd((resource.availabilityEnd || '').slice(0, 5))
    setFormFeatures((resource.features || []).join(', '))
    setFormImageFile(null)
    setEditingResource(resource)
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingResource(null)
    setFormError(null)
  }

  // ── Submit (create or update) ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formName.trim()) {
      setFormError('Name is required')
      return
    }
    if (formType !== 'EQUIPMENT' && (!formCapacity || parseInt(formCapacity) <= 0)) {
      setFormError('Capacity is required for rooms and labs')
      return
    }
    if (formAvailabilityEnd <= formAvailabilityStart) {
      setFormError('End time must be after start time')
      return
    }

    const data = {
      name:                formName.trim(),
      type:                formType,
      capacity:            formType === 'EQUIPMENT' ? null : parseInt(formCapacity),
      floor:               formFloor,
      locationDescription: formLocationDescription.trim(),
      availabilityStart:   formAvailabilityStart,
      availabilityEnd:     formAvailabilityEnd,
      features:            formFeatures.split(',').map(f => f.trim()).filter(Boolean),
    }

    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (formImageFile) fd.append('image', formImageFile)

    setSubmitting(true)
    try {
      if (editingResource === null) {
        await createResource(fd)
      } else {
        await updateResource(editingResource.resourceId, fd)
      }
      closeForm()
      loadResources()
      setSuccessMessage(editingResource ? 'Resource updated.' : 'Resource created.')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save resource.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateResourceStatus(id, newStatus)
      loadResources()
      setSuccessMessage('Status updated to ' + newStatus)
    } catch {
      alert('Failed to update status.')
    }
  }

  // ── Delete (decommission) ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Decommission this resource? This cannot be undone.')) return
    try {
      await deleteResource(id)
      loadResources()
      setSuccessMessage('Resource decommissioned.')
    } catch {
      alert('Failed to decommission resource.')
    }
  }

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filteredResources = resources.filter(r => {
    const term = searchTerm.toLowerCase()
    if (term && !r.name?.toLowerCase().includes(term) && !r.locationDescription?.toLowerCase().includes(term)) return false
    if (filterType   && r.type   !== filterType)   return false
    if (filterFloor  && r.floor  !== filterFloor)  return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="manage-resources-page">

      {/* ── Hero ── */}
      <div className="resources-hero">
        <img src="/campus_resources.png" className="resources-hero-img" alt="" />
        <div className="resources-hero-overlay">
          <h1>🏢 Manage Resources</h1>
          <p>Horizonia University — Campus Facilities &amp; Equipment</p>
        </div>
      </div>

      <main className="resources-main">

        {/* ── Success / Error banners ── */}
        {successMessage && (
          <div className="success-banner">
            {successMessage}
            <button onClick={() => setSuccessMessage(null)}>✕</button>
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}

        {/* ── Toolbar ── */}
        <div className="resources-toolbar">
          <h2>Campus Resources</h2>
          <button className="btn-primary" onClick={openCreateForm}>+ Add Resource</button>
        </div>

        {/* ── Filter bar ── */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search name or location…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
          <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
            <option value="">All Floors</option>
            <option value="G">Ground (G)</option>
            <option value="1F">First (1F)</option>
            <option value="2F">Second (2F)</option>
            <option value="3F">Third (3F)</option>
            <option value="B">Basement (B)</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>
        </div>

        {/* ── Count ── */}
        <p className="table-count">
          Showing {filteredResources.length} of {resources.length} resources
        </p>

        {/* ── Table / empty states ── */}
        {loading ? (
          <div className="spinner" />
        ) : filteredResources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>
            No resources match your filters.
          </p>
        ) : (
          <div className="resources-table-wrap">
            <table className="resources-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Capacity</th>
                  <th>Features</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(resource => {
                  const features = resource.features || []
                  const visibleFeatures = features.slice(0, 3)
                  const extraCount = features.length - 3

                  return (
                    <tr
                      key={resource.resourceId}
                      className={resource.status === 'DECOMMISSIONED' ? 'decommissioned' : ''}
                    >
                      {/* Image */}
                      <td>
                        {resource.imageUrl
                          ? <img src={resource.imageUrl} className="resource-thumb" alt={resource.name} />
                          : <div className="resource-thumb-placeholder">🏛️</div>
                        }
                      </td>

                      {/* Name */}
                      <td><strong>{resource.name}</strong></td>

                      {/* Type */}
                      <td>
                        <span className={`type-badge type-${resource.type}`}>
                          {resource.type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Floor */}
                      <td>{resource.floor}</td>

                      {/* Capacity */}
                      <td>{resource.capacity ?? '—'}</td>

                      {/* Features */}
                      <td>
                        {visibleFeatures.map(f => (
                          <span key={f} className="feature-pill">{f}</span>
                        ))}
                        {extraCount > 0 && (
                          <span className="feature-pill">+{extraCount} more</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge status-${resource.status}`}>
                          {resource.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn-secondary"
                            onClick={() => openEditForm(resource)}
                          >
                            Edit
                          </button>

                          {resource.status !== 'DECOMMISSIONED' && (
                            resource.status === 'ACTIVE'
                              ? (
                                <button
                                  className="btn-warning"
                                  onClick={() => handleStatusChange(resource.resourceId, 'OUT_OF_SERVICE')}
                                >
                                  Out of Service
                                </button>
                              ) : (
                                <button
                                  className="btn-success"
                                  onClick={() => handleStatusChange(resource.resourceId, 'ACTIVE')}
                                >
                                  Set Active
                                </button>
                              )
                          )}

                          <button
                            className="btn-danger"
                            onClick={() => handleDelete(resource.resourceId)}
                            disabled={resource.status === 'DECOMMISSIONED'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Create / Edit modal ── */}
        {showForm && (
          <div
            className="form-overlay"
            onClick={e => { if (e.target === e.currentTarget) closeForm() }}
          >
            <div className="form-card">
              <h2>{editingResource ? '✏️ Edit Resource' : '➕ Add New Resource'}</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">

                  {/* Name */}
                  <div className="form-group full-width">
                    <label>Resource Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Lecture Hall G-LH1"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="form-group">
                    <label>Type *</label>
                    <select value={formType} onChange={e => setFormType(e.target.value)}>
                      <option value="LECTURE_HALL">Lecture Hall</option>
                      <option value="LAB">Lab</option>
                      <option value="MEETING_ROOM">Meeting Room</option>
                      <option value="EQUIPMENT">Equipment</option>
                    </select>
                  </div>

                  {/* Capacity — hidden for EQUIPMENT */}
                  {formType !== 'EQUIPMENT' && (
                    <div className="form-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        min="1"
                        value={formCapacity}
                        onChange={e => setFormCapacity(e.target.value)}
                        placeholder="Max occupancy"
                      />
                    </div>
                  )}

                  {/* Floor */}
                  <div className="form-group">
                    <label>Floor *</label>
                    <select value={formFloor} onChange={e => setFormFloor(e.target.value)}>
                      <option value="G">Ground Floor (G)</option>
                      <option value="1F">First Floor (1F)</option>
                      <option value="2F">Second Floor (2F)</option>
                      <option value="3F">Third Floor (3F)</option>
                      <option value="B">Basement (B)</option>
                    </select>
                  </div>

                  {/* Location description */}
                  <div className="form-group full-width">
                    <label>Location Description *</label>
                    <textarea
                      value={formLocationDescription}
                      onChange={e => setFormLocationDescription(e.target.value)}
                      placeholder="e.g. Ground floor, east wing, main entrance side"
                      rows={2}
                    />
                  </div>

                  {/* Availability start */}
                  <div className="form-group">
                    <label>Available From *</label>
                    <input
                      type="time"
                      value={formAvailabilityStart}
                      onChange={e => setFormAvailabilityStart(e.target.value)}
                    />
                  </div>

                  {/* Availability end */}
                  <div className="form-group">
                    <label>Available Until *</label>
                    <input
                      type="time"
                      value={formAvailabilityEnd}
                      onChange={e => setFormAvailabilityEnd(e.target.value)}
                    />
                  </div>

                  {/* Features */}
                  <div className="form-group full-width">
                    <label>Features (comma-separated)</label>
                    <input
                      type="text"
                      value={formFeatures}
                      onChange={e => setFormFeatures(e.target.value)}
                      placeholder="projector, smart_board, pa_system"
                    />
                  </div>

                  {/* Image upload */}
                  <div className="form-group full-width">
                    <label>Resource Photo (JPEG/PNG, max 5MB)</label>
                    {editingResource && editingResource.imageUrl && (
                      <div style={{ marginBottom: 8 }}>
                        <img
                          src={editingResource.imageUrl}
                          className="current-image-preview"
                          alt="Current"
                        />
                        <p className="image-hint">Current image — upload new file to replace</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={e => setFormImageFile(e.target.files[0] || null)}
                    />
                  </div>

                </div>

                {formError && (
                  <div className="error-banner" style={{ marginTop: 12 }}>{formError}</div>
                )}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : editingResource ? 'Update Resource' : 'Create Resource'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
