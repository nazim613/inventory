const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purchaseId: { type: String, required: true, unique: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    date: { type: Date, default: Date.now },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        size: { type: String },
        unitType: { type: String, enum: ['pc', 'dozen'], default: 'dozen' },
        quantity: { type: Number, required: true },
        manufacturerPrice: { type: Number, required: true },
    }],
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
