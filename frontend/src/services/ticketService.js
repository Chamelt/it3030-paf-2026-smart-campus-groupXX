// src/services/ticketService.js
const BASE = import.meta.env.VITE_API_URL || ''

async function req(method, path, { body } = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`

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

async function multiReq(method, path, formData) {
    const headers = {}
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: formData,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        const msg = data.message || data.error || `HTTP ${res.status}`
        throw Object.assign(new Error(msg), { status: res.status, data })
    }

    return data
}

const get   = (p)       => req('GET',    p)
const post  = (p, b)    => req('POST',   p, { body: b })
const put   = (p, b)    => req('PUT',    p, { body: b })
const patch = (p, b)    => req('PATCH',  p, { body: b })
const del   = (p)       => req('DELETE', p)

export function createTicket(formData) {
    return multiReq('POST', '/api/tickets', formData)
}

export function getMyTickets() {
    return get('/api/tickets/my')
}

export function getAllTickets() {
    return get('/api/tickets')
}

export function getAssignedTickets() {
    return get('/api/tickets/assigned')
}

export function getTicketById(id) {
    return get(`/api/tickets/${id}`)
}

export function getResourceTypes() {
    return get('/api/tickets/resource-types')
}

export function getFloors() {
    return get('/api/tickets/floors')
}

export function getResourcesForDropdown(floor, type) {
    const p = new URLSearchParams()
    if (floor) p.set('floor', floor)
    if (type)  p.set('type', type)
    const qs = p.toString()
    return get(`/api/tickets/resources${qs ? `?${qs}` : ''}`)
}

export function getTechniciansByCategory(category) {
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    const qs = p.toString()
    return get(`/api/tickets/technicians${qs ? `?${qs}` : ''}`)
}

export function assignTechnician(id, technicianId) {
    return put(`/api/tickets/${id}/assign`, { technicianId })
}

export function acceptTicket(id, markOutOfService) {
    return post(`/api/tickets/${id}/accept`, { markOutOfService })
}

export function updateTicketStatus(id, body) {
    return patch(`/api/tickets/${id}/status`, body)
}

export function addComment(id, content) {
    return post(`/api/tickets/${id}/comments`, { content })
}

export function editComment(id, commentId, content) {
    return put(`/api/tickets/${id}/comments/${commentId}`, { content })
}

export function deleteComment(id, commentId) {
    return del(`/api/tickets/${id}/comments/${commentId}`)
}
