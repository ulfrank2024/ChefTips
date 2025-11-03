const express = require('express');
const router = express.Router();
const {
    createPayoutPeriod,
    getPayoutPeriods,
    getPayoutPeriodById,
    updatePayoutPeriod,
    deletePayoutPeriod,
} = require('../controllers/payoutPeriodController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware to check for manager role
const isManager = (req, res, next) => {
    if (req.user && req.user.role === 'manager') {
        next();
    } else {
        res.status(403).json({ error: "UNAUTHORIZED" });
    }
};

/**
 * @route GET /api/payout-periods
 * @description Get all payout periods for the company
 * @access Private (All authenticated users)
 */
router.get('/', authenticateToken, getPayoutPeriods);

/**
 * @route POST /api/payout-periods
 * @description Create a new payout period
 * @access Private (Manager only)
 */
router.post('/', authenticateToken, isManager, createPayoutPeriod);

/**
 * @route GET /api/payout-periods/:id
 * @description Get a single payout period by its ID
 * @access Private (All authenticated users)
 */
router.get('/:id', authenticateToken, getPayoutPeriodById);

/**
 * @route PUT /api/payout-periods/:id
 * @description Update a payout period
 * @access Private (Manager only)
 */
router.put('/:id', authenticateToken, isManager, updatePayoutPeriod);

/**
 * @route DELETE /api/payout-periods/:id
 * @description Delete a payout period
 * @access Private (Manager only)
 */
router.delete('/:id', authenticateToken, isManager, deletePayoutPeriod);

module.exports = router;