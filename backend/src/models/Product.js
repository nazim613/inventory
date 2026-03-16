const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    productId: { type: String, required: true, unique: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    brand: { type: String },
    size: { type: String }, // e.g. 25mm, 30mm
    unitType: { type: String, enum: ['pc', 'dozen'], default: 'dozen' },
    manufacturerPrice: { type: Number },
    image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
