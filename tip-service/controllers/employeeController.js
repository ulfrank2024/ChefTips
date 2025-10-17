const axios = require('axios');

const AUTH_SERVICE_BASE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4000";

const authServiceApiClient = axios.create({
    baseURL: AUTH_SERVICE_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add an interceptor to forward the JWT token from the current request to the auth service
authServiceApiClient.interceptors.request.use(config => {
    // Assuming the JWT token is available in req.headers.authorization from the original request
    // This requires the original request's token to be passed somehow, or a service-to-service token.
    // For simplicity, we'll assume req.headers.authorization is directly available or passed.
    // In a real microservice setup, a dedicated service-to-service authentication mechanism would be better.
    if (config.headers.Authorization) {
        // If Authorization header is already set (e.g., from a previous interceptor or direct setting)
        // we use it. Otherwise, we might need to get it from the original req object.
    } else if (this && this.req && this.req.headers && this.req.headers.authorization) {
        // This part is tricky. `this.req` is not directly available in a standard controller context.
        // The token needs to be explicitly passed or retrieved from a context.
        // For now, we'll rely on the token being passed in the config or assume it's handled by the calling service.
        // A more robust solution would involve passing the token from the original request's req.headers.authorization
        // to this axios call, or using a service-to-service token.
    }
    return config;
}, error => {
    return Promise.reject(error);
});

const getCompanyEmployees = async (req, res) => {
    const { company_id, token } = req.user; // Assuming token is available in req.user from authenticateToken middleware

    if (!company_id) {
        return res.status(400).json({ error: "COMPANY_ID_REQUIRED" });
    }

    try {
        // Forward the original Authorization header to the auth service
        const authResponse = await authServiceApiClient.get(`/employees`, {
            headers: {
                Authorization: `Bearer ${token}` // Use the token from req.user
            }
        });
        res.status(200).json(authResponse.data);
    } catch (err) {
        console.error("Error fetching employees from auth service:", err.message);
        if (err.response) {
            return res.status(err.response.status).json({ error: err.response.data.error || "AUTH_SERVICE_ERROR" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    getCompanyEmployees,
};