import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route and enforces authentication + optional role check.
 *
 * Usage:
 *   <ProtectedRoute>                              — any logged-in user
 *   <ProtectedRoute role="ADMIN">                 — ADMIN only
 *   <ProtectedRoute role={["ADMIN","TECHNICIAN"]} — ADMIN or TECHNICIAN
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return <Navigate to="/403" replace />
    }
  }

  return children
}
