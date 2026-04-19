// Feature branch: feature/E-dashboard-page
// Main landing page for authenticated users.
// Shows a hero image carousel, role-aware navigation cards with images, and the user's profile summary.
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './DashboardPage.css'

const HERO_SLIDES = [
  { bg: '/campus_hero.png',        title: 'Welcome to Smart Campus',      desc: 'Manage everything at Horizonia University from one hub.' },
  { bg: '/campus_bookings.png',    title: 'Book Rooms & Equipment',       desc: 'Reserve spaces and resources in just a few clicks.' },
  { bg: '/campus_resources.png',   title: 'Explore Campus Resources',     desc: 'Browse and filter all available campus facilities.' },
  { bg: '/campus_maintenance.png', title: 'Report Campus Issues',         desc: 'Submit maintenance tickets and track their resolution.' },
]

export default function DashboardPage() {
  const { user, logout, isAdmin, isTechnician } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % HERO_SLIDES.length), [])
  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const roleBadgeClass = { ADMIN: 'badge-admin', TECHNICIAN: 'badge-tech', USER: 'badge-user' }[user?.role] ?? 'badge-user'

  return (
    <div className="dashboard-page">



      {/* ── Hero Carousel ── */}
      <section className="hero-carousel" aria-label="Campus highlights">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`hero-slide${i === current ? ' active' : ''}`}
            style={{ backgroundImage: `url(${s.bg})` }}
          />
        ))}
        <div className="hero-overlay">
          <h1>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{HERO_SLIDES[current].desc}</p>
        </div>
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="dashboard-main">

        {/* Section header */}
        <div className="section-header">
          <h2>Campus Services</h2>
          <p>Horizonia University — Smart Campus Operations Hub</p>
        </div>

        {/* Cards */}
        <div className="cards-grid">

          {/* Bookings */}
          <div className="dash-card" style={{ animationDelay: '0.05s' }}>
            <img src="/campus_bookings.png" alt="Bookings" className="dash-card-img" />
            <div className="dash-card-body">
              <h3>📅 My Bookings</h3>
              <p>View and manage your room &amp; equipment bookings.</p>
              <button className="btn-primary" onClick={() => navigate('/bookings/my')}>Go to Bookings</button>
            </div>
          </div>

          {/* Tickets */}
          <div className="dash-card" style={{ animationDelay: '0.10s' }}>
            <img src="/campus_maintenance.png" alt="Tickets" className="dash-card-img" />
            <div className="dash-card-body">
              <h3>🔧 My Tickets</h3>
              <p>Track your maintenance and incident reports.</p>
              <button className="btn-primary" onClick={() => navigate('/tickets/my')}>Go to Tickets</button>
            </div>
          </div>

          {/* Resources */}
          <div className="dash-card" style={{ animationDelay: '0.15s' }}>
            <img src="/campus_resources.png" alt="Resources" className="dash-card-img" />
            <div className="dash-card-body">
              <h3>🏫 Resource Catalogue</h3>
              <p>Browse and filter all campus rooms and equipment.</p>
              <button className="btn-primary" onClick={() => navigate('/resources')}>Browse Resources</button>
            </div>
          </div>

          {/* Admin card */}
          {(isAdmin || isTechnician) && (
            <div className="dash-card dash-card-admin" style={{ animationDelay: '0.20s' }}>
              <img src="/campus_admin.png" alt="Admin" className="dash-card-img" />
              <div className="dash-card-body">
                <h3>⚙️ Admin Panel</h3>
                <p>Manage bookings, tickets, resources, and users.</p>
                <div className="admin-links">
                  {isAdmin && (
                    <>
                      <button className="btn-secondary" onClick={() => navigate('/admin/bookings')}>All Bookings</button>
                      <button className="btn-secondary" onClick={() => navigate('/admin/users')}>Manage Users</button>
                      <button className="btn-secondary" onClick={() => navigate('/admin/resources')}>Manage Resources</button>
                    </>
                  )}
                  <button className="btn-secondary" onClick={() => navigate('/admin/tickets')}>All Tickets</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className="profile-section">
          <h2>My Profile</h2>
          <div className="profile-card">
            {user?.profilePictureUrl && (
              <img src={user.profilePictureUrl} alt={user.name} className="profile-avatar" referrerPolicy="no-referrer" />
            )}
            <div className="profile-info">
              <p><span>Name</span>{user?.name}</p>
              <p><span>Email</span>{user?.email}</p>
              <p><span>Role</span><span className={`badge ${roleBadgeClass}`}>{user?.role}</span></p>
              <p><span>Account created</span>{new Date(user?.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
