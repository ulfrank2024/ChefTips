const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:4002'; // Default to local billing-service

const createTrialSubscription = async (companyId, companyName, managerEmail) => {
    try {
        // TODO: Implement inter-service authentication (e.g., shared secret or internal JWT)
        const response = await axios.post(`${BILLING_SERVICE_URL}/subscriptions/create-trial`, {
            companyId,
            companyName,
            managerEmail,
        }, { httpsAgent: agent });
        console.log(`Trial subscription created for company ${companyId} in billing-service.`);
        return response.data;
    } catch (error) {
        console.error(`Error creating trial subscription for company ${companyId} in billing-service:`, error.message);
        throw error;
    }
};

module.exports = {
    createTrialSubscription,
};
