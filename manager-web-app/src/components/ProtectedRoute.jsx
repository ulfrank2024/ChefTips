import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = () => {
    const { token } = useAuth();

    if (!token) {
        // If no token, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If token exists, render the nested routes
    return <Outlet />;
};

export default ProtectedRoute;
