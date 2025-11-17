const express = require('express');
const router = express.Router();
const billingApiController = require('../controllers/billingApiController');

router.get('/plans', billingApiController.getPlans);
router.get('/subscriptions/:companyId/status', billingApiController.getSubscriptionStatus);
router.post('/create-checkout-session', billingApiController.createCheckoutSession);
router.post('/create-customer-portal-session', billingApiController.createCustomerPortalSession);

module.exports = router;
