// src/services/api.js
const BASE = import.meta.env.VITE_API_URL || ''

async function req(method, path, { body, userId, userRole } = {}) {
    const headers = { 'Content-Type': 'application/json' }

    // Send JWT token if available (real auth)
    const token = localStorage.getItem('token')
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Fallback: also send X-User-Id for any endpoints that still use it
    if (userId) headers['X-User-Id'] = userId
    if (userRole) headers['X-User-Role'] = userRole

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        const msg = data.message || data.error || `HTTP ${res.status}`
        throw Object.assign(new Error(msg), { status: res.status, data })
    }

    return data
}

const get   = (p, o)    => req('GET',    p, o)
const post  = (p, b, o) => req('POST',   p, { body: b, ...o })
const put   = (p, b, o) => req('PUT',    p, { body: b, ...o })
const patch = (p, b, o) => req('PATCH',  p, { body: b, ...o })
const del   = (p, o)    => req('DELETE', p, o)

export const resourceApi = {
    getAll: () => get('/api/resources'),
    getById: (id) => get(`/api/resources/${id}`),
}

export const bookingApi = {
    create: (data, userId) =>
        post('/api/bookings', data, { userId }),

    getById: (id) =>
        get(`/api/bookings/${id}`),

    getMyBookings: (userId, status) =>
        get(`/api/bookings/my${status ? `?status=${status}` : ''}`, { userId }),

    getAll: (adminId, status) =>
        get(`/api/bookings${status ? `?status=${status}` : ''}`, { userId: adminId }),

    update: (id, data, userId) =>
        put(`/api/bookings/${id}`, data, { userId }),

    markInReview: (id, adminId) =>
        put(`/api/bookings/${id}/review`, {}, { userId: adminId }),

    reject: (id, reason, adminId) =>
        put(`/api/bookings/${id}/reject`, { reason }, { userId: adminId }),

    approve: (id, adminId) =>
        put(`/api/bookings/${id}/approve`, {}, { userId: adminId }),

    cancel: (id, reason, userId, userRole) =>
        put(`/api/bookings/${id}/cancel`, { reason }, { userId, userRole }),

    getCalendar: (resourceId, startDate, endDate) => {
        const p = new URLSearchParams()
        if (resourceId) p.set('resourceId', resourceId)
        if (startDate) p.set('startDate', startDate)
        if (endDate) p.set('endDate', endDate)
        return get(`/api/bookings/calendar?${p}`)
    },

    checkAvailability: (resourceId, date, startTime, endTime, excludeBookingId) => {
        const p = new URLSearchParams({ resourceId, date, startTime, endTime })
        if (excludeBookingId) p.set('excludeBookingId', excludeBookingId)
        return get(`/api/bookings/check-availability?${p}`)
    },

    getStats: (adminId) =>
        get('/api/bookings/stats', { userId: adminId }),

    getPeakHours: (adminId, resourceId) =>
        get(`/api/bookings/peak-hours${resourceId ? `?resourceId=${resourceId}` : ''}`, { userId: adminId }),
}

export const notificationApi = {
    getAll:           (userId)        => get('/api/notifications', { userId }),
    getUnreadCount:   (userId)        => get('/api/notifications/unread-count', { userId }),
    markAsRead:       (id, userId)    => patch(`/api/notifications/${id}/read`, undefined, { userId }),
    markAllAsRead:    (userId)        => patch('/api/notifications/read-all', undefined, { userId }),
    deleteOne:        (id, userId)    => del(`/api/notifications/${id}`, { userId }),
    getPreferences:   (userId)        => get('/api/notifications/preferences', { userId }),
    updatePreferences:(prefs, userId) => put('/api/notifications/preferences', prefs, { userId }),
    broadcast:        (message, adminId) => post('/api/notifications/broadcast', { message }, { userId: adminId }),
    broadcastToAdmins:(message, adminId) => post('/api/notifications/broadcast/admins', { message }, { userId: adminId }),
}