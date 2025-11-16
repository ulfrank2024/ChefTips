import axios from 'axios';

// The base URL should point to the tip-service where the /api/payout-periods endpoint lives
const serviceBaseUrl = import.meta.env.VITE_TIP_API_URL ? import.meta.env.VITE_TIP_API_URL.replace('/api/tips', '') : 'http://localhost:4001';
const API_BASE_URL = `${serviceBaseUrl}/api/payout-periods`;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to automatically add the auth token to all requests
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
        // Use the specific error message from the backend if available
        throw new Error(error.response.data.error || 'An unexpected error occurred.');
    } else if (error.request) {
        console.error("API Error Request:", error.request);
        throw new Error('The server did not respond. Please try again later.');
    } else {
        console.error('API Error Message:', error.message);
        throw new Error('An error occurred while setting up the request.');
    }
};

/**
 * Creates a new payout period.
 * @param {object} periodData - The data for the new period { name, start_date, end_date }.
 * @returns {Promise<object>} The newly created period object.
 */
export const createPayoutPeriod = async (periodData) => {
    try {
        const response = await apiClient.post('/', periodData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Retrieves all payout periods for the company.
 * @returns {Promise<Array<object>>} A list of all payout periods.
 */
export const getPayoutPeriods = async () => {
    try {
        const response = await apiClient.get('/');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Retrieves a single payout period by its ID.
 * @param {string} periodId - The ID of the period to retrieve.
 * @returns {Promise<object>} The requested payout period object.
 */
export const getPayoutPeriodById = async (periodId) => {
    try {
        const response = await apiClient.get(`/${periodId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Updates an existing payout period.
 * @param {string} periodId - The ID of the period to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<object>} The updated payout period object.
 */
export const updatePayoutPeriod = async (periodId, updates) => {
    try {
        const response = await apiClient.put(`/${periodId}`, updates);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Deletes a payout period.
 * @param {string} periodId - The ID of the period to delete.
 * @returns {Promise<void>}
 */
export const deletePayoutPeriod = async (periodId) => {
    try {
        await apiClient.delete(`/${periodId}`);
    } catch (error) {
        handleApiError(error);
    }
};