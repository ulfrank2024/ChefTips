const axios = require('axios');

// This client is used to communicate with the authentication service.
const authServiceApiClient = axios.create({
    baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:4000', // The base URL for the auth service
});

module.exports = { authServiceApiClient };
