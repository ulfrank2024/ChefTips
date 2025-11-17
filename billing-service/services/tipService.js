const axios = require('axios');

const TIP_SERVICE_URL = process.env.TIP_SERVICE_URL || 'http://localhost:4001'; // Default to local tip-service

const getGrossTipsVolume = async (companyId, startDate, endDate) => {
    try {
        // TODO: Implement inter-service authentication (e.g., shared secret or internal JWT)
        const response = await axios.get(`${TIP_SERVICE_URL}/internal/reports/gross-tips-volume`, {
            params: { companyId, startDate, endDate }
        });
        console.log(`Gross tips volume retrieved for company ${companyId} from tip-service.`);
        return response.data.totalGrossTipsVolume;
    } catch (error) {
        console.error(`Error getting gross tips volume for company ${companyId} from tip-service:`, error.message);
        throw error;
    }
};

module.exports = {
    getGrossTipsVolume,
};
