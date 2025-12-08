const { TipModel } = require("../models/tipModel");
const { getAuthUserDetails, getCategories } = require("../services/authService"); // Import getCategories

const getPayPeriodSummary = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { destinationCategoryId, startDate, endDate } = req.query; // Changed destinationDepartmentId to destinationCategoryId
    if (!destinationCategoryId || !startDate || !endDate) return res.status(400).json({ error: "FIELDS_REQUIRED" });

    try {
        const token = req.headers.authorization.split(' ')[1];
        const categories = await getCategories(token);
        const destinationCategory = categories.find(cat => cat.id === destinationCategoryId);

        if (!destinationCategory || !destinationCategory.is_tip_distribution_pool) { // Check is_tip_distribution_pool
            return res.status(400).json({ error: "INVALID_DESTINATION_CATEGORY_OR_NOT_POOL" });
        }

        const total = await TipModel.calculateTipOutsForPayPeriod(company_id, destinationCategoryId, startDate, endDate); // Use destinationCategoryId
        
        // The categoryBreakdown logic assumes categories are passed with percentage distribution.
        // This part needs to be reviewed or adapted if the distribution is based on something else.
        // For now, assuming a simple structure for category_breakdown.
        const categoryBreakdown = {}; 
        // Example: If destinationCategory has a distribution config, use it.
        // For now, it's a direct total to this category pool.
        categoryBreakdown[destinationCategoryId] = total;

        res.status(200).json({ 
            total_tip_out_amount: total,
            category_breakdown: categoryBreakdown
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const createPool = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { categoryId, startDate, endDate, distributions, totalAmount } = req.body; // Changed departmentId to categoryId
    if (!categoryId || !startDate || !endDate || !distributions || totalAmount === undefined) {
        return res.status(400).json({ error: "FIELDS_REQUIRED" });
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const categories = await getCategories(token);
        const selectedCategory = categories.find(cat => cat.id === categoryId);

        if (!selectedCategory || !selectedCategory.is_tip_distribution_pool) {
            return res.status(400).json({ error: "INVALID_CATEGORY_OR_NOT_POOL" });
        }

        const newPool = await TipModel.createPool(company_id, categoryId, startDate, endDate, totalAmount, distributions); // Use categoryId
        res.status(201).json(newPool);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getPools = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    const { startDate, endDate } = req.query;

    try {
        const pools = await TipModel.getPoolsByCompany(company_id, startDate, endDate);
        res.status(200).json(pools);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getPoolDetails = async (req, res) => {
    const { company_id, role } = req.user;
    const { id: poolId } = req.params;

    try {
        if (role === 'manager') {
            const poolDetails = await TipModel.getPoolDetailsById(poolId, company_id);
            if (!poolDetails) {
                return res.status(404).json({ error: "POOL_NOT_FOUND" });
            }
            return res.status(200).json(poolDetails);
        }

        const { id: authUserId } = req.user;
        const poolDetails = await TipModel.getPoolDetailsById(poolId, company_id);

        if (!poolDetails) {
            return res.status(404).json({ error: "POOL_NOT_FOUND" });
        }

        const isRecipient = poolDetails.distributions.some(dist => dist.user_id === authUserId);

        if (!isRecipient) {
            return res.status(403).json({ error: "UNAUTHORIZED" });
        }

        res.status(200).json(poolDetails);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getPoolSummaryById = async (req, res) => {
    const { company_id } = req.user;
    const { poolId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (poolId && !uuidRegex.test(poolId)) {
        console.error(`[getPoolSummaryById] Invalid poolId format: ${poolId}`);
        return res.status(400).json({ error: "INVALID_POOL_ID_FORMAT" });
    }

    try {
        const poolSummary = await TipModel.getPoolsByCompany(company_id, null, null, poolId);
        if (!poolSummary || poolSummary.length === 0) {
            return res.status(404).json({ error: "POOL_NOT_FOUND" });
        }
        res.status(200).json(poolSummary[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getEmployeeReceivedTips = async (req, res) => {
    const { company_id, id: authUserId, role } = req.user; // role is still here from the token, needs to be category_id
    const { userId } = req.params;
    const { startDate, endDate } = req.query; // Extract startDate and endDate from query

    if (role !== 'manager' && authUserId !== userId) {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        let receivedTips = await TipModel.getReceivedTipsByEmployee(userId, company_id, startDate, endDate);

        receivedTips = await Promise.all(receivedTips.map(async (tip) => {
            console.log(`Processing tip: ${tip.id}, Source: ${tip.source}, Sender User ID: ${tip.sender_user_id}`);
            if (tip.source === 'individual' && tip.sender_user_id) {
                try {
                    const senderDetails = await getAuthUserDetails(tip.sender_user_id, req.user.token);
                    console.log(`Sender details fetched for ${tip.sender_user_id}: ${senderDetails.first_name} ${senderDetails.last_name}`);
                    return { ...tip, sender_first_name: senderDetails.first_name, sender_last_name: senderDetails.last_name };
                } catch (error) {
                    console.error(`Failed to fetch sender details for tip ${tip.id} (sender_user_id: ${tip.sender_user_id}):`, error.message);
                    return { ...tip, sender_first_name: 'Unknown', sender_last_name: 'Sender' };
                }
            }
            return tip;
        }));

        res.status(200).json(receivedTips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    getPayPeriodSummary,
    createPool,
    getPools,
    getPoolDetails,
    getPoolSummaryById,
    getEmployeeReceivedTips,
};