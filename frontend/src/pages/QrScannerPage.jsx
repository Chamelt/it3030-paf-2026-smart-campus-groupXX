import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getResourceById, updateResourceStatus } from '../services/resourceService'
import './QrScannerPage.css'

export default function QrScannerPage() {
  const [activeTab,     setActiveTab]     = useState('scan')
  const [manualInput,   setManualInput]   = useState('')
  const [resource,      setResource]      = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [statusUpdated, setStatusUpdated] = useState(false)

  // ── Fetch resource by ID ──────────────────────────────────────────────────
  const fetchResource = async (resourceId) => {
    const trimmedId = resourceId.trim()
    if (!trimmedId) return
    setLoading(true)
    setError(null)
    setResource(null)
    setStatusUpdated(false)
    try {
      const data = await getResourceById(trimmedId)
      setResource(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No resource found with this ID. Check the QR code and try again.')
      } else {
        setError('Failed to look up resource. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Mark as Out of Service ────────────────────────────────────────────────
  const handleMarkOutOfService = async () => {
    try {
      await updateResourceStatus(resource.resourceId, 'OUT_OF_SERVICE')
      setStatusUpdated(true)
      setResource(prev => ({ ...prev, status: 'OUT_OF_SERVICE' }))
    } catch {
      setError('Failed to update status. Please try again.')
    }
  }

  // ── Reset to scan another ─────────────────────────────────────────────────
  const handleScanAnother = () => {
    setResource(null)
    setStatusUpdated(false)
    setError(null)
    setManualInput('')
  }

  // ── Camera scanner ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'scan' || resource !== null) return

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)

    const onScanSuccess = (decodedText) => {
      scanner.clear().then(() => fetchResource(decodedText)).catch(() => {})
    }

    const onScanError = () => {}

    scanner.render(onScanSuccess, onScanError)

    return () => { scanner.clear().catch(() => {}) }
  }, [activeTab, resource])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="qr-scanner-page">

      {/* ── Hero ── */}
      <div className="qr-hero">
        <img src="/campus_resources.png" className="qr-hero-img" alt="" />
        <div className="qr-hero-overlay">
          <h1>📷 QR Equipment Scanner</h1>
          <p>Scan a QR code to instantly view and update equipment status</p>
        </div>
      </div>

      <main className="qr-main">
        <h2>Equipment Quick Access</h2>
        <p className="subtitle">
          Point your camera at an equipment QR code or enter the resource ID manually.
        </p>

        {/* ── Tabs ── */}
        <div className="qr-tabs">
          <button
            className={`qr-tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => { setActiveTab('scan'); setResource(null); setError(null) }}
          >
            📷 Scan with Camera
          </button>
          <button
            className={`qr-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => { setActiveTab('manual'); setError(null) }}
          >
            ⌨️ Enter ID Manually
          </button>
        </div>

        {/* ── Camera tab ── */}
        {resource === null && activeTab === 'scan' && (
          <div className="qr-scanner-container">
            <p>Position the QR code within the frame to scan</p>
            <div id="qr-reader"></div>
          </div>
        )}

        {/* ── Manual tab ── */}
        {resource === null && activeTab === 'manual' && (
          <div className="qr-scanner-container">
            <p>Paste or type the resource UUID from the QR code label</p>
            <div className="manual-input-group">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="e.g. 5febdd18-946c-4187-876d-736d130f5579"
                onKeyDown={e => e.key === 'Enter' && fetchResource(manualInput)}
              />
              <button className="qr-lookup-btn" onClick={() => fetchResource(manualInput)}>
                Look Up
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <div className="spinner" style={{ margin: '40px auto' }} />}

        {/* ── Error ── */}
        {error && <div className="qr-error">{error}</div>}

        {/* ── Result card ── */}
        {resource !== null && (
          <div className="resource-result-card">
            <h3>{resource.name}</h3>

            <p className="resource-result-meta">
              📍 Floor {resource.floor} — {resource.locationDescription}
              {resource.capacity && <><br />👥 Capacity: {resource.capacity}</>}
              <br />🕐 Available: {resource.availabilityStart?.slice(0, 5)} – {resource.availabilityEnd?.slice(0, 5)}
            </p>

            <div className="result-badges">
              <span className={`type-badge type-${resource.type}`}>
                {resource.type.replace(/_/g, ' ')}
              </span>
              <span className={`status-badge status-${resource.status}`}>
                {resource.status.replace(/_/g, ' ')}
              </span>
            </div>

            {statusUpdated && (
              <div className="oos-success">
                ✅ Status successfully updated to OUT OF SERVICE
              </div>
            )}

            <button
              className="oos-button"
              onClick={handleMarkOutOfService}
              disabled={
                resource.status === 'OUT_OF_SERVICE' ||
                resource.status === 'DECOMMISSIONED' ||
                statusUpdated
              }
            >
              {resource.status === 'OUT_OF_SERVICE'
                ? '⚠️ Already Out of Service'
                : resource.status === 'DECOMMISSIONED'
                ? '🚫 Resource Decommissioned'
                : '⚠️ Mark as OUT OF SERVICE'}
            </button>

            <button className="scan-another-btn" onClick={handleScanAnother}>
              ← Scan Another Equipment
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
