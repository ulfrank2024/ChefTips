const { authServiceApiClient } = require("../services/authService");

const getCompanyEmployeesFromAuthService = async (token) => {
    try {
        const authResponse = await authServiceApiClient.get(`/api/auth/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return authResponse.data;
    } catch (err) {
        console.error("Error fetching company employees from auth service:", err.message);
        throw new Error(err.response?.data?.error || "Failed to fetch employees from auth service");
    }
};

module.exports = {
    getCompanyEmployeesFromAuthService,
};