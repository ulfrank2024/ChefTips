import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, selectCompany } from '../api/authApi';
import { getSubscriptionStatus } from '../api/billingApi'; // Import billingApi
import { jwtDecode } from "jwt-decode";
import i18n from '../i18n';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children, navigate }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('userToken'));
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null); // New state for subscription status

    useEffect(() => {
        const processToken = async () => { // Make this async
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

                    // Fetch subscription status if user is a manager and has a company_id
                    if (decoded.role === 'manager' && decoded.company_id) {
                        try {
                            const status = await getSubscriptionStatus(decoded.company_id);
                            setSubscriptionStatus(status);
                            console.log("Subscription Status:", status);
                        } catch (subError) {
                            console.error("Failed to fetch subscription status:", subError);
                            setSubscriptionStatus({ status: 'error', message: 'Failed to load subscription status.' });
                        }
                    } else {
                        setSubscriptionStatus(null); // Clear status if not a manager or no company
                    }

                } catch (error) {
                    console.error("Failed to decode token:", error);
                    logout();
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                setSubscriptionStatus(null); // Clear status if no token
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
        setSubscriptionStatus(null); // Clear subscription status on logout
        localStorage.removeItem('userToken');
    };

    const handleTokenUpdate = (newToken) => {
        localStorage.setItem('userToken', newToken);
        setToken(newToken);
        try {
            const decoded = jwtDecode(newToken);
            setUser(decoded);
            // Re-fetch subscription status on token update if manager
            if (decoded.role === 'manager' && decoded.company_id) {
                getSubscriptionStatus(decoded.company_id)
                    .then(setSubscriptionStatus)
                    .catch(subError => {
                        console.error("Failed to fetch subscription status on token update:", subError);
                        setSubscriptionStatus({ status: 'error', message: 'Failed to load subscription status.' });
                    });
            } else {
                setSubscriptionStatus(null);
            }
        } catch (error) {
            console.error("Failed to decode token on update:", error);
            // If decoding fails, the token is likely invalid, so log out
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, selectCompanyAndLogin, logout, isLoading, handleTokenUpdate, subscriptionStatus, setSubscriptionStatus }}>
            {children}
        </AuthContext.Provider>
    );
};
