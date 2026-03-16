const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            if (user.role === 'admin') {
                if (user.status === 'hold') {
                    return res.status(403).json({ message: 'Your account is on hold. Please contact support.' });
                }
                if (new Date() > new Date(user.subscriptionExpiresAt)) {
                    return res.status(403).json({ message: 'Your plan has expired. Please contact sales team to renew.' });
                }
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.subscriptionPlan && mongoose.Types.ObjectId.isValid(user.subscriptionPlan)) {
            const planDoc = await SubscriptionPlan.findById(user.subscriptionPlan).lean();
            if (planDoc) {
                user.subscriptionPlan = planDoc;
            }
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, authUser, changePassword, getMe };
