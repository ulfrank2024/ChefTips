import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || "http://13.220.169.115:3000/api/auth";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// This function will be called from App.jsx to set the navigate function
let globalNavigate;
export const setGlobalNavigate = (navigateFunc) => {
    globalNavigate = navigateFunc;
};

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('userToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 403 && error.response.data.error === 'COMPANY_INACTIVE') {
            if (globalNavigate) {
                globalNavigate('/billing');
            }
            // Prevent further processing of this error
            return new Promise(() => {}); 
        }
        return Promise.reject(error);
    }
);

const handleApiError = (error) => {
    if (error.response) {
        console.error("API Error Response:", error.response.data);
        throw new Error(error.response.data.error || 'An unexpected error occurred.');
    } else if (error.request) {
        console.error("API Error Request:", error.request);
        throw new Error('The server did not respond. Please try again later.');
    } else {
        console.error('API Error Message:', error.message);
        throw new Error('An error occurred while setting up the request.');
    }
};

// --- Login/Signup Flow ---

export const signup = async (email, password, companyName, firstName, lastName) => {
    try {
        const response = await apiClient.post('/signup', { email, password, companyName, firstName, lastName });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const login = async (email, password) => {
    try {
        const response = await apiClient.post('/login', { email, password, app_context: 'manager' });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const selectCompany = async (userId, companyId) => {
    try {
        const response = await apiClient.post('/select-company', { userId, companyId, app_context: 'manager' });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const verifyInvitation = async (email, code) => {
    try {
        const response = await apiClient.post('/verify-invitation', { email, code });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const setupPassword = async (token, password, firstName, lastName) => {
    try {
        const response = await apiClient.post('/setup-password', { token, password, firstName, lastName });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Employee Management ---

export const getCompanyEmployees = async () => {
    try {
        const response = await apiClient.get('/employees');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const inviteEmployee = async (email, can_cash_out) => { // role removed
    try {
        const response = await apiClient.post('/invite-employee', { email, can_cash_out });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const removeEmployee = async (membershipId) => {
    try {
        const response = await apiClient.delete(`/memberships/${membershipId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateEmployeeMembership = async (membershipId, updateData) => {
    try {
        const response = await apiClient.put(`/memberships/${membershipId}`, updateData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};


// --- Category Management ---

export const getCompanyCategories = async () => {
    try {
        const response = await apiClient.get('/categories');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createCategory = async (categoryData) => {
    try {
        const response = await apiClient.post('/categories', categoryData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateCategory = async (categoryId, categoryData) => {
    try {
        const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteCategory = async (categoryId) => {
    try {
        const response = await apiClient.delete(`/categories/${categoryId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};


// --- User Profile & Password ---

export const updateProfile = async (firstName, lastName) => {
    try {
        const response = await apiClient.put('/profile', { firstName, lastName });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await apiClient.post('/change-password', { currentPassword, newPassword });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateUserLanguage = async (language) => {
    try {
        const response = await apiClient.put('/profile/language', { language });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- OTP / Password Reset --- 

export const verifyOtp = async (email, otp) => {
    try {
        const response = await apiClient.post('/verify-otp', { email, otp });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const resendOtp = async (email) => {
    try {
        const response = await apiClient.post('/resend-otp', { email });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await apiClient.post('/forgot-password', { email });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const resetPassword = async (token, password) => {
    try {
        const response = await apiClient.post('/reset-password', { token, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};