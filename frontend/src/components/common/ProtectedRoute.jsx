import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_ROUTES } from '../../utils/constants';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute({ allowedRoles, requireSme, children }) {
  const { isAuthenticated, role, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const redirectPath = ROLE_ROUTES[role] || '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  if (requireSme && !user?.is_sme && role !== 'ADMIN') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
