const axios = require('axios');

const authServiceApiClient = axios.create({
    baseURL: 'http://auth-service:3001',
});

const getAuthUserDetails = async (userId, token) => {
    try {
        const response = await authServiceApiClient.get(`/api/auth/users/${userId}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching user details for ID ${userId}:`, error.response ? error.response.data : error.message);
        // Return null or a default object to prevent cascading failures
        return null;
    }
};

const notifyCashOut = async (token, recipient_user_id, sender_name, amount, role) => {
    try {
        const response = await authServiceApiClient.post('/notify-cashout', {
            recipient_user_id,
            sender_name,
            amount,
            role
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error notifying cash out:', error.response ? error.response.data : error.message);
        throw new Error('Failed to notify cash out.');
    }
};

module.exports = {
    authServiceApiClient,
    getAuthUserDetails,
    notifyCashOut,
};
