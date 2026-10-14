import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If student tries to access admin route, redirect to student dashboard
    if (user.role === 'STUDENT') {
      return <Navigate to="/student" replace />;
    }
    // If admin tries to access student route, redirect to admin dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
