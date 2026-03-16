const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, default: 'Padlock System Solutions' },
    companyEmail: { type: String },
    companyPhone: { type: String },
    companyLogo: { type: String },
    invoiceLogo: { type: String },
    invoiceFooterText: { type: String, default: 'Thank you for your business!' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
