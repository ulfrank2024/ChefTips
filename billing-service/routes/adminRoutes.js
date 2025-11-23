const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/kpis', adminController.getKpis);
router.get('/kpis/historical', adminController.getHistoricalKpis);

router.post('/plans', adminController.createPlan);
router.get('/plans', adminController.getPlans);
router.get('/plans/:id', adminController.getPlanById);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deactivatePlan);

router.get('/settings/default-trial-days', adminController.getDefaultTrialDays);
router.put('/settings/default-trial-days', adminController.updateDefaultTrialDays);

module.exports = router;
