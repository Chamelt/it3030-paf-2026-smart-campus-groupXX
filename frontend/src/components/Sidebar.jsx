import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import './Sidebar.css'

export default function Sidebar() {
  const { user, logout, isAdmin, isTechnician } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <div className="sidebar-logo">H</div>
        <div className="sidebar-brand-text">
          <strong>Smart Campus</strong>
          <span>Operations Hub</span>
        </div>
      </div>

      <div className="sidebar-menu">
        <span className="menu-label">Menu</span>
        <NavLink to="/" className={({isActive}) => isActive ? "menu-link active" : "menu-link"} end>
          🏠 Dashboard
        </NavLink>
        <NavLink to="/resources" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
          🏫 Resources
        </NavLink>
        <NavLink to="/bookings/my" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
          📅 My Bookings
        </NavLink>
        <NavLink to="/tickets/my" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
          🔧 My Tickets
        </NavLink>
        <NavLink to="/tickets/new" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
          ➕ Report Issue
        </NavLink>
        <NavLink to="/notifications" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
          🔔 Notifications
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#e53935',
              color: 'white',
              borderRadius: '10px',
              padding: '1px 7px',
              fontSize: '0.7rem',
              fontWeight: 700,
              lineHeight: '1.6',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        {(isAdmin || isTechnician) && (
          <>
            <span className="menu-label" style={{ marginTop: '20px' }}>Admin</span>
            <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "menu-link active" : "menu-link"} end>
              ⚙️ Admin Panel
            </NavLink>
            {isAdmin && (
               <NavLink to="/admin/users" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 👥 Manage Users
               </NavLink>
            )}
            {isAdmin && (
               <NavLink to="/admin/technicians" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 🔧 Manage Technicians
               </NavLink>
            )}
            {isAdmin && (
               <NavLink to="/admin/resources" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 🏢 Manage Resources
               </NavLink>
            )}
            <NavLink to="/admin/tickets" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              🎫 All Tickets
            </NavLink>
            {isTechnician && (
               <NavLink to="/technician/tickets" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 📋 My Tasks
               </NavLink>
            )}
            {isTechnician && (
               <NavLink to="/technician/scan" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 📷 Scan QR Code
               </NavLink>
            )}
            {isAdmin && (
               <NavLink to="/admin/analytics" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 📊 Ticket Analytics
               </NavLink>
            )}
            {isAdmin && (
               <NavLink to="/admin/broadcast" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
                 📢 Broadcast
               </NavLink>
            )}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {user?.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt="avatar" className="sidebar-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="sidebar-avatar-placeholder">{user?.name?.charAt(0) || '?'}</div>
          )}
          <div className="sidebar-user-info">
            <strong>{user?.name || 'Guest'}</strong>
            <span>{user?.role || 'USER'}</span>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
             ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
