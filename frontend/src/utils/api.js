import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)


export const login = (email, password) =>  api.post('/auth/login', { email, password })
export const getDealers = () => api.get('/admin/dealers')
export const createDealer = (data) => api.post('/admin/dealers', data)
export const updateDealer = (id, data) => api.put(`/admin/dealers/${id}`, data)
export const deleteDealer = (id) => api.delete(`/admin/dealers/${id}`)
export const getAdminOrganizations = () => api.get('/admin/organizations')
export const getAdminDevices = () => api.get('/admin/devices')
export const manufactureDevice = () => api.post('/admin/devices')
export const assignDeviceToDealer = (id, data) => api.put(`/admin/devices/${id}/assign-dealer`, data)
export const getDealerOrganizations = () => api.get('/dealer/organizations')
export const createOrganization = (data) => api.post('/dealer/organizations', data)
export const updateOrganization = (id, data) => api.put(`/dealer/organizations/${id}`, data)
export const deleteOrganization = (id) => api.delete(`/dealer/organizations/${id}`)
export const getDealerClients = () => api.get('/dealer/clients')
export const createDealerClient = (data) => api.post('/dealer/clients', data)
export const updateDealerClient = (id, data) => api.put(`/dealer/clients/${id}`, data)
export const deleteDealerClient = (id) => api.delete(`/dealer/clients/${id}`)
export const getDealerReaders = () => api.get('/dealer/readers')
export const assignReaderToOrganization = (id, data) => api.put(`/dealer/readers/${id}/assign-organization`, data)
export const downloadReaderConfig = (id) => api.get(`/dealer/readers/${id}/config`, { responseType: 'blob' })
export const getDealerCards = () => api.get('/dealer/cards')
export const createDealerCard = (data) => api.post('/dealer/cards', data)
export const provisionDealerCard = (data) => api.post('/dealer/cards/provision', data, { timeout: 40000 })
export const getEmployees = () => api.get('/client/employees')
export const createEmployee = (data) => api.post('/client/employees', data)
export const updateEmployee = (id, data) => api.put(`/client/employees/${id}`, data)
export const deleteEmployee = (id) => api.delete(`/client/employees/${id}`)
export const getZones = () => api.get('/client/zones')
export const createZone = (data) => api.post('/client/zones', data)
export const updateZone = (id, data) => api.put(`/client/zones/${id}`, data)
export const deleteZone = (id) => api.delete(`/client/zones/${id}`)
export const getCards = () => api.get('/client/cards')
export const createCard = (data) => api.post('/client/cards', data)
export const updateCard = (id, data) => api.put(`/client/cards/${id}`, data)
export const assignCard = (id, employeeId) => api.put(`/client/cards/${id}/assign`, { employeeId })
export const getSchedules = () => api.get('/client/schedules')
export const createSchedule = (data) => api.post('/client/schedules', data)
export const updateSchedule = (id, data) => api.put(`/client/schedules/${id}`, data)
export const deleteSchedule = (id) => api.delete(`/client/schedules/${id}`)
export const getClientReaders = () => api.get('/client/readers')
export const assignReaderToZone = (id, data) => api.put(`/client/readers/${id}/assign-zone`, data)
export const getAccessRules = () => api.get('/client/access-rules')
export const createAccessRule = (data) => api.post('/client/access-rules', data)
export const updateAccessRule = (id, data) => api.put(`/client/access-rules/${id}`, data)
export const deleteAccessRule = (id) => api.delete(`/client/access-rules/${id}`)
export const getClientAccessLogs = (params) => api.get('/client/access-logs', { params })

export default api
