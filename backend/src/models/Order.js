const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceNumber: { type: String, unique: true }, // generated when order is created
    date: { type: Date, default: Date.now },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    amountPaid: { type: Number, default: 0 },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
