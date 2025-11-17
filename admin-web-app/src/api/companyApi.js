import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

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

export const getCompanies = async () => {
    try {
        const response = await apiClient.get('/companies');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getCompanyById = async (companyId) => {
    try {
        const response = await apiClient.get(`/companies/${companyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const suspendCompany = async (companyId) => {
    try {
        const response = await apiClient.post(`/internal/companies/${companyId}/suspend`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const reactivateCompany = async (companyId) => {
    try {
        const response = await apiClient.post(`/internal/companies/${companyId}/reactivate`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
