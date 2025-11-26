import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

import i18n from '../i18n'; // Import i18n instance

const handleApiError = (error) => {
    if (error.response) {
        console.error("API Error Response:", error.response.data);
        const errorKey = error.response.data.error || 'UNEXPECTED_ERROR';
        const translatedError = i18n.t(errorKey, { ns: 'errors', defaultValue: i18n.t('UNEXPECTED_ERROR', { ns: 'errors' }) });
        throw new Error(translatedError);
    } else if (error.request) {
        console.error("API Error Request:", error.request);
        throw new Error(i18n.t('SERVER_DID_NOT_RESPOND', { ns: 'errors', defaultValue: 'The server did not respond. Please try again later.' }));
    } else {
        console.error('API Error Message:', error.message);
        throw new Error(i18n.t('REQUEST_SETUP_ERROR', { ns: 'errors', defaultValue: 'An error occurred while setting up the request.' }));
    }
};

// --- Login/Signup Flow ---

export const login = async (email, password) => {
    try {
        const response = await apiClient.post('/login', { email, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
