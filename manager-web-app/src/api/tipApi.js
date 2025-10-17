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
        const response = await apiClient.get('/employees'); // Assuming this endpoint exists in tip-service
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Department Management ---
export const getDepartments = async () => {
    try {
        const response = await apiClient.get('/departments');
        // Assuming the backend now returns department_type
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createDepartment = async (departmentData) => {
    try {
        // departmentData should now include 'name' and 'department_type'
        const response = await apiClient.post('/departments', departmentData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to update a department
export const updateDepartment = async (departmentId, departmentData) => {
    try {
        const response = await apiClient.put(`/departments/${departmentId}`, departmentData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to delete a department
export const deleteDepartment = async (departmentId) => {
    try {
        const response = await apiClient.delete(`/departments/${departmentId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Category Management ---
export const getCategories = async () => {
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
        // The backend now expects destination_department_id
        const response = await apiClient.post('/rules/tip-out', ruleData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateTipOutRule = async (ruleId, ruleData) => {
    try {
        // The backend now expects destination_department_id
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

// --- Daily Reports ---
export const createDailyReport = async (reportData) => {
    try {
        const response = await apiClient.post('/reports', reportData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// --- Dashboards ---
export const getEmployeeDashboard = async (startDate, endDate) => {
    try {
        const response = await apiClient.get('/dashboard/employee', { params: { startDate, endDate } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getPayPeriodSummary = async (destinationDepartmentId, startDate, endDate) => {
    try {
        const response = await apiClient.get('/dashboard/pay-period-summary', { params: { destinationDepartmentId, startDate, endDate } });
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
export const getTipsByCollector = async (userId, startDate, endDate) => {
  const response = await apiClient.get(`/tips/collector/${userId}`, { params: { startDate, endDate } });
  return response.data;
};

export const submitDailyReport = async (reportData) => {
  const response = await apiClient.post('/reports', reportData);
  return response.data;
};
