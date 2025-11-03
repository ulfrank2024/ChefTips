import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ManagerProtectedRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Or a spinner
    }

    if (!user || (user.role.toLowerCase() !== 'manager' && user.role.toLowerCase() !== 'gerant')) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ManagerProtectedRoute;
