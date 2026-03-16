const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    durationInMonths: {
        type: Number,
        required: true,
        default: 1
    },
    storageLimitMB: {
        type: Number,
        required: true,
        default: 500
    },
    features: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
