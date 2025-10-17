const { RuleModel } = require("../models/ruleModel");

const createTipOutRule = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    try {
        const newRule = await TipModel.createTipOutRule({ ...req.body, company_id });
        res.status(201).json(newRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getTipOutRules = async (req, res) => {
    const { company_id } = req.user;
    try {
        const rules = await TipModel.getTipOutRulesByCompany(company_id);
        res.status(200).json(rules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateTipOutRule = async (req, res) => {
    const { role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { ruleId } = req.params;
    try {
        const updatedRule = await TipModel.updateTipOutRule(ruleId, req.body);
        res.status(200).json(updatedRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const deleteTipOutRule = async (req, res) => {
    const { role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { ruleId } = req.params;
    try {
        await TipModel.deleteTipOutRule(ruleId);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createTipOutRule,
    getTipOutRules,
    updateTipOutRule,
    deleteTipOutRule,
};