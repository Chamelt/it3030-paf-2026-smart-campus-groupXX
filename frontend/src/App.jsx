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

// Module C — Maintenance & Incident Ticketing
import MyTicketsPage          from './pages/tickets/MyTicketsPage'
import NewTicketPage          from './pages/tickets/NewTicketPage'
import TicketDetailPage       from './pages/tickets/TicketDetailPage'
import AllTicketsPage         from './pages/admin/AllTicketsPage'
import TechnicianTicketsPage  from './pages/technician/TechnicianTicketsPage'
import TicketAnalyticsPage    from './pages/admin/TicketAnalyticsPage'
import ManageTechniciansPage  from './pages/admin/ManageTechniciansPage'


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
            <Route path="/admin/tickets"   element={<ProtectedRoute role={["ADMIN", "TECHNICIAN"]}><AllTicketsPage /></ProtectedRoute>} />

            {/* Protected — ADMIN only */}
            <Route path="/admin/users"     element={<ProtectedRoute role="ADMIN"><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/bookings"  element={<ProtectedRoute role="ADMIN"><AdminBookingsPage /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute role="ADMIN"><ManageResourcesPage /></ProtectedRoute>} />
            <Route path="/admin/analytics"    element={<ProtectedRoute role="ADMIN"><TicketAnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/technicians" element={<ProtectedRoute role="ADMIN"><ManageTechniciansPage /></ProtectedRoute>} />

            {/* Protected — TECHNICIAN only */}
            <Route path="/technician/tickets" element={<ProtectedRoute role="TECHNICIAN"><TechnicianTicketsPage /></ProtectedRoute>} />

            {/* Placeholders — other modules will fill these in */}
            <Route path="/resources"          element={<ResourcesPage />} />
            <Route path="/bookings/my"        element={<MyBookingsPage />} />
            <Route path="/bookings/new"       element={<div style={{ padding: 40 }}>Module B – New Booking (Member 2)</div>} />
            <Route path="/bookings/calendar"  element={<div style={{ padding: 40 }}>Module B – Calendar (Member 2)</div>} />
            <Route path="/technician/scan"    element={<QrScannerPage />} />

            {/* Module C — Ticket routes */}
            <Route path="/tickets/my"  element={<MyTicketsPage />} />
            <Route path="/tickets/new" element={<NewTicketPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Route>

          {/* Error pages */}
          <Route path="/403" element={<NotFoundPage code={403} message="You don't have permission to view this page." />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
