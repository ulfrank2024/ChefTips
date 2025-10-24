import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_TIP_API_URL || "http://localhost:4001/api/tips";

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

// --- Employee/User Retrieval ---
export const getCompanyEmployees = async () => {
    try {
        const response = await apiClient.get('/employees');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getCollectorEmployees = async () => {
    try {
        const response = await apiClient.get('/collectors');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Tip Out Rules Management ---
export const getTipOutRules = async () => {
    try {
        const response = await apiClient.get('/rules/tip-out');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createTipOutRule = async (ruleData) => {
    try {
        const response = await apiClient.post('/rules/tip-out', ruleData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateTipOutRule = async (ruleId, ruleData) => {
    try {
        const response = await apiClient.put(`/rules/tip-out/${ruleId}`, ruleData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteTipOutRule = async (ruleId) => {
    try {
        const response = await apiClient.delete(`/rules/tip-out/${ruleId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Cash Outs ---
export const createCashOutReport = async (reportData) => {
    try {
        const response = await apiClient.post('/cash-outs', reportData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const calculateTipDistribution = async (calculationData) => {
    try {
        const response = await apiClient.post('/cash-outs/calculate-distribution', calculationData);
        console.log('API Response for calculateTipDistribution (data):', response.data);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Dashboards ---
export const getEmployeeCashOutDashboard = async (startDate, endDate) => {
    try {
        const response = await apiClient.get('/dashboard/employee', { params: { startDate, endDate } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPayPeriodSummary = async (destinationRole, startDate, endDate) => { // Changed destinationDepartmentId to destinationRole
    try {
        const response = await apiClient.get('/dashboard/pay-period-summary', { params: { destinationRole, startDate, endDate } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createPool = async (poolData) => {
    try {
        const response = await apiClient.post('/pools', poolData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Pool History ---
export const getPools = async (startDate, endDate) => {
    try {
        const response = await apiClient.get('/pools', { params: { startDate, endDate } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPoolDetails = async (poolId) => {
    try {
        const response = await apiClient.get(`/pools/${poolId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getEmployeeReceivedTips = async (userId) => {
    try {
        const response = await apiClient.get(`/employees/${userId}/received-tips`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPoolSummary = async (poolId) => {
    try {
        const response = await apiClient.get(`/pools/${poolId}/summary`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Collector Specific APIs ---
export const getCashOutsByCollector = async (userId, startDate, endDate) => {
  const response = await apiClient.get(`/cash-outs/collector/${userId}`, { params: { startDate, endDate } });
  return response.data;
};

export const submitCashOutReport = async (reportData) => {
  const response = await apiClient.post('/cash-outs', reportData);
  return response.data;
};