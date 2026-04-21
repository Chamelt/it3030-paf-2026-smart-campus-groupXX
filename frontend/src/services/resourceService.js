import axiosInstance from '../api/axiosInstance'

export async function getAllResources(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
  )
  return axiosInstance.get('/api/resources', { params }).then(r => r.data)
}

export async function getResourceById(id) {
  return axiosInstance.get(`/api/resources/${id}`).then(r => r.data)
}

export async function createResource(formData) {
  return axiosInstance.post('/api/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export async function updateResource(id, formData) {
  return axiosInstance.put(`/api/resources/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export async function updateResourceStatus(id, newStatus) {
  return axiosInstance.patch(
    `/api/resources/${id}/status`,
    { status: newStatus }
  ).then(r => r.data)
}

export async function deleteResource(id) {
  return axiosInstance.delete(`/api/resources/${id}`)
}
