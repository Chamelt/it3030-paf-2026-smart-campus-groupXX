// Feature branch: feature/E-user-management-page
// ADMIN-only page — redesigned with blue palette, hero banner, search, avatar initials, skeleton loader.
// Lists all registered users. Allows changing roles via dropdown.
// Admins cannot change their own role to prevent accidental self-demotion.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import './UserManagementPage.css'

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN']

function Initials({ name }) {
  const parts = (name || '?').split(' ')
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  return <div className="user-cell-initials">{initials.toUpperCase()}</div>
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [updating, setUpdating] = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    axiosInstance.get('/api/users')
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId)
    try {
      const res = await axiosInstance.patch(`/api/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.userId === userId ? res.data : u))
    } catch {
      alert('Failed to update role. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const roleBadgeClass = role => ({ ADMIN: 'badge-admin', TECHNICIAN: 'badge-tech', USER: 'badge-user' }[role] ?? 'badge-user')

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="user-mgmt-page">



      {/* ── Hero ── */}
      <div className="user-mgmt-hero">
        <img src="/campus_admin.png" alt="User management" className="user-mgmt-hero-img" />
        <div className="user-mgmt-hero-overlay">
          <h1>👥 User Management</h1>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="user-mgmt-main">

        {/* Toolbar */}
        <div className="user-mgmt-toolbar">
          <div className="user-mgmt-search">
            <span className="user-mgmt-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!loading && !error && (
            <span className="user-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''} found</span>
          )}
        </div>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Table */}
        <div className="user-table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows while loading */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div className="skeleton-line" style={{ width: j === 0 ? '140px' : j === 1 ? '180px' : '80px' }} /></td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!loading && filtered.map(u => (
                <tr key={u.userId}>
                  <td>
                    <div className="user-cell">
                      {u.profilePictureUrl
                        ? <img src={u.profilePictureUrl} alt={u.name} className="user-cell-avatar" referrerPolicy="no-referrer" />
                        : <Initials name={u.name} />
                      }
                      <div className="user-cell-info">
                        <strong>
                          {u.name}
                          {u.userId === currentUser?.userId && ' (You)'}
                        </strong>
                        <small>{u.oauthProvider}</small>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                  <td>
                    <select
                      className="role-select"
                      value={u.role}
                      disabled={updating === u.userId || u.userId === currentUser?.userId}
                      onChange={e => handleRoleChange(u.userId, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {updating === u.userId && <span style={{ fontSize: '0.8rem', color: 'var(--clr-700)', marginLeft: 8 }}>Updating…</span>}
                  </td>
                  <td>
                    <span className={u.active ? 'status-active' : 'status-inactive'}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="user-table-empty">
                      <p>😕 No users match your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
