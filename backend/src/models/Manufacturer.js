const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    brandName: { type: String },
    phoneNumber: { type: String },
    factoryAddress: { type: String },
    subBrands: [{ type: String }],
    // Ledger fields
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
