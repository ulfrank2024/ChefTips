const { TipModel } = require("../models/tipModel");
const { RuleModel } = require("../models/ruleModel"); // Import RuleModel
const { getCompanyEmployeesFromAuthService } = require("../services/employeeService"); // New import

const createCashOutReport = async (req, res) => {
    const { id: user_id, company_id, role } = req.user; // Use role from token
    const {
        service_date, was_collector,
        food_sales = 0, alcohol_sales = 0, cash_on_hand = 0,
        gross_tips = 0, // Ensure gross_tips is destructured
        manual_adjustments = [], split_with = [], service_end_time = null,
        selected_recipients = []
    } = req.body;

    if (!service_date || was_collector === undefined || !role) { // Check for role
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    // Calculate total_sales from food_sales and alcohol_sales
    const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);

    // If user was not a collector, just log the day and exit.
    if (!was_collector) {
        try {
            let dailyReport = await TipModel.getDailyReport(user_id, company_id, service_date);
            if (!dailyReport) {
                dailyReport = await TipModel.createDailyReport(user_id, company_id, role, service_date, was_collector); // Use role
            }

            const cashOutData = {
                user_id, company_id, role, service_date, was_collector, // Use role
                total_sales: 0, gross_tips: 0, net_tips: 0, service_end_time,
                food_sales: 0, alcohol_sales: 0, cash_difference: 0, final_balance: 0 // Default for non-collectors
            };
            const newCashOut = await TipModel.createCashOut(cashOutData, dailyReport.id, []);
            return res.status(201).json(newCashOut);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    }

    // --- Main logic for Collectors ---
    try {
        let dailyReport = await TipModel.getDailyReport(user_id, company_id, service_date);
        if (!dailyReport) {
            dailyReport = await TipModel.createDailyReport(user_id, company_id, role, service_date, was_collector); // Use role
        }

        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const automatic_adjustments = [];

        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);
        const employeeRoleMap = new Map(employees.map(emp => [emp.id, emp.role])); // For role check

        // Calculate automatic tip-outs based on rules
        for (const rule of rules) {
            // Rule filtering by source_role
            if (rule.source_role && rule.source_role !== role) continue;

            let rule_amount = 0;
            if (rule.percentage) {
                const basis = rule.calculation_basis === 'total_sales' ? total_sales : gross_tips;
                rule_amount = parseFloat(basis) * (rule.percentage / 100);
            } else if (rule.flat_amount) {
                rule_amount = parseFloat(rule.flat_amount);
            }

            if (rule_amount > 0) {

                // Handle distribution based on rule type
                if (rule.distribution_type === 'INDIVIDUAL_SELECTION') {
                    const rule_recipients_obj = selected_recipients.find(sr => sr.rule_id === rule.id);
                    console.log('Rule recipients object from payload:', rule_recipients_obj);
                    let user_ids = rule_recipients_obj ? rule_recipients_obj.user_ids : [];
                    console.log('User IDs before manager filter:', user_ids);

                    // Exclude manager if the rule is for 'commis' or 'gérant'
                    if (rule.name === 'commis' || rule.name === 'gérant') {
                        user_ids = user_ids.filter(id => employeeRoleMap.get(id) !== 'manager');
                        console.log('User IDs after manager filter:', user_ids);
                    }

                    if (user_ids.length > 0) {
                        automatic_adjustments.push({
                            adjustment_type: 'TIP_OUT_AUTOMATIC',
                            amount: -rule_amount, // Tip-outs are negative adjustments for the collector
                            description: `Tip-Out to ${rule.name}`,
                            rule_id: rule.id,
                        });

                        const actualUserRecipients = user_ids.filter(rec => typeof rec === 'number');
                        const totalRecipients = user_ids.length; // Count both actual and manual for distribution
                        const amount_per_recipient = rule_amount / totalRecipients;

                        for (const recipient_user_id of actualUserRecipients) { // Only create adjustments for actual users
                            automatic_adjustments.push({
                                adjustment_type: 'TIP_OUT_AUTOMATIC',
                                amount: amount_per_recipient, // Positive adjustment for the recipient
                                description: `Tip-Out received from ${rule.name}`,
                                rule_id: rule.id,
                                related_user_id: recipient_user_id,
                            });
                        }
                    }
                } else if (rule.distribution_type === 'DEPARTMENT_POOL') {
                    automatic_adjustments.push({
                        adjustment_type: 'TIP_OUT_AUTOMATIC',
                        amount: -rule_amount, // Tip-outs are negative adjustments for the collector
                        description: `Tip-Out to ${rule.name}`,
                        rule_id: rule.id,
                    });
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

        const totalTipOuts = automatic_adjustments.reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
        const due_back = totalTipOuts + parseFloat(cash_on_hand);

        const cashOutData = {
            user_id, company_id, role, service_date, was_collector, // Use role
            total_sales, gross_tips: 0, net_tips: 0, service_end_time,
            food_sales: parseFloat(food_sales), alcohol_sales: parseFloat(alcohol_sales),
            cash_difference: 0, final_balance: due_back
        };
        const all_adjustments = [...automatic_adjustments, ...split_adjustments];
        const newCashOut = await TipModel.createCashOut(cashOutData, dailyReport.id, all_adjustments);

        // Here you could trigger an email confirmation

        res.status(201).json(newCashOut);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getEmployeeCashOutDashboard = async (req, res) => {
    const { id: user_id, company_id } = req.user;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });

    try {
        const cashOuts = await TipModel.getCashOutsForUser(user_id, company_id, startDate, endDate);
        // Further logic to calculate recipient tips could be added here
        res.status(200).json(cashOuts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCashOutsByCollector = async (req, res) => {
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
        const cashOuts = await TipModel.getCashOutsForUser(userId, company_id, startDate, endDate);
        res.status(200).json(cashOuts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const createSimplifiedCashOut = async (req, res) => {
    const { id: user_id, company_id, role } = req.user; // Use role from token
    const { amount, service_date, notes } = req.body; // notes are captured but not stored in this version

    if (amount === undefined || !service_date || !role) { // Check for role
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const cashOutData = {
            user_id,
            company_id,
            role, // Use role
            service_date,
            was_collector: true,
            total_sales: 0, // Not provided by this simplified endpoint
            gross_tips: parseFloat(amount),
            net_tips: parseFloat(amount) // No adjustments in this simplified flow
        };

        // Reuse the existing createCashOut model function with no adjustments
        const newCashOut = await TipModel.createCashOut(cashOutData, []);

        res.status(201).json(newCashOut);
    } catch (err) {
        // Handle potential unique constraint violation if a cash out for that day/user/category already exists
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: "CASH_OUT_ALREADY_EXISTS" });
        }
        console.error('[createSimplifiedCashOut] Error:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const previewCashOutReport = async (req, res) => {
    const { id: user_id, company_id, role } = req.user; // Use role from token
    const {
        service_date, was_collector,
        food_sales = 0, alcohol_sales = 0, cash_on_hand = 0,
        gross_tips, // Use gross_tips from req.body
        manual_adjustments = [], split_with = [], service_end_time = null,
        selected_recipients = []
    } = req.body;

    if (!role || !service_date || was_collector === undefined) { // Check for role
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);
    console.log('Backend previewCashOutReport received payload:', req.body);
    console.log('total_sales before rule processing:', total_sales, 'gross_tips before rule processing:', gross_tips);

    if (!was_collector) {
        return res.status(200).json({
            total_sales,
            gross_tips,
            net_tips: gross_tips,
            final_balance: gross_tips + parseFloat(cash_difference),
            individual_recipient_tips: [],
            department_pool_tip: 0,
            due_back: gross_tips + parseFloat(cash_difference)
        });
    }

    try {
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        console.log('Rules fetched:', rules);
        const automatic_adjustments_for_collector = []; // Adjustments that affect the collector's net tips
        const individual_recipient_tips_map = new Map(); // Map to store tips for each individual recipient
        let totalDepartmentPoolContribution = 0;

        for (const rule of rules) {
            if (rule.source_role && rule.source_role !== role) continue; // Filter by source_role

            let rule_amount = 0;
            let basis = 0; // Declare basis here
            if (rule.percentage) {
                basis = rule.calculation_basis === 'total_sales' ? total_sales : gross_tips;
                rule_amount = parseFloat(basis) * (rule.percentage / 100);
            } else if (rule.flat_amount) {
                rule_amount = parseFloat(rule.flat_amount);
            }

            if (rule_amount > 0) {
                // Amount deducted from the collector
                automatic_adjustments_for_collector.push({
                    amount: -rule_amount,
                    description: `Tip-Out to ${rule.name}`,
                    rule_id: rule.id,
                });

                if (rule.distribution_type === 'INDIVIDUAL_SELECTION') {
                    const rule_recipients = selected_recipients.find(sr => sr.rule_id === rule.id);
                    if (rule_recipients && rule_recipients.user_ids && rule_recipients.user_ids.length > 0) {
                        const amount_per_recipient = rule_amount / rule_recipients.user_ids.length;
                        for (const recipient_user_id of rule_recipients.user_ids) {
                            individual_recipient_tips_map.set(
                                recipient_user_id,
                                (individual_recipient_tips_map.get(recipient_user_id) || 0) + amount_per_recipient
                            );
                        }
                    }
                } else if (rule.distribution_type === 'DEPARTMENT_POOL') {
                    totalDepartmentPoolContribution += rule_amount;
                }
            }
        }

        // Manual adjustments (these affect the collector's net tips)
        const manual_adjustments_for_collector = manual_adjustments.map(adj => ({
            amount: parseFloat(adj.amount), // Can be positive or negative
            description: adj.description,
        }));

        // Split with (these are negative adjustments for the collector)
        const split_adjustments_for_collector = split_with.map(split => ({
            amount: -parseFloat(split.amount),
            description: `Split with user ${split.user_id}`,
        }));

        const totalTipOuts = automatic_adjustments_for_collector.reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
        const due_back = totalTipOuts + parseFloat(cash_on_hand);

        // Convert map to array for response
        const individual_recipient_tips = Array.from(individual_recipient_tips_map, ([userId, amount]) => ({ userId, amount }));

        res.status(200).json({
            total_sales,
            gross_tips: 0,
            net_tips: 0,
            final_balance: due_back,
            individual_recipient_tips, // Tips distributed to individuals
            department_pool_tip: totalDepartmentPoolContribution, // Total for department pool
            totalTipOutsFromCollector: totalTipOuts, // New field
            due_back
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const calculateTipDistribution = async (req, res) => {
    const { id: user_id, company_id, role: userRole } = req.user;
    const {
        food_sales = 0, alcohol_sales = 0, cash_on_hand = 0,
        gross_tips, service_date, selected_recipients = []
    } = req.body;

    if (!service_date) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);

    try {
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const individual_recipient_tips_map = new Map();
        let totalDepartmentPoolContribution = 0;
        let totalTipOutsFromCollector = 0;
        const tipDetails = [];

        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);
        const employeeMap = new Map(employees.map(emp => [emp.id, {
            name: `${emp.first_name} ${emp.last_name}`,
            role: emp.role
        }]));

        for (const rule of rules) {
            // Apply source_role filter ONLY to individual selection rules
            if (rule.distribution_type === 'INDIVIDUAL_SELECTION' && rule.source_role && rule.source_role !== userRole) {
                continue;
            }

            let rule_amount = 0;
            const basis = rule.calculation_basis === 'total_sales' ? total_sales : gross_tips;
            if (rule.percentage) {
                rule_amount = parseFloat(basis) * (rule.percentage / 100);
            } else if (rule.flat_amount) {
                rule_amount = parseFloat(rule.flat_amount);
            }

            if (rule_amount > 0) {
                if (rule.distribution_type === 'INDIVIDUAL_SELECTION') {
                    const rule_recipients_obj = selected_recipients.find(sr => sr.rule_id === rule.id);
                    const user_ids = rule_recipients_obj ? rule_recipients_obj.user_ids : [];

                    if (user_ids.length > 0) {
                        totalTipOutsFromCollector += rule_amount;
                        const amount_per_recipient = rule_amount / user_ids.length;
                        const recipientsDetails = [];

                        for (const recipient_id of user_ids) {
                            const employee = employeeMap.get(recipient_id);
                            if (employee) {
                                recipientsDetails.push({
                                    first_name: employee.name.split(' ')[0],
                                    last_name: employee.name.split(' ')[1] || '',
                                    role_name: employee.role,
                                    amount: amount_per_recipient
                                });
                            }
                        }
                        tipDetails.push({
                            ruleName: rule.name,
                            amount: rule_amount,
                            recipients: recipientsDetails,
                            type: 'individual'
                        });
                    }
                } else if (rule.distribution_type === 'DEPARTMENT_POOL') {
                    totalTipOutsFromCollector += rule_amount;
                    totalDepartmentPoolContribution += rule_amount;
                    tipDetails.push({
                        ruleName: rule.name,
                        amount: rule_amount,
                        department: rule.name, // Assuming rule name is the department
                        type: 'department'
                    });
                }
            }
        }

        const dueBackAmount = totalTipOutsFromCollector + parseFloat(cash_on_hand || 0);

        res.status(200).json({
            summary: {
                barmanTip: individual_recipient_tips_map.get(user_id) || 0,
                departmentPoolTip: totalDepartmentPoolContribution,
                totalTipOutsFromCollector: totalTipOutsFromCollector,
                dueBack: dueBackAmount,
            },
            details: tipDetails
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};


module.exports = {
    createCashOutReport,
    getEmployeeCashOutDashboard,
    getCashOutsByCollector,
    createSimplifiedCashOut,
    previewCashOutReport,
    calculateTipDistribution,
};