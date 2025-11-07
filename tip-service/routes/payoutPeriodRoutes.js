const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { createPayoutPeriod, getPayoutPeriods, updatePayoutPeriod, deletePayoutPeriod, findActiveByCompany } = require("../controllers/payoutPeriodController");

// Middleware to check if the user is a manager
const isManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED" });
    }
    next();
};

router.post("/", authenticateToken, isManager, createPayoutPeriod);
router.get("/", authenticateToken, getPayoutPeriods);
router.put("/:id", authenticateToken, isManager, updatePayoutPeriod);
router.delete("/:id", authenticateToken, isManager, deletePayoutPeriod);
router.get("/active", authenticateToken, findActiveByCompany);

module.exports = router;