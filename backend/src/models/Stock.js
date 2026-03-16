const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    unitType: { type: String, enum: ['pc', 'dozen'], default: 'dozen' },
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
