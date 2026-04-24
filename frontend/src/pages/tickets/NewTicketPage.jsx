// src/pages/tickets/NewTicketPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, Toast, Btn } from '../../components/ui/index.jsx'
import {
    createTicket,
    getFloors,
    getResourceTypes,
    getResourcesForDropdown,
} from '../../services/ticketService.js'
import './NewTicketPage.css'

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'AV_EQUIPMENT', 'FURNITURE', 'IT', 'OTHER']
const CATEGORY_LABEL = {
    ELECTRICAL: 'Electrical', PLUMBING: 'Plumbing', AV_EQUIPMENT: 'AV Equipment',
    FURNITURE: 'Furniture', IT: 'IT', OTHER: 'Other',
}
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const PRIORITY_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }

const DESC_BLOCKED = /[<>{}[\]|\\\/^~]/
const CONTACT_ALLOWED = /^[0-9+\-\s@.]$/

function fmtSize(bytes) {
    return bytes < 1024 * 1024
        ? `${Math.round(bytes / 1024)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidContact(val) {
    const v = val.trim()
    if (!v) return false
    if (v.includes('@') && v.includes('.')) return true
    return v.replace(/\D/g, '').length >= 7
}

export default function NewTicketPage() {
    const navigate = useNavigate()

    // Location state
    const [category,     setCategory]     = useState('')
    const [floor,        setFloor]        = useState('')
    const [type,         setType]         = useState('')
    const [resourceId,   setResourceId]   = useState('')
    const [resourceName, setResourceName] = useState('')
    const [locationText, setLocationText] = useState('')

    // Fetched dropdown data
    const [floors,         setFloors]         = useState([])
    const [resourceTypes,  setResourceTypes]  = useState([])
    const [resources,      setResources]      = useState([])
    const [loadingFloors,  setLoadingFloors]  = useState(false)
    const [loadingTypes,   setLoadingTypes]   = useState(false)
    const [loadingRes,     setLoadingRes]     = useState(false)

    // Form fields (phase 2)
    const [description,    setDescription]    = useState('')
    const [priority,       setPriority]       = useState('MEDIUM')
    const [contactDetails, setContactDetails] = useState('')

    // Images
    const [images, setImages] = useState([])

    // Submission
    const [submitting,   setSubmitting]   = useState(false)
    const [submitError,  setSubmitError]  = useState('')
    const [fieldErrors,  setFieldErrors]  = useState({})
    const [submitted,    setSubmitted]    = useState(false)
    const [toast,        setToast]        = useState(null)

    // ── Reset helpers ──────────────────────────────────────────────────────
    const resetLocation = () => {
        setFloor(''); setType(''); setResourceId(''); setResourceName(''); setLocationText('')
        setFloors([]); setResourceTypes([]); setResources([])
    }

    // ── Category change ────────────────────────────────────────────────────
    useEffect(() => {
        if (!category) { resetLocation(); return }
        setFloor(''); setType(''); setResourceId(''); setResourceName(''); setLocationText('')
        setResourceTypes([]); setResources([])

        setLoadingFloors(true)
        getFloors()
            .then(setFloors)
            .catch(() => setFloors([]))
            .finally(() => setLoadingFloors(false))
        if (category === 'AV_EQUIPMENT') {
            setType('EQUIPMENT')
        }
    }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Floor change ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!floor) return
        setResourceId(''); setResourceName(''); setResources([])

        if (category === 'AV_EQUIPMENT') {
            setLoadingRes(true)
            getResourcesForDropdown(floor, 'EQUIPMENT')
                .then(setResources)
                .catch(() => setResources([]))
                .finally(() => setLoadingRes(false))
            return
        }

        setType('')
        setLoadingTypes(true)
        getResourceTypes()
            .then(types => setResourceTypes(types.filter(t => t !== 'EQUIPMENT')))
            .catch(() => setResourceTypes([]))
            .finally(() => setLoadingTypes(false))
    }, [floor]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Type change ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!type || type === 'OTHER') { setResourceId(''); setResourceName(''); setResources([]); return }
        if (category === 'AV_EQUIPMENT') return // already fetched

        setResourceId(''); setResourceName('')
        setLoadingRes(true)
        getResourcesForDropdown(floor, type)
            .then(setResources)
            .catch(() => setResources([]))
            .finally(() => setLoadingRes(false))
    }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Location determined? ───────────────────────────────────────────────
    const locationDetermined =
        category === 'AV_EQUIPMENT'
            ? floor !== '' && resourceId !== ''
            : category !== '' && type !== '' && (type === 'OTHER' || resourceId !== '')

    // ── Image handling ─────────────────────────────────────────────────────
    const handleImageSelect = (e) => {
        const newFiles = Array.from(e.target.files)
        const remaining = 3 - images.length
        const toAdd = newFiles.slice(0, remaining)

        const newImages = toAdd.map(file => {
            const allowed = ['image/jpeg', 'image/png']
            const allowedExt = ['.jpg', '.jpeg', '.png']
            const validType = allowed.includes(file.type)
            const validExt  = allowedExt.some(ext => file.name.toLowerCase().endsWith(ext))
            let error = null
            if (!validType || !validExt) error = 'Only JPG and PNG files are allowed.'
            else if (file.size > 5 * 1024 * 1024) error = 'File must be under 5 MB.'
            return { file, name: file.name, size: file.size, preview: !error ? URL.createObjectURL(file) : null, error }
        })
        setImages(prev => [...prev, ...newImages])
        e.target.value = ''
    }

    const removeImage = useCallback((idx) => {
        setImages(prev => {
            const img = prev[idx]
            if (img.preview) URL.revokeObjectURL(img.preview)
            return prev.filter((_, i) => i !== idx)
        })
    }, [])

    // ── Key blocking ───────────────────────────────────────────────────────
    const handleDescKeyDown = (e) => {
        if (DESC_BLOCKED.test(e.key)) e.preventDefault()
    }

    const handleContactKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return
        if (['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'].includes(e.key)) return
        if (!CONTACT_ALLOWED.test(e.key)) e.preventDefault()
    }

    // ── Validation helpers ─────────────────────────────────────────────────
    const descLen     = description.trim().length
    const descValid   = descLen >= 10 && descLen <= 500
    const contactValid = isValidContact(contactDetails)
    const imagesValid  = images.every(img => !img.error)

    const canSubmit =
        category !== '' && locationDetermined &&
        descValid && contactValid && imagesValid && !submitting

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        setSubmitError('')

        const errors = {}
        if (!category)                             errors.category      = 'Select a category.'
        if (!locationDetermined)                   errors.location      = 'Complete the location selection.'
        if (type === 'OTHER' && !locationText.trim()) errors.locationText = 'Enter a location description.'
        if (!descValid) {
            if (descLen < 10) errors.description = 'Description must be at least 10 characters.'
            if (descLen > 500) errors.description = 'Description must be under 500 characters.'
        }
        if (!contactValid) errors.contactDetails = 'Enter a valid phone number or email.'
        if (!imagesValid)  errors.images         = 'Remove invalid image files before submitting.'

        if (Object.keys(errors).length) {
            setFieldErrors(errors)
            setSubmitError('Please fix the highlighted errors before submitting.')
            return
        }
        setFieldErrors({})

        const requestData = {
            category,
            priority,
            description: description.trim(),
            contactDetails: contactDetails.trim(),
            ...(resourceId ? { resourceId } : {}),
            ...((!resourceId) ? { locationText: type === 'OTHER' ? locationText.trim() : resourceName } : {}),
        }

        const fd = new FormData()
        fd.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }))
        images.filter(img => !img.error).forEach(img => fd.append('images', img.file))

        setSubmitting(true)
        try {
            await createTicket(fd)
            setToast({ message: 'Ticket submitted successfully!', type: 'success' })
            setTimeout(() => navigate('/tickets/my'), 1200)
        } catch (err) {
            setSubmitError(err.message || 'Failed to submit ticket. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="new-ticket-page">
            <div className="new-ticket-header">
                <h1>➕ Report an Issue</h1>
                <p>Submit a maintenance or incident ticket for a campus resource or location.</p>
            </div>

            <form className="ticket-form-card" onSubmit={handleSubmit} noValidate>

                {/* ── Phase 1: Location ── */}
                <p className="ticket-form-section">📍 Location</p>

                {/* Category */}
                <div className="ticket-field">
                    <label className="ticket-field-label">Category <span className="req">*</span></label>
                    <select
                        className={`ticket-select${submitted && fieldErrors.category ? ' error' : ''}`}
                        value={category}
                        onChange={e => { setCategory(e.target.value); setFieldErrors(p => ({ ...p, category: undefined })) }}
                    >
                        <option value="">— Select category —</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                    </select>
                    {submitted && fieldErrors.category && <span className="ticket-field-error">{fieldErrors.category}</span>}
                </div>

                {/* AV_EQUIPMENT path: Floor → Equipment (filtered by floor) */}
                {category === 'AV_EQUIPMENT' && (
                    <>
                        <div className="ticket-field">
                            <label className="ticket-field-label">Floor <span className="req">*</span></label>
                            {loadingFloors ? <Spinner size={20} /> : (
                                <select
                                    className="ticket-select"
                                    value={floor}
                                    onChange={e => {
                                        setFloor(e.target.value)
                                        setResourceId(''); setResourceName('')
                                        setFieldErrors(p => ({ ...p, location: undefined }))
                                    }}
                                >
                                    <option value="">— Select floor —</option>
                                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}
                        </div>

                        {floor && (
                            <div className="ticket-field">
                                <label className="ticket-field-label">Equipment <span className="req">*</span></label>
                                {loadingRes ? <Spinner size={20} /> : (
                                    <select
                                        className={`ticket-select${submitted && fieldErrors.location ? ' error' : ''}`}
                                        value={resourceId}
                                        onChange={e => {
                                            const sel = resources.find(r => r.resourceId === e.target.value)
                                            setResourceId(e.target.value)
                                            setResourceName(sel?.name || '')
                                            setFieldErrors(p => ({ ...p, location: undefined }))
                                        }}
                                    >
                                        <option value="">— Select equipment —</option>
                                        {resources.map(r => <option key={r.resourceId} value={r.resourceId}>{r.name}</option>)}
                                    </select>
                                )}
                                {submitted && fieldErrors.location && <span className="ticket-field-error">{fieldErrors.location}</span>}
                            </div>
                        )}
                    </>
                )}

                {/* Non-AV path: Floor → Type → Resource/LocationText */}
                {category && category !== 'AV_EQUIPMENT' && (
                    <>
                        <div className="ticket-field">
                            <label className="ticket-field-label">Floor <span className="req">*</span></label>
                            {loadingFloors ? <Spinner size={20} /> : (
                                <select
                                    className="ticket-select"
                                    value={floor}
                                    onChange={e => { setFloor(e.target.value); setFieldErrors(p => ({ ...p, location: undefined })) }}
                                >
                                    <option value="">— Select floor —</option>
                                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}
                        </div>

                        {floor && (
                            <div className="ticket-field">
                                <label className="ticket-field-label">Resource Type <span className="req">*</span></label>
                                {loadingTypes ? <Spinner size={20} /> : (
                                    <select
                                        className="ticket-select"
                                        value={type}
                                        onChange={e => { setType(e.target.value); setLocationText(''); setFieldErrors(p => ({ ...p, location: undefined, locationText: undefined })) }}
                                    >
                                        <option value="">— Select type —</option>
                                        {resourceTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                        <option value="OTHER">Other (free text)</option>
                                    </select>
                                )}
                            </div>
                        )}

                        {type && type !== 'OTHER' && (
                            <div className="ticket-field">
                                <label className="ticket-field-label">Resource <span className="req">*</span></label>
                                {loadingRes ? <Spinner size={20} /> : (
                                    <select
                                        className={`ticket-select${submitted && fieldErrors.location ? ' error' : ''}`}
                                        value={resourceId}
                                        onChange={e => {
                                            const sel = resources.find(r => r.resourceId === e.target.value)
                                            setResourceId(e.target.value)
                                            setResourceName(sel?.name || '')
                                            setFieldErrors(p => ({ ...p, location: undefined }))
                                        }}
                                    >
                                        <option value="">— Select resource —</option>
                                        {resources.map(r => <option key={r.resourceId} value={r.resourceId}>{r.name}</option>)}
                                    </select>
                                )}
                                {submitted && fieldErrors.location && <span className="ticket-field-error">{fieldErrors.location}</span>}
                            </div>
                        )}

                        {type === 'OTHER' && (
                            <div className="ticket-field">
                                <label className="ticket-field-label">Location Description <span className="req">*</span></label>
                                <input
                                    type="text"
                                    className={`ticket-input${submitted && fieldErrors.locationText ? ' error' : ''}`}
                                    placeholder="e.g. Ground floor corridor near Block A entrance"
                                    value={locationText}
                                    onChange={e => { setLocationText(e.target.value); setFieldErrors(p => ({ ...p, locationText: undefined })) }}
                                />
                                {submitted && fieldErrors.locationText && <span className="ticket-field-error">{fieldErrors.locationText}</span>}
                            </div>
                        )}
                    </>
                )}

                {/* ── Phase 2: Details (visible after location is determined) ── */}
                {locationDetermined && (
                    <div className="ticket-phase-2">
                        <hr className="ticket-form-divider" />
                        <p className="ticket-form-section">📝 Ticket Details</p>

                        {/* Description */}
                        <div className="ticket-field">
                            <label className="ticket-field-label">
                                Description <span className="req">*</span>
                            </label>
                            <textarea
                                className={`ticket-textarea${(submitted && fieldErrors.description) || (description.trim().length > 0 && descLen < 10) ? ' error' : ''}`}
                                placeholder="Describe the issue clearly. Minimum 10 characters."
                                maxLength={500}
                                value={description}
                                onChange={e => { setDescription(e.target.value); setFieldErrors(p => ({ ...p, description: undefined })) }}
                                onKeyDown={handleDescKeyDown}
                                rows={4}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                {(submitted && fieldErrors.description) || (description.trim().length > 0 && descLen < 10)
                                    ? <span className="ticket-field-error">{fieldErrors.description || 'At least 10 characters required.'}</span>
                                    : <span />
                                }
                                <span className={`ticket-char-count${descLen >= 10 && descLen <= 500 ? ' ok' : descLen > 0 ? ' warn' : ''}`}>
                                    {descLen}/500
                                </span>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="ticket-field">
                            <label className="ticket-field-label">Priority <span className="req">*</span></label>
                            <select
                                className="ticket-select"
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                            >
                                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                            </select>
                        </div>

                        {/* Contact Details */}
                        <div className="ticket-field">
                            <label className="ticket-field-label">Contact Details <span className="req">*</span></label>
                            <input
                                type="text"
                                className={`ticket-input${(submitted && fieldErrors.contactDetails) || (contactDetails.length > 0 && !contactValid) ? ' error' : ''}`}
                                placeholder="Phone number or email address"
                                value={contactDetails}
                                onChange={e => { setContactDetails(e.target.value); setFieldErrors(p => ({ ...p, contactDetails: undefined })) }}
                                onKeyDown={handleContactKeyDown}
                            />
                            {(submitted && fieldErrors.contactDetails) || (contactDetails.length > 0 && !contactValid)
                                ? <span className="ticket-field-error">{fieldErrors.contactDetails || 'Enter a valid phone number or email.'}</span>
                                : <span className="ticket-field-hint">Digits, +, -, @, spaces and . only.</span>
                            }
                        </div>

                        {/* Image Upload */}
                        <div className="ticket-field">
                            <label className="ticket-field-label">Images <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional, max 3)</span></label>

                            {images.length < 3 && (
                                <label className="image-upload-area">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleImageSelect}
                                    />
                                    <p className="image-upload-label">
                                        <span>Click to upload</span> · JPG, PNG only · max 5 MB each
                                    </p>
                                </label>
                            )}

                            {images.length > 0 && (
                                <>
                                    <div className="image-list">
                                        {images.map((img, idx) => (
                                            <div key={idx} className={`image-item${img.error ? ' has-error' : ''}`}>
                                                {img.preview
                                                    ? <img src={img.preview} className="image-thumb" alt={img.name} />
                                                    : <div className="image-thumb-placeholder">⚠️</div>
                                                }
                                                <div className="image-info">
                                                    <p className="image-name">{img.name}</p>
                                                    <p className="image-size">{fmtSize(img.size)}</p>
                                                    {img.error && <p className="image-error-text">{img.error}</p>}
                                                </div>
                                                <button type="button" className="image-remove-btn" onClick={() => removeImage(idx)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="image-count-badge">{images.length}/3 images selected</p>
                                </>
                            )}
                            {submitted && fieldErrors.images && <span className="ticket-field-error">{fieldErrors.images}</span>}
                        </div>

                        {submitError && <div className="ticket-form-error">{submitError}</div>}

                        <div className="ticket-form-actions">
                            <Btn variant="secondary" type="button" onClick={() => navigate('/tickets/my')}>
                                Cancel
                            </Btn>
                            <Btn type="submit" disabled={!canSubmit} loading={submitting}>
                                Submit Ticket
                            </Btn>
                        </div>
                    </div>
                )}
            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
