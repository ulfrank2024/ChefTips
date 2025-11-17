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

export const login = async (email, password) => {
    try {
        const response = await apiClient.post('/login', { email, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
