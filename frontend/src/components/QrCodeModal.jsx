import { QRCodeSVG } from 'qrcode.react'

export default function QrCodeModal({ isOpen, onClose, resource }) {
  if (!isOpen) return null

  const handleDownload = () => {
    const svgContainer = document.getElementById('qr-code-svg')
    const svg = svgContainer.querySelector('svg')
    const canvas = document.createElement('canvas')
    canvas.width = 280
    canvas.height = 280
    const ctx = canvas.getContext('2d')
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 280, 280)
      ctx.drawImage(img, 0, 0, 280, 280)
      URL.revokeObjectURL(url)
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = resource.name.replace(/\s+/g, '-').toLowerCase() + '-qr.png'
      link.href = pngUrl
      link.click()
    }
    img.src = url
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 36,
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1f3c', marginBottom: 4 }}>
          Equipment QR Code
        </h2>

        <p style={{ fontSize: '1rem', color: '#8697C4', marginBottom: 4 }}>
          {resource.name}
        </p>

        <p style={{ fontSize: '0.85rem', color: '#8697C4', marginBottom: 20 }}>
          📍 Floor: {resource.floor}
        </p>

        <div id="qr-code-svg">
          <QRCodeSVG
            value={resource.resourceId}
            size={250}
            level="H"
            includeMargin={true}
            style={{ border: '1px solid #ADBBDA', borderRadius: 8 }}
          />
        </div>

        <div
          style={{
            background: '#EDE8F5',
            borderRadius: 8,
            padding: '8px 12px',
            margin: '12px 0',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#3D52A0',
            wordBreak: 'break-all',
            userSelect: 'all',
            cursor: 'text',
          }}
        >
          {resource.resourceId}
        </div>

        <p style={{ fontSize: '0.72rem', color: '#8697C4', marginBottom: 16 }}>
          Click the ID above to select it for copying
        </p>

        <p style={{ fontSize: '0.82rem', color: '#8697C4', marginBottom: 20 }}>
          Print and attach this to the equipment
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⬇ Download QR Code
          </button>

          <button
            onClick={onClose}
            style={{
              background: '#f4f4f8',
              color: '#3a4374',
              border: '1.5px solid #ADBBDA',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
