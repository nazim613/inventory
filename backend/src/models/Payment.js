const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partyType: { type: String, enum: ['customer', 'manufacturer'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyType' },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    notes: { type: String }
}, { timestamps: true });

// Ensure correct population based on type
paymentSchema.path('referenceId').options.refPath = function() {
    return this.type === 'customer' ? 'Customer' : 'Manufacturer';
};

module.exports = mongoose.model('Payment', paymentSchema);
