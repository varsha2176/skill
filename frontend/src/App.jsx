import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLE_ROUTES } from './utils/constants';

// Layout & Protection
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeSkills } from './pages/employee/EmployeeSkills';
import { EmployeeSkillGaps } from './pages/employee/EmployeeSkillGaps';
import { EmployeeRoadmap } from './pages/employee/EmployeeRoadmap';
import { EmployeeTraining } from './pages/employee/EmployeeTraining';

// SME Pages
import { SMEDashboard } from './pages/sme/SMEDashboard';
import { SMESkills } from './pages/sme/SMESkills';
import { SMETraining } from './pages/sme/SMETraining';
import { SMELearners } from './pages/sme/SMELearners';
import { SMEHistory } from './pages/sme/SMEHistory';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { TeamSkills } from './pages/manager/TeamSkills';
import { SkillValidations } from './pages/manager/SkillValidations';
import { ManagerSkillGaps } from './pages/manager/ManagerSkillGaps';
import { ManagerProjects } from './pages/manager/ManagerProjects';
import { ManagerReports } from './pages/manager/ManagerReports';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SkillManagement } from './pages/admin/SkillManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { AdminReports } from './pages/admin/AdminReports';

// Shared Pages
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { NotFoundPage } from './pages/shared/NotFoundPage';

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const target = ROLE_ROUTES[role] || '/employee/dashboard';
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Routes with Global Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Employee Routes - Allowed for EMPLOYEE, MANAGER, ADMIN */}
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/profile" element={<EmployeeProfile />} />
              <Route path="/employee/skills" element={<EmployeeSkills />} />
              <Route path="/employee/skill-gaps" element={<EmployeeSkillGaps />} />
              <Route path="/employee/roadmap" element={<EmployeeRoadmap />} />
              <Route path="/employee/training" element={<EmployeeTraining />} />
              <Route path="/employee/notifications" element={<NotificationsPage />} />

              {/* SME Capability Routes - Requires is_sme=true or ADMIN */}
              <Route element={<ProtectedRoute requireSme={true} />}>
                <Route path="/sme/dashboard" element={<SMEDashboard />} />
                <Route path="/sme/skills" element={<SMESkills />} />
                <Route path="/sme/training" element={<SMETraining />} />
                <Route path="/sme/learners" element={<SMELearners />} />
                <Route path="/sme/history" element={<SMEHistory />} />
                <Route path="/sme/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Manager Routes - Allowed for MANAGER, ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />}>
                <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                <Route path="/manager/team-skills" element={<TeamSkills />} />
                <Route path="/manager/validations" element={<SkillValidations />} />
                <Route path="/manager/skill-gaps" element={<ManagerSkillGaps />} />
                <Route path="/manager/projects" element={<ManagerProjects />} />
                <Route path="/manager/reports" element={<ManagerReports />} />
                <Route path="/manager/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Admin Routes - Allowed for ADMIN only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/skills" element={<SkillManagement />} />
                <Route path="/admin/courses" element={<CourseManagement />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
