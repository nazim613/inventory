const express = require('express');
const router = express.Router();
const { 
    getClients, 
    createClient, 
    updateClientSubscription,
    getSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getSuperAdminAnalytics,
    getClientProfile,
    resetClientPassword,
    updateClientDetails
} = require('../controllers/superAdminController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.route('/clients')
    .get(protect, superAdmin, getClients)
    .post(protect, superAdmin, createClient);

router.route('/clients/:id')
    .put(protect, superAdmin, updateClientSubscription);

router.route('/clients/:id/profile')
    .get(protect, superAdmin, getClientProfile);

router.route('/clients/:id/details')
    .put(protect, superAdmin, updateClientDetails);

router.route('/clients/:id/password')
    .put(protect, superAdmin, resetClientPassword);

router.route('/plans')
    .get(protect, superAdmin, getSubscriptionPlans)
    .post(protect, superAdmin, createSubscriptionPlan);

router.route('/plans/:id')
    .put(protect, superAdmin, updateSubscriptionPlan)
    .delete(protect, superAdmin, deleteSubscriptionPlan);

router.route('/analytics')
    .get(protect, superAdmin, getSuperAdminAnalytics);

module.exports = router;
