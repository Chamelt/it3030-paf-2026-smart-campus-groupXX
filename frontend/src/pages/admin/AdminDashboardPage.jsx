// Feature branch: feature/E-admin-dashboard
// Landing page for ADMIN and TECHNICIAN users — redesigned with blue palette, hero banner, image cards.
// ADMIN sees all cards. TECHNICIAN sees only Maintenance Tickets and User Dashboard.
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AdminDashboardPage.css'

const ADMIN_CARDS = [
  {
    img:      '/campus_admin.png',
    icon:     '👥',
    title:    'User Management',
    desc:     'View all users. Promote or demote roles (USER / ADMIN / TECHNICIAN).',
    route:    '/admin/users',
    btnLabel: 'Open',
    primary:  true,
    adminOnly: true,   // ADMIN only
  },
  {
    img:      '/campus_resources.png',
    icon:     '🏢',
    title:    'Resource Management',
    desc:     'Add, edit, and manage campus resources and their availability.',
    route:    '/admin/resources',
    btnLabel: 'Open',
    primary:  true,
    adminOnly: true,   // ADMIN only
  },
  {
    img:      '/campus_bookings.png',
    icon:     '📅',
    title:    'Booking Approvals',
    desc:     'Review, approve, or reject pending booking requests.',
    route:    '/admin/bookings',
    btnLabel: 'Open',
    primary:  true,
    adminOnly: true,   // ADMIN only
  },
  {
    img:      '/campus_maintenance.png',
    icon:     '🔧',
    title:    'Maintenance Tickets',
    desc:     'Manage maintenance requests and assign them to technicians.',
    route:    '/admin/tickets',
    btnLabel: 'Open',
    primary:  true,
    adminOnly: false,  // ADMIN + TECHNICIAN
  },
  {
    img:      '/campus_hero.png',
    icon:     '🏠',
    title:    'User Dashboard',
    desc:     'Switch to the regular user view of the campus hub.',
    route:    '/',
    btnLabel: 'Go',
    primary:  false,
    adminOnly: false,  // ADMIN + TECHNICIAN
  },
]

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Filter cards based on role
  const visibleCards = ADMIN_CARDS.filter(card => !card.adminOnly || isAdmin)

  return (
    <div className="admin-dashboard">



      {/* ── Hero Banner ── */}
      <div className="admin-hero">
        <img src="/campus_admin.png" alt="Admin hero" className="admin-hero-img" />
        <div className="admin-hero-overlay">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.name}. Manage the campus from here.</p>
        </div>
      </div>

      {/* ── Page body ── */}
      <main className="admin-main">
        <h1 className="admin-title">Management Modules</h1>
        <p className="admin-subtitle">Select a module below to manage campus operations.</p>

        <div className="admin-grid">
          {visibleCards.map((card, i) => (
            <div
              key={card.route}
              className="admin-card"
              style={{ animationDelay: `${i * 0.07}s` }}
              onClick={() => navigate(card.route)}
            >
              <img src={card.img} alt={card.title} className="admin-card-img" />
              <div className="admin-card-body">
                <h2>{card.icon} {card.title}</h2>
                <p>{card.desc}</p>
                <button
                  className={card.primary ? 'btn-primary' : 'btn-secondary'}
                  onClick={e => { e.stopPropagation(); navigate(card.route) }}
                >
                  {card.btnLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
