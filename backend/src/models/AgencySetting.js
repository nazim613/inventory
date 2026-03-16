const mongoose = require('mongoose');

const agencySettingSchema = new mongoose.Schema({
    companyName: { type: String, default: 'Padlock SaaS Hub' },
    companyEmail: { type: String, default: 'support@padlocks.com' },
    companyPhone: { type: String, default: '+91 9876543210' },
    companyLogo: { type: String, default: '' }, // URL to a logo
}, { timestamps: true });

module.exports = mongoose.model('AgencySetting', agencySettingSchema);
