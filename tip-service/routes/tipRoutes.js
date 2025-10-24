const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

// Import functions from new controllers
const { createTipOutRule, getTipOutRules, updateTipOutRule, deleteTipOutRule } = require("../controllers/ruleController");
const { createCashOutReport, getEmployeeCashOutDashboard, getCashOutsByCollector, createSimplifiedCashOut, calculateTipDistribution } = require("../controllers/reportController"); // Added calculateTipDistribution
const { createPool, getPools, getPoolDetails, getPoolSummaryById, getEmployeeReceivedTips, getPayPeriodSummary } = require("../controllers/poolController");
const { getCompanyEmployees, getCollectorEmployees } = require("../controllers/employeeController");

// Middleware to check if the user is a manager
const isManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }
    next();
};

// --- Configuration Routes (Manager Only) ---

// Employees
router.get("/employees", authenticateToken, getCompanyEmployees);
router.get("/collectors", authenticateToken, getCollectorEmployees); // New route for collectors

// Tip-Out Rules
router.post("/rules/tip-out", authenticateToken, isManager, createTipOutRule);
router.get("/rules/tip-out", authenticateToken, getTipOutRules);
router.put("/rules/tip-out/:ruleId", authenticateToken, isManager, updateTipOutRule);
router.delete("/rules/tip-out/:ruleId", authenticateToken, isManager, deleteTipOutRule);


// --- Operational Routes ---

// Employee submits a daily report
router.post("/cash-outs", authenticateToken, createCashOutReport);

// New route to calculate tip distribution
router.post("/cash-outs/calculate-distribution", authenticateToken, calculateTipDistribution);

// Collector Specific Routes
router.get("/cash-outs/collector/:userId", authenticateToken, getCashOutsByCollector);

// Manager creates a new tip pool
router.post("/pools", authenticateToken, isManager, createPool);

// Manager gets pool history
router.get("/pools", authenticateToken, isManager, getPools);
router.get("/pools/:id", authenticateToken, getPoolDetails);
router.get("/pools/:poolId/summary", authenticateToken, getPoolSummaryById);


// --- Dashboard & Data Retrieval Routes ---

// Employee gets their own dashboard data for a date range
router.get("/dashboard/employee", authenticateToken, getEmployeeCashOutDashboard);

// Manager gets the total tip-out amount for a category over a pay period
router.get("/dashboard/pay-period-summary", authenticateToken, isManager, getPayPeriodSummary);

// Manager gets all received tips for a specific employee
router.get("/employees/:userId/received-tips", authenticateToken, getEmployeeReceivedTips);

module.exports = router;