const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    signatureOrStamp: { type: String },
    customPrices: {
        type: Map,
        of: Number, // productId as key, price as value
        default: {}
    },
    // Credit and Ledger fields
    totalOrders: { type: Number, default: 0 },
    totalPurchaseValue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    lastOrderDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
