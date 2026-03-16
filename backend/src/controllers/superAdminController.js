const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const AgencyPayment = require('../models/AgencyPayment');
const AgencySetting = require('../models/AgencySetting'); // Import new model
const mongoose = require('mongoose');

const Customer = require('../models/Customer');
const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const InventoryMovement = require('../models/InventoryMovement');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');

const getClients = async (req, res) => {
    try {
        const clients = await User.find({ role: 'admin' }).select('-password').lean();
        
        // Manually populate subscriptionPlan for Mixed types
        const planIds = clients.map(c => c.subscriptionPlan).filter(p => mongoose.Types.ObjectId.isValid(p));
        const plans = await SubscriptionPlan.find({ _id: { $in: planIds } }).lean();
        const planMap = {};
        plans.forEach(p => planMap[p._id.toString()] = p);

        const populatedClients = clients.map(client => {
            if (client.subscriptionPlan && (typeof client.subscriptionPlan === 'string' || client.subscriptionPlan instanceof mongoose.Types.ObjectId) && planMap[client.subscriptionPlan.toString()]) {
                client.subscriptionPlan = planMap[client.subscriptionPlan.toString()];
            }
            return client;
        });

        res.json(populatedClients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createClient = async (req, res) => {
    const { name, email, phone, password, subscriptionPlan, customExpiryDate } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Calculate expiry based on Plan
        let expiresAt = new Date();
        let planDoc = null;

        if (mongoose.Types.ObjectId.isValid(subscriptionPlan)) {
            planDoc = await SubscriptionPlan.findById(subscriptionPlan);
            if (planDoc) {
                expiresAt.setMonth(expiresAt.getMonth() + planDoc.durationInMonths);
            }
        } else if (subscriptionPlan === '1 month') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (subscriptionPlan === '1 year') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else if (subscriptionPlan === 'custom' && customExpiryDate) {
            expiresAt = new Date(customExpiryDate);
        } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        const user = await User.create({ 
            name, 
            email, 
            phone: phone || '',
            password, 
            role: 'admin',
            subscriptionPlan: planDoc ? planDoc._id : (subscriptionPlan || '1 month'),
            subscriptionExpiresAt: expiresAt,
            status: 'active'
        });

        // Record Agency Payment if a paid plan was selected
        if (planDoc && planDoc.price > 0) {
            await AgencyPayment.create({
                client: user._id,
                plan: planDoc._id,
                amount: planDoc.price,
                notes: 'Initial Subscription'
            });
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            status: user.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateClientSubscription = async (req, res) => {
    const { subscriptionPlan, customExpiryDate, status, customStorageLimitMB } = req.body;
    try {
        const client = await User.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (subscriptionPlan) {
            let expiresAt = new Date();
            let planDoc = null;

            if (mongoose.Types.ObjectId.isValid(subscriptionPlan)) {
                planDoc = await SubscriptionPlan.findById(subscriptionPlan);
                if (planDoc) {
                    expiresAt.setMonth(expiresAt.getMonth() + planDoc.durationInMonths);
                    client.subscriptionPlan = planDoc._id;
                } else {
                     // The ID passed is valid format but doesn't exist in DB. Likely deleted.
                     client.subscriptionPlan = 'Invalid/Deleted Plan';
                }
            } else {
                client.subscriptionPlan = subscriptionPlan;
                if (subscriptionPlan === '1 month') {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                } else if (subscriptionPlan === '1 year') {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                } else if (subscriptionPlan === 'custom' && customExpiryDate) {
                    expiresAt = new Date(customExpiryDate);
                }
            }
            client.subscriptionExpiresAt = expiresAt;

            // Record Agency Payment for renewal
            if (planDoc && planDoc.price > 0) {
                await AgencyPayment.create({
                    client: client._id,
                    plan: planDoc._id,
                    amount: planDoc.price,
                    notes: 'Subscription Update/Renewal'
                });
            }
        }

        if (status) {
            client.status = status;
        }
        
        if (customStorageLimitMB !== undefined) {
             client.customStorageLimitMB = customStorageLimitMB === '' ? null : Number(customStorageLimitMB);
        }

        const updatedClient = await client.save();
        res.json({
            _id: updatedClient._id,
            name: updatedClient.name,
            email: updatedClient.email,
            subscriptionPlan: updatedClient.subscriptionPlan,
            subscriptionExpiresAt: updatedClient.subscriptionExpiresAt,
            status: updatedClient.status,
            customStorageLimitMB: updatedClient.customStorageLimitMB
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createSubscriptionPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateSubscriptionPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSubscriptionPlan = async (req, res) => {
    try {
        await SubscriptionPlan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuperAdminAnalytics = async (req, res) => {
    try {
        const payments = await AgencyPayment.find();
        
        const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
        
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const thisMonthEarnings = payments
            .filter(p => new Date(p.date) >= thisMonthStart)
            .reduce((sum, p) => sum + p.amount, 0);
            
        res.json({
            totalEarnings,
            thisMonthEarnings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getClientProfile = async (req, res) => {
    try {
        const client = await User.findById(req.params.id).select('-password').lean();
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (client.subscriptionPlan && mongoose.Types.ObjectId.isValid(client.subscriptionPlan)) {
            const planDoc = await SubscriptionPlan.findById(client.subscriptionPlan).lean();
            if (planDoc) {
                client.subscriptionPlan = planDoc;
            }
        }

        const setting = await Setting.findOne({ user: client._id });

        // Calculate approximate storage used by this client (JSON stringify estimation)
        const models = [Customer, Manufacturer, Product, Stock, Order, Purchase, InventoryMovement, Payment];
        let totalBytes = 0;

        for (const model of models) {
            const docs = await model.find({ user: client._id }).lean();
            if (docs.length > 0) {
                totalBytes += Buffer.byteLength(JSON.stringify(docs));
            }
        }

        const storageUsedMB = totalBytes / (1024 * 1024);

        // Auto-fill blanks if setting exists
        if (setting && !client.phone) client.phone = setting.companyPhone || '';

        res.json({
            client,
            setting,
            storageUsedMB: parseFloat(storageUsedMB.toFixed(4))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetClientPassword = async (req, res) => {
    try {
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        
        if (!req.body.password || req.body.password.length < 6) {
             return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        client.password = req.body.password;
        await client.save();
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateClientDetails = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (name) client.name = name;
        if (email) client.email = email;
        if (phone !== undefined) client.phone = phone;

        await client.save();
        res.json({ message: 'Details updated successfully', client });
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

const getAgencySettings = async (req, res) => {
    try {
        let settings = await AgencySetting.findOne();
        if (!settings) {
            settings = await AgencySetting.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAgencySettings = async (req, res) => {
    try {
        let settings = await AgencySetting.findOne();
        if (!settings) {
            settings = await AgencySetting.create(req.body);
        } else {
            const { companyName, companyEmail, companyPhone, companyLogo } = req.body;
            if (companyName) settings.companyName = companyName;
            if (companyEmail) settings.companyEmail = companyEmail;
            if (companyPhone) settings.companyPhone = companyPhone;
            if (companyLogo !== undefined) settings.companyLogo = companyLogo;
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuperAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'superadmin' }).select('-password');
        res.json(admins);
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

const createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'User already exists' });
        
        if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const newAdmin = await User.create({
            name,
            email,
            password,
            role: 'superadmin',
            status: 'active'
        });

        res.status(201).json({ _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { 
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
    updateClientDetails,
    getAgencySettings,
    updateAgencySettings,
    getSuperAdmins,
    createSuperAdmin
};
