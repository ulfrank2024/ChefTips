import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000/api/auth";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Use an interceptor to automatically add the auth token to all requests
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('userToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// Function to handle errors consistently
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
        const response = await apiClient.post('/login', { email, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const selectCompany = async (userId, companyId) => {
    try {
        const response = await apiClient.post('/select-company', { userId, companyId });
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

// Simplified inviteEmployee
export const inviteEmployee = async (email, categoryId = null) => {
    try {
        const response = await apiClient.post('/invite-employee', { email, categoryId });
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

export const updateEmployeeMembership = async (membershipId, categoryId) => {
    try {
        const response = await apiClient.put(`/memberships/${membershipId}`, { categoryId });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Category Management is now in tipApi.js ---

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

export const resetPassword = async (email, otp, password) => {
    try {
        const response = await apiClient.post('/reset-password', { email, otp, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
