const { TipModel } = require("../models/tipModel");

const getPayPeriodSummary = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { destinationDepartmentId, startDate, endDate } = req.query;
    if (!destinationDepartmentId || !startDate || !endDate) return res.status(400).json({ error: "FIELDS_REQUIRED" });

    try {
        const department = (await TipModel.getDepartmentsByCompany(company_id)).find(d => d.id === destinationDepartmentId);
        if (!department || department.department_type !== 'RECEIVER') {
            return res.status(400).json({ error: "INVALID_DEPARTMENT" });
        }

        const total = await TipModel.calculateTipOutsForPayPeriod(company_id, destinationDepartmentId, startDate, endDate);
        
        const distribution = department.category_distribution || {};
        const categoryBreakdown = {};
        for (const categoryId in distribution) {
            const percentage = distribution[categoryId];
            categoryBreakdown[categoryId] = (total * percentage) / 100;
        }

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

    const { departmentId, startDate, endDate, distributions, totalAmount } = req.body;
    if (!departmentId || !startDate || !endDate || !distributions || totalAmount === undefined) {
        return res.status(400).json({ error: "FIELDS_REQUIRED" });
    }

    try {
        const newPool = await TipModel.createPool(company_id, departmentId, startDate, endDate, totalAmount, distributions);
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
    const { company_id, id: authUserId, role } = req.user;
    const { userId } = req.params;

    if (role !== 'manager' && authUserId !== userId) {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const receivedTips = await TipModel.getReceivedTipsByEmployee(userId, company_id);
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