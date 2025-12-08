const { TipModel } = require("../models/tipModel");
const { RuleModel } = require("../models/ruleModel");
const { PayoutPeriodModel } = require("../models/payoutPeriodModel");
const { getCompanyEmployeesFromAuthService } = require("../services/employeeService");
const { notifyCashOut, getCategories } = require("../services/authService"); // Import getCategories

// --- SHARED CALCULATION LOGIC ---
const performTipCalculation = (rules, total_sales, gross_tips, selected_recipients, userCategoryId, employees, categories) => {
    const automatic_adjustments = [];
    const tipDetails = [];
    let totalTipOutsFromCollector = 0;
    let totalCategoryPoolContribution = 0; // Renamed from totalDepartmentPoolContribution
    const employeeMap = new Map(employees.map(emp => [emp.id, { name: `${emp.first_name} ${emp.last_name}`, category_id: emp.category_id, category_name: emp.category_name }]));
    const categoryMap = new Map(categories.map(cat => [cat.id, cat])); // Map categories for easy lookup

    for (const rule of rules) {
        // Adapt source_role to source_category_id
        const sourceCategory = categoryMap.get(userCategoryId);
        if (!sourceCategory) continue; // Should not happen if user is authenticated with a valid category

        // Filter rules that apply to the current user's category if source_category_id is defined in the rule
        if (rule.source_category_id && rule.source_category_id !== userCategoryId) {
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
            const destinationCategory = categoryMap.get(rule.destination_category_id);
            if (!destinationCategory) continue; // Should have a valid destination category

            if (destinationCategory.is_tip_distribution_pool === false) { // Changed DEPARTMENT_POOL to is_tip_distribution_pool
                // Individual Selection
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
                            description: recipientEmployee ? `${recipientEmployee.name} (${recipientEmployee.category_name})` : rule.name, // Use category_name
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
                                category_name: employee.category_name, // Use category_name
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
            } else if (destinationCategory.is_tip_distribution_pool === true) { // Changed DEPARTMENT_POOL to is_tip_distribution_pool
                // Category Pool Distribution
                totalTipOutsFromCollector += rule_amount;
                totalCategoryPoolContribution += rule_amount; // Renamed

                // For createCashOutReport (negative adjustment for collector)
                automatic_adjustments.push({
                    adjustment_type: 'TIP_OUT_AUTOMATIC',
                    amount: -rule_amount,
                    description: `Tip-Out to ${destinationCategory.name}`, // Use category name
                    rule_id: rule.id,
                    destination_category_id: destinationCategory.id, // Store destination category ID
                    distribution_type: 'CATEGORY_POOL', // Changed to CATEGORY_POOL
                });

                // For createCashOutReport (positive adjustment for the category pool)
                automatic_adjustments.push({
                    adjustment_type: 'CATEGORY_CONTRIBUTION', // Changed to CATEGORY_CONTRIBUTION
                    amount: rule_amount,
                    description: destinationCategory.name, // Use category name
                    rule_id: rule.id,
                    is_category_pool: true, // Changed to is_category_pool
                    distribution_type: 'CATEGORY_POOL', // Changed to CATEGORY_POOL
                });

                // For calculateTipDistribution
                tipDetails.push({
                    ruleName: rule.name,
                    amount: rule_amount,
                    type: 'category', // Changed to category
                    destinationCategoryName: destinationCategory.name, // Add category name
                });
            }
        }
    }
    return { automatic_adjustments, tipDetails, totalTipOutsFromCollector, totalCategoryPoolContribution };
};


const createCashOutReport = async (req, res) => {
    console.log("Raw req.body in createCashOutReport:", req.body);
    const { id: user_id, company_id, category_id, first_name, last_name } = req.user; // Use category_id
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
    if (!service_date || was_collector === undefined || !category_id) { // Use category_id
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const activePeriod = await PayoutPeriodModel.findActiveByCompany(company_id);
        if (!activePeriod) {
            return res.status(400).json({ error: "NO_ACTIVE_PAYOUT_PERIOD" });
        }

        const total_sales = parseFloat(food_sales) + parseFloat(alcohol_sales);
        const token = req.headers.authorization.split(' ')[1];
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const employees = await getCompanyEmployeesFromAuthService(token);
        const categories = await getCategories(token); // Fetch categories

        const { automatic_adjustments, totalCategoryPoolContribution } = performTipCalculation(rules, total_sales, gross_tips, selected_recipients, category_id, employees, categories); // Pass categories

        let dailyReport = await TipModel.getDailyReport(user_id, company_id, service_date);
        if (!dailyReport) {
            dailyReport = await TipModel.createDailyReport(user_id, company_id, category_id, service_date, was_collector); // Use category_id
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

        const totalTipOuts = totalCategoryPoolContribution; // Use totalCategoryPoolContribution
        const net_tips = parseFloat(gross_tips) - totalTipOuts;
        const due_back = totalTipOuts + parseFloat(cash_on_hand);

        const cashOutData = {
            user_id, company_id, category_id, service_date, was_collector, // Use category_id
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
                const recipientCategory = categories.find(cat => cat.id === recipient.category_id); // Get recipient's category
                if (recipient && recipientCategory) {
                    await notifyCashOut(token, tipOut.related_user_id, sender_name, tipOut.amount, recipientCategory.name); // Pass category_name
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
    const { id: user_id, company_id, category_id: userCategoryId } = req.user; // Use category_id
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
        const token = req.headers.authorization.split(' ')[1];
        const rules = await RuleModel.getTipOutRulesByCompany(company_id);
        const employees = await getCompanyEmployeesFromAuthService(token);
        const categories = await getCategories(token); // Fetch categories

        const { tipDetails, totalTipOutsFromCollector, totalCategoryPoolContribution } = performTipCalculation(rules, total_sales, gross_tips, selected_recipients, userCategoryId, employees, categories); // Pass categories

        console.log("totalTipOutsFromCollector:", totalTipOutsFromCollector);
        console.log("cash_on_hand (from request):", cash_on_hand);

        const dueBackAmount = totalTipOutsFromCollector + cash_on_hand;
        console.log("Calculated dueBackAmount:", dueBackAmount);

        res.status(200).json({
            summary: {
                categoryPoolTip: totalCategoryPoolContribution, // Renamed
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
    const { company_id, role, id: authUserId } = req.user; // role is still here from the token, needs to be category_id
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: "DATE_RANGE_REQUIRED" });
    }

    // Role check still depends on 'manager' string, which is fine
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
    const { id: user_id, company_id, category_id } = req.user; // Use category_id
    const { amount, service_date, notes } = req.body;

    if (amount === undefined || !service_date || !category_id) { // Use category_id
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    try {
        const cashOutData = {
            user_id, company_id, category_id, service_date, was_collector: true, // Use category_id
            total_sales: 0, gross_tips: parseFloat(amount), net_tips: parseFloat(amount)
        };
        const newCashOut = await TipModel.createCashOut(cashOutData, []); // Daily report ID is missing here!
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
        // Map category_id to category_name for display
        const categories = await getCategories(token); // Fetch categories
        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

        const employeeMap = new Map(employees.map(emp => [emp.id, `${emp.first_name} ${emp.last_name}`]));

        const enrichedCashOuts = cashOutData.map(cashOut => {
            const enrichedAdjustments = (cashOut.adjustments || []).map(adj => {
                if (adj.related_user_id) {
                    const employee = employees.find(emp => emp.id === adj.related_user_id);
                    return { 
                        ...adj, 
                        employee_name: employeeMap.get(adj.related_user_id) || 'Unknown Employee',
                        employee_category_name: employee ? categoryMap.get(employee.category_id) || 'Unknown Category' : 'Unknown Category' // Use category_name
                    };
                }
                return adj;
            });
            return {
                ...cashOut,
                employee_name: employeeMap.get(cashOut.user_id) || 'Unknown Employee',
                category_name: categoryMap.get(cashOut.category_id) || 'Unknown Category', // Use category_id
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
        const categories = await getCategories(token); // Fetch categories
        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
        const employeeMap = new Map(employees.map(emp => [emp.id, `${emp.first_name} ${emp.last_name}`]));

        const enrichedOverview = overviewData.map(overview => ({
            ...overview,
            employee_name: employeeMap.get(overview.employee_id) || 'Unknown Employee',
            category_name: categoryMap.get(overview.category_id) || 'Unknown Category', // Use category_id
        }));

        res.status(200).json(enrichedOverview);
    } catch (err) {
        console.error("[getServerOverview] Error:", err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getGrossTipsVolume = async (req, res) => {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
        return res.status(400).json({ error: "MISSING_REQUIRED_QUERY_PARAMETERS" });
    }

    try {
        const totalGrossTipsVolume = await TipModel.getGrossTipsVolumeByCompanyAndPeriod(companyId, startDate, endDate);
        res.status(200).json({ companyId, startDate, endDate, totalGrossTipsVolume });
    } catch (err) {
        console.error("[getGrossTipsVolume] Error:", err);
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
    getGrossTipsVolume, // Export the new function
};