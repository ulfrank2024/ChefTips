const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateAdmin } = require('../middleware/adminMiddleware');

// Route to create a new subscription (called by auth-service)
router.post('/create-trial', subscriptionController.createTrialSubscription);

// Route to get all subscriptions (for admin)
router.get('/', authenticateAdmin, subscriptionController.getAllSubscriptions);
router.get('/companies/:companyId', authenticateAdmin, subscriptionController.getSubscriptionByCompanyId);
router.put('/:subscriptionId/plan', authenticateAdmin, subscriptionController.updateSubscriptionPlan);
router.put('/:subscriptionId/trial', authenticateAdmin, subscriptionController.updateTrialEndDate);

// New route for manager-web-app to get subscription status by companyId
router.get('/status/:companyId', subscriptionController.getSubscriptionByCompanyId);

module.exports = router;
