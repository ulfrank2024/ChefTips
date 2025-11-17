const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Stripe webhook endpoint
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.handleWebhook);

module.exports = router;
