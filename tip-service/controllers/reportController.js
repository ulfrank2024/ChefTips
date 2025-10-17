const { TipModel } = require("../models/tipModel");

const createDailyReport = async (req, res) => {
    const { id: user_id, company_id } = req.user;
    const {
        category_id, service_date, was_collector,
        food_sales = 0, alcohol_sales = 0, gross_tips = 0,
        cash_difference = 0, // New field
        manual_adjustments = [], split_with = [], service_end_time = null,
        selected_recipients = [] // New field for individual selection rules
    } = req.body;

    if (!category_id || !service_date || was_collector === undefined) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    // Calculate total_sales from food_sales and alcohol_sales
    const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);

    // If user was not a collector, just log the day and exit.
    if (!was_collector) {
        try {
            const reportData = {
                user_id, company_id, category_id, service_date, was_collector,
                total_sales: 0, gross_tips: 0, net_tips: 0, service_end_time,
                food_sales: 0, alcohol_sales: 0, cash_difference: 0, final_balance: 0 // Default for non-collectors
            };
            const newReport = await TipModel.createDailyReport(reportData, []);
            return res.status(201).json(newReport);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    }

    // --- Main logic for Collectors ---
    try {
        const rules = await TipModel.getTipOutRulesByCompany(company_id);
        const automatic_adjustments = [];

        // Calculate automatic tip-outs based on rules
        for (const rule of rules) {
            if (rule.source_category_id && rule.source_category_id !== category_id) continue;

            let rule_amount = 0;
            if (rule.percentage) {
                const basis = rule.calculation_basis === 'total_sales' ? total_sales : gross_tips;
                rule_amount = parseFloat(basis) * (rule.percentage / 100);
            } else if (rule.flat_amount) {
                rule_amount = parseFloat(rule.flat_amount);
            }

            if (rule_amount > 0) {
                // Always deduct the full rule_amount from the collector
                automatic_adjustments.push({
                    adjustment_type: 'TIP_OUT_AUTOMATIC',
                    amount: -rule_amount, // Tip-outs are negative adjustments for the collector
                    description: `Tip-Out to ${rule.name}`,
                    rule_id: rule.id,
                });

                // Handle distribution based on rule type
                if (rule.distribution_type === 'INDIVIDUAL_SELECTION') {
                    const rule_recipients = selected_recipients.find(sr => sr.rule_id === rule.id);
                    if (rule_recipients && rule_recipients.user_ids && rule_recipients.user_ids.length > 0) {
                        const amount_per_recipient = rule_amount / rule_recipients.user_ids.length;
                        for (const recipient_user_id of rule_recipients.user_ids) {
                            automatic_adjustments.push({
                                adjustment_type: 'TIP_OUT_AUTOMATIC',
                                amount: amount_per_recipient, // Positive adjustment for the recipient
                                description: `Tip-Out received from ${rule.name}`,
                                rule_id: rule.id,
                                related_user_id: recipient_user_id,
                            });
                        }
                    } else {
                        // Fallback: If no individuals selected for an INDIVIDUAL_SELECTION rule,
                        // the amount is still deducted from collector but not distributed to individuals.
                        // This might need further clarification/handling (e.g., error, or goes to a general pool).
                        console.warn(`No recipients selected for individual selection rule: ${rule.name} (ID: ${rule.id}). Amount deducted from collector but not distributed.`);
                    }
                } else if (rule.distribution_type === 'DEPARTMENT_POOL') {
                    // For DEPARTMENT_POOL rules, the amount is deducted from the collector
                    // and implicitly goes to the department pool (handled by calculateTipOutsForPayPeriod later).
                    // No positive adjustments for individuals are created here.
                }
            }
        }

        // Add manual splits to adjustments
        const split_adjustments = split_with.map(split => ({
            adjustment_type: 'SPLIT_PAYOUT',
            amount: -parseFloat(split.amount), // Negative adjustment for the reporter
            description: `Split with user ${split.user_id}`,
            related_user_id: split.user_id
        }));

        const all_adjustments = [...automatic_adjustments, ...manual_adjustments, ...split_adjustments];
        const totalAdjustments = all_adjustments.reduce((sum, adj) => sum + parseFloat(adj.amount), 0);
        const net_tips = parseFloat(gross_tips) + totalAdjustments; // Adjustments are negative

        // Calculate final_balance including cash_difference
        const final_balance = net_tips + parseFloat(cash_difference);

        const reportData = {
            user_id, company_id, category_id, service_date, was_collector,
            total_sales, gross_tips, net_tips, service_end_time,
            food_sales: parseFloat(food_sales), alcohol_sales: parseFloat(alcohol_sales),
            cash_difference: parseFloat(cash_difference), final_balance
        };
        const newReport = await TipModel.createDailyReport(reportData, all_adjustments);

        // Here you could trigger an email confirmation

        res.status(201).json(newReport);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getEmployeeDashboard = async (req, res) => {
    const { id: user_id, company_id } = req.user;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });

    try {
        const reports = await TipModel.getDailyReportsForUser(user_id, company_id, startDate, endDate);
        // Further logic to calculate recipient tips could be added here
        res.status(200).json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getTipsByCollector = async (req, res) => {
    const { company_id, role, id: authUserId } = req.user;
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });
    }

    // Security: Allow manager to view any employee's tips, or employee to view their own tips
    if (role !== 'manager' && authUserId !== userId) {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        // Re-use the existing model function which does what we need
        const reports = await TipModel.getDailyReportsForUser(userId, company_id, startDate, endDate);
        res.status(200).json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const createCollectedTip = async (req, res) => {
    const { id: user_id, company_id } = req.user;
    const { amount, service_date, category_id, notes } = req.body; // notes are captured but not stored in this version

    if (amount === undefined || !service_date || !category_id) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const reportData = {
            user_id,
            company_id,
            category_id,
            service_date,
            was_collector: true,
            total_sales: 0, // Not provided by this simplified endpoint
            gross_tips: parseFloat(amount),
            net_tips: parseFloat(amount) // No adjustments in this simplified flow
        };

        // Reuse the existing createDailyReport model function with no adjustments
        const newReport = await TipModel.createDailyReport(reportData, []);

        res.status(201).json(newReport);
    } catch (err) {
        // Handle potential unique constraint violation if a report for that day/user/category already exists
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: "DAILY_REPORT_ALREADY_EXISTS" });
        }
        console.error('[createCollectedTip] Error:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createDailyReport,
    getEmployeeDashboard,
    getTipsByCollector,
    createCollectedTip,
};