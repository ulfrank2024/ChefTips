const { CollectorModel } = require("../models/collectorModel");

const getTipsByCollector = async (req, res) => {
    const { id: userId, company_id } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });
    }

    try {
        const collectedTips = await CollectorModel.getTipsByCollector(userId, company_id, startDate, endDate);
        res.status(200).json(collectedTips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const createCollectedTip = async (req, res) => {
    const { id: userId, company_id } = req.user;
    const { category_id, service_date, gross_tips, payment_method, source } = req.body;

    if (!category_id || !service_date || gross_tips === undefined || payment_method === undefined || source === undefined) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const newTip = await CollectorModel.createCollectedTip(
            userId,
            company_id,
            category_id,
            service_date,
            gross_tips,
            payment_method,
            source
        );
        res.status(201).json(newTip);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    getTipsByCollector,
    createCollectedTip
};
