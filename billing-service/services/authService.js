const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000'; // Default to local auth-service

const suspendCompany = async (companyId) => {
    try {
        // TODO: Implement inter-service authentication (e.g., shared secret or internal JWT)
        const response = await axios.post(`${AUTH_SERVICE_URL}/internal/companies/${companyId}/suspend`);
        console.log(`Company ${companyId} suspended in auth-service.`);
        return response.data;
    } catch (error) {
        console.error(`Error suspending company ${companyId} in auth-service:`, error.message);
        throw error;
    }
};

const reactivateCompany = async (companyId) => {
    try {
        // TODO: Implement inter-service authentication (e.g., shared secret or internal JWT)
        const response = await axios.post(`${AUTH_SERVICE_URL}/internal/companies/${companyId}/reactivate`);
        console.log(`Company ${companyId} reactivated in auth-service.`);
        return response.data;
    } catch (error) {
        console.error(`Error reactivating company ${companyId} in auth-service:`, error.message);
        throw error;
    }
};

const sendEmailNotification = async (to, subject, templateName, templateData, language = 'en') => {
    try {
        // TODO: Implement inter-service authentication
        const response = await axios.post(`${AUTH_SERVICE_URL}/internal/send-email`, {
            to,
            subject,
            templateName,
            templateData,
            language,
        });
        console.log(`Email notification sent to ${to} via auth-service.`);
        return response.data;
    } catch (error) {
        console.error(`Error sending email notification to ${to} via auth-service:`, error.message);
        throw error;
    }
};

module.exports = {
    suspendCompany,
    reactivateCompany,
    sendEmailNotification,
};
