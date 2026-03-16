const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String },
    quantity: { type: Number, required: true },
    unitType: { type: String, enum: ['pc', 'dozen'], default: 'dozen' },
    pricePerUnit: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
