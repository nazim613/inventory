const Purchase = require('../models/Purchase');
const InventoryMovement = require('../models/InventoryMovement');
const Manufacturer = require('../models/Manufacturer');
const Stock = require('../models/Stock');

const createPurchase = async (req, res) => {
    try {
        const { purchaseId, manufacturer, date, products, totalAmount, paymentStatus, notes } = req.body;
        
        const newPurchase = new Purchase({
            user: req.user._id, purchaseId, manufacturer, date, products, totalAmount, paymentStatus, notes
        });
        
        const savedPurchase = await newPurchase.save();

        const mfr = await Manufacturer.findOne({ _id: manufacturer, user: req.user._id });
        if (mfr) {
            mfr.totalPurchases += totalAmount;
            if (paymentStatus !== 'paid') {
                mfr.pendingBalance += totalAmount;
            }
            await mfr.save();
        }

        for (const item of products) {
            let stock = await Stock.findOne({ user: req.user._id, product: item.product, size: item.size, unitType: item.unitType });
            if (stock) {
                stock.quantity += item.quantity;
                await stock.save();
            } else {
                stock = new Stock({
                    user: req.user._id,
                    product: item.product,
                    size: item.size,
                    unitType: item.unitType || 'dozen',
                    quantity: item.quantity
                });
                await stock.save();
            }

            await InventoryMovement.create({
                user: req.user._id,
                product: item.product,
                date: date || new Date(),
                type: 'purchase',
                quantity: item.quantity,
                referenceId: savedPurchase._id,
                notes: `Purchase from ${mfr ? mfr.name : 'Manufacturer'}`
            });
        }

        res.status(201).json(savedPurchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPurchases = async (req, res) => {
    try {
        const filter = { user: req.user._id };
        if (req.query.manufacturer) {
            filter.manufacturer = req.query.manufacturer;
        }
        const purchases = await Purchase.find(filter)
            .populate('manufacturer', 'name')
            .populate('products.product', 'name size')
            .sort({ date: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user._id })
            .populate('manufacturer', 'name')
            .populate('products.product', 'name size unitType');
        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user._id });
        if(!purchase) return res.status(404).json({ message: 'Purchase not found' });
        
        purchase.paymentStatus = paymentStatus;
        await purchase.save();
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPurchase, getPurchases, getPurchaseById, updatePaymentStatus };
