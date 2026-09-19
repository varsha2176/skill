import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ROLE_ROUTES } from '../../utils/constants';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const home = role ? ROLE_ROUTES[role] || '/' : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-7xl font-extrabold text-blue-600">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
      <p className="text-gray-500 text-sm mt-2 max-w-md">
        The requested screen does not exist or you do not have permission to view it.
      </p>
      <Button className="mt-6" onClick={() => navigate(home)}>
        Return to Dashboard
      </Button>
    </div>
  );
}
