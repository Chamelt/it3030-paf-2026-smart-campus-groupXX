import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import OAuth2RedirectPage from './pages/OAuth2RedirectPage'

import DashboardPage      from './pages/DashboardPage'
import Layout             from './components/Layout'
import UserManagementPage  from './pages/admin/UserManagementPage'
import AdminDashboardPage  from './pages/admin/AdminDashboardPage'
import ManageResourcesPage from './pages/admin/ManageResourcesPage'
import NotFoundPage        from './pages/NotFoundPage'

import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import ResourcesPage from './pages/ResourcesPage'
import MyBookingsPage from './pages/MyBookingsPage'
import QrScannerPage from './pages/QrScannerPage'


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />

          {/* Protected — any authenticated user */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />

            {/* Protected — ADMIN + TECHNICIAN */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role={["ADMIN", "TECHNICIAN"]}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute role={["ADMIN", "TECHNICIAN"]}><div style={{ padding: 40 }}>Module C – All Tickets (Member 3)</div></ProtectedRoute>} />

            {/* Protected — ADMIN only */}

            <Route path="/admin/users"     element={<ProtectedRoute role="ADMIN"><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/bookings"  element={<ProtectedRoute role="ADMIN"><AdminBookingsPage /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute role="ADMIN"><ManageResourcesPage /></ProtectedRoute>} />

          

            {/* Placeholders — other modules will fill these in */}
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/bookings/my" element={<MyBookingsPage />} />
            <Route path="/bookings/new" element={<div style={{ padding: 40 }}>Module B – New Booking (Member 2)</div>} />
            <Route path="/bookings/calendar" element={<div style={{ padding: 40 }}>Module B – Calendar (Member 2)</div>} />
            <Route path="/technician/scan" element={<QrScannerPage />} />
            <Route path="/tickets/my" element={<div style={{ padding: 40 }}>Module C – My Tickets (Member 3)</div>} />
            <Route path="/tickets/new" element={<div style={{ padding: 40 }}>Module C – New Ticket (Member 3)</div>} />
            <Route path="/tickets/:id" element={<div style={{ padding: 40 }}>Module C – Ticket Detail (Member 3)</div>} />
          </Route>

          {/* Error pages */}
          <Route path="/403" element={<NotFoundPage code={403} message="You don't have permission to view this page." />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
