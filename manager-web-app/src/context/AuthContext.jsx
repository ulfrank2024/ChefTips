import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, selectCompany } from '../api/authApi';
import { jwtDecode } from "jwt-decode";
import i18n from '../i18n';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('userToken'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const processToken = () => {
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    const isExpired = decoded.exp * 1000 < Date.now();

                    if (isExpired) {
                        console.log("Token expired.");
                        logout();
                        return;
                    }

                    if (decoded.preferred_language) {
                        i18n.changeLanguage(decoded.preferred_language);
                    }
                    
                    setUser(decoded);
                    console.log("Decoded user in AuthContext:", decoded);

                } catch (error) {
                    console.error("Failed to decode token:", error);
                    logout();
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        processToken();
    }, [token]);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        if (data.success_code === "MULTIPLE_COMPANIES_CHOOSE_ONE") {
            return { success_code: data.success_code, userId: data.userId, memberships: data.memberships };
        } else {
            localStorage.setItem('userToken', data.token);
            setToken(data.token); // This will trigger the useEffect
            return jwtDecode(data.token);
        }
    };

    const selectCompanyAndLogin = async (userId, companyId) => {
        const data = await selectCompany(userId, companyId);
        localStorage.setItem('userToken', data.token);
        setToken(data.token); // This will trigger the useEffect
        return jwtDecode(data.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('userToken');
        sessionStorage.removeItem('welcomeShown'); // Clear the welcome flag
    };

    const handleTokenUpdate = (newToken) => {
        localStorage.setItem('userToken', newToken);
        setToken(newToken);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, selectCompanyAndLogin, logout, isLoading, handleTokenUpdate }}>
            {children}
        </AuthContext.Provider>
    );
};
