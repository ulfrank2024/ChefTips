const { TipModel } = require("../models/tipModel");
const { RuleModel } = require("../models/ruleModel");
const { PayoutPeriodModel } = require("../models/payoutPeriodModel"); // Import the new model
const { getCompanyEmployeesFromAuthService } = require("../services/employeeService");
const { notifyCashOut } = require("../services/authService");

// --- SHARED CALCULATION LOGIC ---
const performTipCalculation = (rules, total_sales, gross_tips, selected_recipients, userRole, employees) => {
    const automatic_adjustments = [];
    const tipDetails = [];
    let totalTipOutsFromCollector = 0;
    let totalDepartmentPoolContribution = 0;
    const employeeMap = new Map(employees.map(emp => [emp.id, { name: `${emp.first_name} ${emp.last_name}`, role: emp.role }]));

    for (const rule of rules) {
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

                    // For createCashOutReport
                    automatic_adjustments.push({
                        adjustment_type: 'TIP_OUT_AUTOMATIC',
                        amount: -rule_amount,
                        description: `Tip-Out to ${rule.name}`,
                        rule_id: rule.id,
                    });
                    user_ids.forEach(uid => {
                         const recipientEmployee = employeeMap.get(uid);
                         automatic_adjustments.push({
                            adjustment_type: 'TIP_OUT_AUTOMATIC',
                            amount: amount_per_recipient,
                            description: recipientEmployee ? `${recipientEmployee.name} (${recipientEmployee.role})` : rule.name,
                            rule_id: rule.id,
                            related_user_id: uid,
                            is_individual_recipient: true,
                            distribution_type: 'INDIVIDUAL_SELECTION',
                        });
                    });

                    // For calculateTipDistribution
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

                // For createCashOutReport (negative adjustment for collector)
                automatic_adjustments.push({
                    adjustment_type: 'TIP_OUT_AUTOMATIC',
                    amount: -rule_amount,
                    description: `Tip-Out to ${rule.name}`,
                    rule_id: rule.id,
                    distribution_type: 'DEPARTMENT_POOL',
                });

                // For createCashOutReport (positive adjustment for the department pool)
                automatic_adjustments.push({
                    adjustment_type: 'DEPARTMENT_CONTRIBUTION',
                    amount: rule_amount,
                    description: rule.name,
                    rule_id: rule.id,
                    is_department_pool: true,
                    distribution_type: 'DEPARTMENT_POOL',
                });

                // For calculateTipDistribution
                tipDetails.push({
                    ruleName: rule.name,
                    amount: rule_amount,
                    type: 'department'
                });
            }
        }
    }
    return { automatic_adjustments, tipDetails, totalTipOutsFromCollector, totalDepartmentPoolContribution };
};


const createCashOutReport = async (req, res) => {
    console.log("Raw req.body in createCashOutReport:", req.body);
    const { id: user_id, company_id, role, first_name, last_name } = req.user;
    const sender_name = `${first_name} ${last_name}`;
    const {
        service_date, was_collector,
        food_sales = 0, alcohol_sales = 0,
        gross_tips = 0,
        split_with = [], service_end_time = null,
        selected_recipients = []
    } = req.body;

    const cash_on_hand_from_body = req.body.cash_on_hand;
    console.log("req.body.cash_on_hand (before parseFloat):", cash_on_hand_from_body, "Type:", typeof cash_on_hand_from_body);
    const cash_on_hand = parseFloat(cash_on_hand_from_body);
    if (!service_date || was_collector === undefined || !role) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        // Find the active payout period for the company
        const activePeriod = await PayoutPeriodModel.findActiveByCompany(company_id);
        if (!activePeriod) {
            return res.status(400).json({ error: "NO_ACTIVE_PAYOUT_PERIOD" });
        }

        const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);

        const { automatic_adjustments, totalTipOutsFromCollector } = performTipCalculation(rules, total_sales, gross_tips, selected_recipients, role, employees);

        let dailyReport = await TipModel.getDailyReport(user_id, company_id, service_date);
        if (!dailyReport) {
            dailyReport = await TipModel.createDailyReport(user_id, company_id, role, service_date, was_collector);
        } else {
            const existingCashOut = await TipModel.getCashOutByDailyReportId(dailyReport.id);
            if (existingCashOut) {
                return res.status(409).json({ error: "CASH_OUT_ALREADY_EXISTS" });
            }
        }

        const split_adjustments = split_with.map(split => ({
            adjustment_type: 'SPLIT_PAYOUT',
            amount: -parseFloat(split.amount),
            description: `Split with user ${split.user_id}`,
            related_user_id: split.user_id
        }));

        const totalTipOuts = totalTipOutsFromCollector;
        const net_tips = parseFloat(gross_tips) - totalTipOuts;
        const due_back = totalTipOuts + parseFloat(cash_on_hand);

        const cashOutData = {
            user_id, company_id, role, service_date, was_collector,
            total_sales, gross_tips: parseFloat(gross_tips), net_tips, service_end_time,
            food_sales: parseFloat(food_sales), alcohol_sales: parseFloat(alcohol_sales),
            cash_difference: 0, final_balance: due_back, cash_on_hand: parseFloat(cash_on_hand),
            payout_period_id: activePeriod.id // Associate with the active period
        };
        const all_adjustments = [...automatic_adjustments, ...split_adjustments];
        const newCashOut = await TipModel.createCashOut(cashOutData, dailyReport.id, all_adjustments);

        // --- Start Email Notification Logic ---
        const individualTipOuts = all_adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.related_user_id && adj.amount > 0);

        for (const tipOut of individualTipOuts) {
            try {
                const recipient = employees.find(emp => emp.id === tipOut.related_user_id);
                if (recipient) {
                    await notifyCashOut(token, tipOut.related_user_id, sender_name, tipOut.amount, recipient.role);
                }
            } catch (emailError) {
                console.error(`Failed to send cash out notification to user ${tipOut.related_user_id}:`, emailError);
            }
        }
        // --- End Email Notification Logic ---

        res.status(201).json(newCashOut);
    } catch (err) {
        console.error("[createCashOutReport] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const calculateTipDistribution = async (req, res) => {
    console.log("Raw req.body in calculateTipDistribution:", req.body);
    const { id: user_id, company_id, role: userRole } = req.user;
    const {
        food_sales = 0, alcohol_sales = 0,
        gross_tips, service_date, selected_recipients = []
    } = req.body;

    const cash_on_hand_from_body = req.body.cash_on_hand;
    console.log("req.body.cash_on_hand (before parseFloat):", cash_on_hand_from_body, "Type:", typeof cash_on_hand_from_body);
    const cash_on_hand = parseFloat(cash_on_hand_from_body) || 0;

    if (!service_date) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);

        const { tipDetails, totalTipOutsFromCollector, totalDepartmentPoolContribution } = performTipCalculation(rules, total_sales, gross_tips, selected_recipients, userRole, employees);

        console.log("totalTipOutsFromCollector:", totalTipOutsFromCollector);
        console.log("cash_on_hand (from request):", cash_on_hand);

        const dueBackAmount = totalTipOutsFromCollector + cash_on_hand;
        console.log("Calculated dueBackAmount:", dueBackAmount);

        res.status(200).json({
            summary: {
                departmentPoolTip: totalDepartmentPoolContribution,
                totalTipOutsFromCollector: totalTipOutsFromCollector,
                dueBack: dueBackAmount,
            },
            details: tipDetails
        });

    } catch (err) {
        console.error("[calculateTipDistribution] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

// --- OTHER UNCHANGED FUNCTIONS ---

const getEmployeeCashOutDashboard = async (req, res) => {
    const { id: user_id, company_id } = req.user;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });

    try {
        const cashOuts = await TipModel.getCashOutsForUser(user_id, company_id, startDate, endDate);
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

    if (role !== 'manager' && authUserId !== userId) {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }

    try {
        const cashOuts = await TipModel.getCashOutsForUser(userId, company_id, startDate, endDate);
        res.status(200).json(cashOuts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const createSimplifiedCashOut = async (req, res) => {
    const { id: user_id, company_id, role } = req.user;
    const { amount, service_date, notes } = req.body;

    if (amount === undefined || !service_date || !role) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const cashOutData = {
            user_id, company_id, role, service_date, was_collector: true,
            total_sales: 0, gross_tips: parseFloat(amount), net_tips: parseFloat(amount)
        };
        const newCashOut = await TipModel.createCashOut(cashOutData, []);
        res.status(201).json(newCashOut);
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ error: "CASH_OUT_ALREADY_EXISTS" });
        }
        console.error('[createSimplifiedCashOut] Error:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const previewCashOutReport = async (req, res) => {
    res.status(501).json({ error: "This function is deprecated and should not be used." });
};

const getCashOutReports = async (req, res) => {
    const { companyId, startDate, endDate } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: "MISSING_REQUIRED_QUERY_PARAMETERS" });
    }

    try {
        const cashOutData = await TipModel.getCashOutsForCompany(companyId, startDate, endDate);
        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);
        const employeeMap = new Map(employees.map(emp => [emp.id, `${emp.first_name} ${emp.last_name}`]));

        const enrichedCashOuts = cashOutData.map(cashOut => {
            const enrichedAdjustments = cashOut.adjustments.map(adj => {
                if (adj.related_user_id) {
                    const employee = employees.find(emp => emp.id === adj.related_user_id);
                    return { 
                        ...adj, 
                        employee_name: employeeMap.get(adj.related_user_id) || 'Unknown Employee',
                        employee_role: employee ? employee.role : 'Unknown Role'
                    };
                }
                return adj;
            });
            return {
                ...cashOut,
                employee_name: employeeMap.get(cashOut.user_id) || 'Unknown Employee',
                adjustments: enrichedAdjustments
            };
        });

        res.status(200).json(enrichedCashOuts);
    } catch (err) {
        console.error("[getCashOutReports] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getServerOverview = async (req, res) => {
    const { companyId, startDate, endDate } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: "MISSING_REQUIRED_QUERY_PARAMETERS" });
    }

    try {
        const overviewData = await TipModel.getServerOverviewForCompany(companyId, startDate, endDate);
        const token = req.headers.authorization.split(' ')[1];
        const employees = await getCompanyEmployeesFromAuthService(token);
        const employeeMap = new Map(employees.map(emp => [emp.id, `${emp.first_name} ${emp.last_name}`]));

        const enrichedOverview = overviewData.map(overview => ({
            ...overview,
            employee_name: employeeMap.get(overview.employee_id) || 'Unknown Employee'
        }));

        res.status(200).json(enrichedOverview);
    } catch (err) {
        console.error("[getServerOverview] Error:", err);
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
    getCashOutReports,
    getServerOverview,
};