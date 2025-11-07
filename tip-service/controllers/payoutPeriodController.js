const { PayoutPeriodModel } = require("../models/payoutPeriodModel");

const createPayoutPeriod = async (req, res) => {
    const { name, start_date, end_date } = req.body;
    const { company_id } = req.user;

    if (!name || !start_date || !end_date) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const newPeriod = await PayoutPeriodModel.create(company_id, name, start_date, end_date);
        res.status(201).json(newPeriod);
    } catch (err) {
        console.error("[createPayoutPeriod] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getPayoutPeriods = async (req, res) => {
    const { company_id } = req.user;

    try {
        const periods = await PayoutPeriodModel.findByCompanyId(company_id);
        res.status(200).json(periods);
    } catch (err) {
        console.error("[getPayoutPeriods] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updatePayoutPeriod = async (req, res) => {
    const { id } = req.params;
    const { name, start_date, end_date } = req.body;
    const { company_id } = req.user;

    if (!name || !start_date || !end_date) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const updatedPeriod = await PayoutPeriodModel.update(id, company_id, name, start_date, end_date);
        if (!updatedPeriod) {
            return res.status(404).json({ error: "PAYOUT_PERIOD_NOT_FOUND" });
        }
        res.status(200).json(updatedPeriod);
    } catch (err) {
        console.error("[updatePayoutPeriod] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const deletePayoutPeriod = async (req, res) => {
    const { id } = req.params;
    const { company_id } = req.user;

    try {
        const deleted = await PayoutPeriodModel.delete(id, company_id);
        if (!deleted) {
            return res.status(404).json({ error: "PAYOUT_PERIOD_NOT_FOUND" });
        }
        res.status(204).send(); // No content for successful deletion
    } catch (err) {
        console.error("[deletePayoutPeriod] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const findActiveByCompany = async (req, res) => {
    const { company_id } = req.user;

    try {
        const activePeriod = await PayoutPeriodModel.findActiveByCompany(company_id);
        if (!activePeriod) {
            return res.status(404).json({ error: "NO_ACTIVE_PAYOUT_PERIOD" });
        }
        res.status(200).json(activePeriod);
    } catch (err) {
        console.error("[findActiveByCompany] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createPayoutPeriod,
    getPayoutPeriods,
    updatePayoutPeriod,
    deletePayoutPeriod,
    findActiveByCompany,
};