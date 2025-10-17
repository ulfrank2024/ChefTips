import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, selectCompany, getCompanyEmployees } from '../api/authApi';
import { getCategories } from '../api/tipApi';
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
        const enrichUserAndSet = async (tokenToDecode) => {
            try {
                const decoded = jwtDecode(tokenToDecode);
                const isExpired = decoded.exp * 1000 < Date.now();

                if (isExpired) {
                    console.log("Token expired.");
                    logout();
                    return;
                }

                if (decoded.preferred_language) {
                    i18n.changeLanguage(decoded.preferred_language);
                }

                if (decoded.role !== 'employee') {
                    setUser(decoded);
                    console.log("Decoded user in AuthContext (manager):", decoded);
                    setIsLoading(false);
                    return;
                }

                const [employees, categories] = await Promise.all([
                    getCompanyEmployees(),
                    getCategories()
                ]);

                const currentUserMembership = employees.find(emp => emp.id === decoded.id);
                
                let departmentType = null;
                if (currentUserMembership && currentUserMembership.category_id) {
                    const assignedCategory = categories.find(cat => cat.id === currentUserMembership.category_id);
                    if (assignedCategory) {
                        departmentType = assignedCategory.department_type;
                    }
                }

                const enrichedUser = {
                    ...decoded,
                    department_type: departmentType, // 'COLLECTOR', 'RECEIVER', or null
                };
                
                setUser(enrichedUser);
                console.log("Enriched user in AuthContext (employee):", enrichedUser);

            } catch (error) {
                console.error("Failed to enrich user or invalid token:", error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            enrichUserAndSet(token);
        } else {
            setIsLoading(false);
        }
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
