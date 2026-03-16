const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['purchase', 'sale', 'adjustment'], required: true },
    quantity: { type: Number, required: true }, // positive for purchase/adjustment up, negative for sale/adjustment down
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Ref to Order or Purchase (optional)
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
