const { authServiceApiClient } = require("../services/authService");

const getCompanyEmployees = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
        const authResponse = await authServiceApiClient.get(`/api/auth/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.status(200).json(authResponse.data);
    } catch (err) {
        console.error("Error fetching company employees:", err.message);
        const status = err.response ? err.response.status : 500;
        const message = err.response?.data?.error || "INTERNAL_SERVER_ERROR";
        res.status(status).json({ error: message });
    }
};

const getCollectorEmployees = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const currentUserId = req.user.id;
    try {
        // Fetch the employee list from the auth service
        const authResponse = await authServiceApiClient.get(`/api/auth/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const allEmployees = authResponse.data;

        // Filter for employees who can perform cash outs (collectors) and exclude the current user
        const collectorEmployees = allEmployees.filter(emp => {
            const isCollector = emp.can_cash_out;
            const isCurrentUser = emp.id === currentUserId;
            return isCollector && !isCurrentUser;
        });

        res.status(200).json(collectorEmployees);

    } catch (err) {
        console.error("Error fetching collector employees:", err.message);
        const status = err.response ? err.response.status : 500;
        const message = err.response?.data?.error || "INTERNAL_SERVER_ERROR";
        res.status(status).json({ error: message });
    }
};

module.exports = {
    getCompanyEmployees,
    getCollectorEmployees
};
