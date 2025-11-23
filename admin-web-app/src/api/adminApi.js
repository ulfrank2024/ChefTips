import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BILLING_API_URL || "http://localhost:4002";

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

export const getKpis = async () => {
    try {
        const response = await apiClient.get('/admin/kpis');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getHistoricalKpis = async () => {
    try {
        const response = await apiClient.get('/admin/kpis/historical');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createPlan = async (planData) => {
    try {
        const response = await apiClient.post('/admin/plans', planData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPlans = async () => {
    try {
        const response = await apiClient.get('/admin/plans');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPlanById = async (id) => {
    try {
        const response = await apiClient.get(`/admin/plans/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updatePlan = async (id, planData) => {
    try {
        const response = await apiClient.put(`/admin/plans/${id}`, planData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deactivatePlan = async (id) => {
    try {
        const response = await apiClient.delete(`/admin/plans/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getDefaultTrialDays = async () => {
    try {
        const response = await apiClient.get('/admin/settings/default-trial-days');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateDefaultTrialDays = async (days) => {
    try {
        const response = await apiClient.put('/admin/settings/default-trial-days', { default_trial_days: days });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
