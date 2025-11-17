import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BILLING_API_URL || "http://localhost:4002";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(config => {
    // For now, we will just add a header to authenticate.
    // In a real application, this would be a proper admin token.
    config.headers['x-admin-auth'] = 'true';
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

export const getSubscriptions = async () => {
    try {
        const response = await apiClient.get('/subscriptions');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getSubscriptionByCompanyId = async (companyId) => {
    try {
        const response = await apiClient.get(`/subscriptions/companies/${companyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPlans = async () => {
    try {
        const response = await apiClient.get('/api/plans');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateSubscriptionPlan = async (subscriptionId, planId) => {
    try {
        const response = await apiClient.put(`/subscriptions/${subscriptionId}/plan`, { planId });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateTrialEndDate = async (subscriptionId, trialEndsAt) => {
    try {
        const response = await apiClient.put(`/subscriptions/${subscriptionId}/trial`, { trialEndsAt });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
