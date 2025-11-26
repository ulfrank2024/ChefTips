const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

// Import functions from new controllers
const { createTipOutRule, getTipOutRules, updateTipOutRule, deleteTipOutRule } = require("../controllers/ruleController");
const { createCashOutReport, getEmployeeCashOutDashboard, getCashOutsByCollector, createSimplifiedCashOut, calculateTipDistribution, getCashOutReports, getServerOverview, getGrossTipsVolume } = require("../controllers/reportController"); // Added calculateTipDistribution
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

// Manager gets server overview
router.get("/server-overview", authenticateToken, isManager, getServerOverview);

// Manager gets cash out reports
router.get("/cash-out-reports", authenticateToken, isManager, getCashOutReports);

// --- Inter-service Communication Routes ---
// Used by billing-service to get total gross tips volume for a company over a period
router.get("/internal/reports/gross-tips-volume", getGrossTipsVolume);

// Default route for /api/tips/
router.get("/", authenticateToken, (req, res) => {
    // This route is hit when the frontend makes a GET request to /api/tips/
    // It's likely expecting a list of tips or some general tip-related information.
    // For now, we return an empty array to resolve the 404 error.
    // Further investigation might be needed to return meaningful data here.
    res.status(200).json([]);
});

module.exports = router;