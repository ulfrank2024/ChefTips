const { PayoutPeriodModel } = require("../models/payoutPeriodModel");

/**
 * Creates a new payout period.
 * Only accessible by managers.
 */
const createPayoutPeriod = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    const { name, start_date, end_date } = req.body;
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ error: "FIELDS_REQUIRED" });
    }

    try {
        // Optional: Check for overlapping periods before creating a new one
        // const existingPeriods = await PayoutPeriodModel.findByCompany(company_id);
        // ... logic to check for overlaps ...

        const newPeriod = await PayoutPeriodModel.create({ company_id, name, start_date, end_date });
        res.status(201).json(newPeriod);
    } catch (err) {
        console.error(err);
        // Handle potential unique constraint violation for period name
        if (err.code === '23505') {
            return res.status(409).json({ error: "PERIOD_NAME_EXISTS" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

/**
 * Retrieves all payout periods for the manager's company.
 * Only accessible by managers.
 */
const getPayoutPeriods = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const periods = await PayoutPeriodModel.findByCompany(company_id);
        res.status(200).json(periods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

/**
 * Retrieves a single payout period by its ID.
 * Only accessible by managers.
 */
const getPayoutPeriodById = async (req, res) => {
    const { company_id, role } = req.user;
    const { id } = req.params;

    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const period = await PayoutPeriodModel.findById(id);
        if (!period || period.company_id !== company_id) {
            return res.status(404).json({ error: "PERIOD_NOT_FOUND" });
        }
        res.status(200).json(period);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

/**
 * Updates a payout period (e.g., to change its status or name).
 * Only accessible by managers.
 */
const updatePayoutPeriod = async (req, res) => {
    const { company_id, role } = req.user;
    const { id } = req.params;
    const { name, start_date, end_date, status } = req.body;

    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const period = await PayoutPeriodModel.findById(id);
        if (!period || period.company_id !== company_id) {
            return res.status(404).json({ error: "PERIOD_NOT_FOUND" });
        }

        const updates = { name, start_date, end_date, status };
        // Filter out undefined values so they are not updated
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "NO_UPDATE_FIELDS_PROVIDED" });
        }

        const updatedPeriod = await PayoutPeriodModel.update(id, updates);
        res.status(200).json(updatedPeriod);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "PERIOD_NAME_EXISTS" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

/**
 * Deletes a payout period.
 * Only accessible by managers.
 */
const deletePayoutPeriod = async (req, res) => {
    const { company_id, role } = req.user;
    const { id } = req.params;

    if (role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const period = await PayoutPeriodModel.findById(id);
        if (!period || period.company_id !== company_id) {
            return res.status(404).json({ error: "PERIOD_NOT_FOUND" });
        }

        // Optional: Add logic to prevent deletion of periods with associated cash_outs
        
        await PayoutPeriodModel.delete(id);
        res.status(204).send(); // No content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};


module.exports = {
    createPayoutPeriod,
    getPayoutPeriods,
    getPayoutPeriodById,
    updatePayoutPeriod,
    deletePayoutPeriod,
};