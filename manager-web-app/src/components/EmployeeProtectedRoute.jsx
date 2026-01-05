import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const EmployeeProtectedRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Or a spinner
    }

    if (!user || (user.role || 'employee').toLowerCase() === 'manager' || (user.role || 'employee').toLowerCase() === 'admin') {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default EmployeeProtectedRoute;
