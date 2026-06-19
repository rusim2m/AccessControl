import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import ManageDealers from './pages/admin/ManageDealers'
import ManageOrganizations from './pages/admin/ManageOrganizations'
import AdminDevices from './pages/admin/AdminDevices'

// Dealer
import DealerLayout from './pages/dealer/DealerLayout'
import DealerOrganizations from './pages/dealer/DealerOrganizations'
import DealerClients from './pages/dealer/DealerClients'
import DealerDevices from './pages/dealer/DealerDevices'

// Client
import ClientLayout from './pages/client/ClientLayout'
import ManageEmployees from './pages/client/ManageEmployees'
import ManageCards from './pages/client/ManageCards'
import ManageZones from './pages/client/ManageZones'
import ManageSchedules from './pages/client/ManageSchedules'
import ManageAccessRules from './pages/client/ManageAccessRules'
import ManageReaders from './pages/client/ManageReaders'
import ClientAccessLogs from './pages/client/ClientAccessLogs'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dealers" replace />} />
            <Route path="dealers" element={<ManageDealers />} />
            <Route path="organizations" element={<ManageOrganizations />} />
            <Route path="devices" element={<AdminDevices />} />
          </Route>

          {/* Dealer routes */}
          <Route
            path="/dealer"
            element={
              <ProtectedRoute requiredRole="Dealer">
                <DealerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="organizations" replace />} />
            <Route path="organizations" element={<DealerOrganizations />} />
            <Route path="clients" element={<DealerClients />} />
            <Route path="devices" element={<DealerDevices />} />
          </Route>

          {/* Client routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute requiredRole="Client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="logs" replace />} />
            <Route path="employees" element={<ManageEmployees />} />
            <Route path="cards" element={<ManageCards />} />
            <Route path="readers" element={<ManageReaders />} />
            <Route path="zones" element={<ManageZones />} />
            <Route path="schedules" element={<ManageSchedules />} />
            <Route path="access-rules" element={<ManageAccessRules />} />
            <Route path="logs" element={<ClientAccessLogs />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
