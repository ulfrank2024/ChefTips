import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from "jwt-decode";
import i18n from '../i18n';
import { login as apiLogin } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const isExpired = decoded.exp * 1000 < Date.now();

                if (isExpired) {
                    logout();
                    return;
                }

                // Assuming admin users might have a preferred language too
                if (decoded.preferred_language) {
                    i18n.changeLanguage(decoded.preferred_language);
                }
                
                // We expect a specific role for admins
                if (decoded.role === 'admin') {
                    setUser(decoded);
                } else {
                    // If the token is valid but not for an admin, log out
                    logout();
                }

            } catch (error) {
                console.error("Failed to decode admin token:", error);
                logout();
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        localStorage.setItem('adminToken', data.token);
        setToken(data.token); // This will trigger the useEffect
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('adminToken');
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !isLoading && !!user,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
