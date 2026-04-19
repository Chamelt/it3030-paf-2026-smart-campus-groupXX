// Feature branch: feature/E-not-found-page
// Redesigned 404/403 error page with blue palette.
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage({ code = 404, message = "The page you're looking for doesn't exist." }) {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 20px',
      gap: '16px',
      animation: 'fadeUp 0.5s ease both',
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '22px',
        background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', color: '#fff',
        boxShadow: '0 8px 28px rgba(61,82,160,0.25)',
        marginBottom: 8,
      }}>
        {code === 403 ? '🔒' : '🔍'}
      </div>
      <h1 style={{ fontSize: '5rem', fontWeight: 900, color: '#3D52A0', lineHeight: 1, margin: 0 }}>{code}</h1>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1f3c', margin: 0 }}>
        {code === 403 ? 'Access Denied' : 'Page Not Found'}
      </h2>
      <p style={{ fontSize: '0.95rem', color: '#8697C4', maxWidth: 380, textAlign: 'center', margin: 0 }}>
        {message}
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 12,
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(61,82,160,0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
