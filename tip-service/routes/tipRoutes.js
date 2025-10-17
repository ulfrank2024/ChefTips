const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

// Import functions from new controllers
const { createDepartment, getDepartments, updateDepartment, deleteDepartment } = require("../controllers/departmentController");
const { createCategory, getCategories, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { createTipOutRule, getTipOutRules, updateTipOutRule, deleteTipOutRule } = require("../controllers/ruleController");
const { createDailyReport, getEmployeeDashboard, getTipsByCollector, createCollectedTip } = require("../controllers/reportController");
const { createPool, getPools, getPoolDetails, getPoolSummaryById, getEmployeeReceivedTips, getPayPeriodSummary } = require("../controllers/poolController");
const { getCompanyEmployees } = require("../controllers/employeeController");

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

// Departments
router.post("/departments", authenticateToken, isManager, createDepartment);
router.get("/departments", authenticateToken, isManager, getDepartments);
router.put("/departments/:departmentId", authenticateToken, isManager, updateDepartment);
router.delete("/departments/:departmentId", authenticateToken, isManager, deleteDepartment);

// Categories
router.post("/categories", authenticateToken, isManager, createCategory);
router.get("/categories", authenticateToken, getCategories);
router.put("/categories/:categoryId", authenticateToken, isManager, updateCategory);
router.delete("/categories/:categoryId", authenticateToken, isManager, deleteCategory);

// Tip-Out Rules
router.post("/rules/tip-out", authenticateToken, isManager, createTipOutRule);
router.get("/rules/tip-out", authenticateToken, getTipOutRules);
router.put("/rules/tip-out/:ruleId", authenticateToken, isManager, updateTipOutRule);
router.delete("/rules/tip-out/:ruleId", authenticateToken, isManager, deleteTipOutRule);


// --- Operational Routes ---

// Employee submits a daily report
router.post("/reports", authenticateToken, createDailyReport);

// Collector Specific Routes
router.get("/tips/collector/:userId", authenticateToken, getTipsByCollector);

// Manager creates a new tip pool
router.post("/pools", authenticateToken, isManager, createPool);

// Manager gets pool history
router.get("/pools", authenticateToken, isManager, getPools);
router.get("/pools/:id", authenticateToken, getPoolDetails);
router.get("/pools/:poolId/summary", authenticateToken, getPoolSummaryById);


// --- Dashboard & Data Retrieval Routes ---

// Employee gets their own dashboard data for a date range
router.get("/dashboard/employee", authenticateToken, getEmployeeDashboard);

// Manager gets the total tip-out amount for a category over a pay period
router.get("/dashboard/pay-period-summary", authenticateToken, isManager, getPayPeriodSummary);

// Manager gets all received tips for a specific employee
router.get("/employees/:userId/received-tips", authenticateToken, getEmployeeReceivedTips);

module.exports = router;
