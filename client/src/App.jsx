import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Phase 1 Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { WingsAndFlats } from './pages/admin/WingsAndFlats';
import { ResidentsDirectory } from './pages/admin/ResidentsDirectory';
import { AdminStaffManagement } from './pages/admin/AdminStaffManagement';
import { AdminBilling } from './pages/admin/AdminBilling';

// Phase 2 Admin Pages
import { AdminNotices } from './pages/admin/AdminNotices';
import { AdminComplaints } from './pages/admin/AdminComplaints';

// Phase 3 Pages
import { AdminAmenities } from './pages/admin/AdminAmenities';
import { ResidentAmenities } from './pages/resident/ResidentAmenities';
import { CommunityPolls } from './pages/common/CommunityPolls';

// Resident Pages
import { ResidentDashboard } from './pages/resident/ResidentDashboard';
import { ResidentNotices } from './pages/resident/ResidentNotices';
import { ResidentHelpdesk } from './pages/resident/ResidentHelpdesk';
import { ResidentVisitors } from './pages/resident/ResidentVisitors';

// Security Guard Pages
import { SecurityTerminal } from './pages/security/SecurityTerminal';
import { SecurityLogs } from './pages/security/SecurityLogs';

// Common Pages
import { Unauthorized } from './pages/common/Unauthorized';
import { NotFound } from './pages/common/NotFound';

// Smart root redirect based on logged in user's role
const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'SOCIETY_ADMIN' || user.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'SECURITY') {
    return <Navigate to="/security/terminal" replace />;
  }

  return <Navigate to="/resident/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Root Redirector */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Application Layout Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/wings"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <WingsAndFlats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/residents"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentsDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminStaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminBilling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notices"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminNotices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/amenities"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <AdminAmenities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/community"
                element={
                  <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <CommunityPolls />
                  </ProtectedRoute>
                }
              />

              {/* Resident Routes */}
              <Route
                path="/resident/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resident/amenities"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentAmenities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resident/community"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <CommunityPolls />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resident/notices"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentNotices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resident/helpdesk"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentHelpdesk />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resident/visitors"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <ResidentVisitors />
                  </ProtectedRoute>
                }
              />

              {/* Security Guard Routes */}
              <Route
                path="/security/terminal"
                element={
                  <ProtectedRoute allowedRoles={['SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <SecurityTerminal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/security/logs"
                element={
                  <ProtectedRoute allowedRoles={['SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                    <SecurityLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Error & Fallback Routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
