const Stock = require('../models/Stock');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Manufacturer = require('../models/Manufacturer');
const InventoryMovement = require('../models/InventoryMovement');

const getStocks = async (req, res) => {
    try {
        const stocks = await Stock.find({ user: req.user._id }).populate('product', 'name productId size manufacturerPrice');
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStockById = async (req, res) => {
    try {
        const stock = await Stock.findOne({ _id: req.params.id, user: req.user._id }).populate('product', 'name productId size');
        if (stock) {
            res.json(stock);
        } else {
            res.status(404).json({ message: 'Stock not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createOrUpdateStock = async (req, res) => {
    const { product, size, quantity, unitType } = req.body;
    try {
        const productDoc = await Product.findOne({ _id: product, user: req.user._id });
        if (!productDoc) return res.status(404).json({ message: 'Product not found' });

        const isNewAddition = Number(quantity) > 0;
        let createdStock;

        let stock = await Stock.findOne({ product, size, unitType, user: req.user._id });
        if (stock) {
            stock.quantity += Number(quantity);
            createdStock = await stock.save();
        } else {
            const newStock = new Stock({ user: req.user._id, product, size, quantity: Number(quantity), unitType });
            createdStock = await newStock.save();
        }

        // Automatic Purchase Integration 
        if (isNewAddition && productDoc.manufacturer) {
            const mPrice = productDoc.manufacturerPrice || 0;
            const totalAmount = Number(quantity) * mPrice;

            // Generate Purchase Record
            const purchase = new Purchase({
                user: req.user._id,
                purchaseId: 'PUR-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
                manufacturer: productDoc.manufacturer,
                products: [{
                    product: productDoc._id,
                    quantity: Number(quantity),
                    manufacturerPrice: mPrice
                }],
                totalAmount,
                paymentStatus: 'pending',
                notes: 'Auto-generated from Stock Addition',
            });
            const createdPurchase = await purchase.save();

            // Log Inventory Movement against this Purchase
            await InventoryMovement.create({
                user: req.user._id,
                product: productDoc._id,
                date: new Date(),
                type: 'purchase',
                quantity: Number(quantity),
                referenceId: createdPurchase._id,
                notes: `Auto-purchase via Stock interface: ${createdPurchase.purchaseId}`
            });

            // Update Manufacturer Ledger
            const manufacturerDoc = await Manufacturer.findOne({ _id: productDoc.manufacturer, user: req.user._id });
            if (manufacturerDoc) {
                manufacturerDoc.totalPurchases += totalAmount;
                manufacturerDoc.pendingBalance += totalAmount;
                manufacturerDoc.lastPurchaseDate = new Date();
                await manufacturerDoc.save();
            }
        }

        return res.status(stock ? 200 : 201).json(createdStock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateStockQuantity = async (req, res) => {
    const { action, quantity } = req.body; // action can be 'add', 'subtract', 'set'
    try {
        const stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
        if (stock) {
            if (action === 'add') {
                stock.quantity += Number(quantity);
                
                // Automatic Purchase Integration for purely additive adjustments
                const productDoc = await Product.findOne({ _id: stock.product, user: req.user._id });
                if (productDoc && productDoc.manufacturer) {
                    const mPrice = productDoc.manufacturerPrice || 0;
                    const totalAmount = Number(quantity) * mPrice;

                    // Generate Purchase
                    const purchase = new Purchase({
                        user: req.user._id,
                        purchaseId: 'PUR-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
                        manufacturer: productDoc.manufacturer,
                        products: [{
                            product: productDoc._id,
                            quantity: Number(quantity),
                            manufacturerPrice: mPrice
                        }],
                        totalAmount,
                        paymentStatus: 'pending',
                        notes: 'Auto-generated from Stock Adjustment (Addition)',
                    });
                    const createdPurchase = await purchase.save();

                    // Log Inventory Movement
                    await InventoryMovement.create({
                        user: req.user._id,
                        product: productDoc._id,
                        date: new Date(),
                        type: 'purchase',
                        quantity: Number(quantity),
                        referenceId: createdPurchase._id,
                        notes: `Auto adjustment via Stock interface: ${createdPurchase.purchaseId}`
                    });

                    // Update Manufacturer Ledger
                    const manufacturerDoc = await Manufacturer.findOne({ _id: productDoc.manufacturer, user: req.user._id });
                    if (manufacturerDoc) {
                        manufacturerDoc.totalPurchases += totalAmount;
                        manufacturerDoc.pendingBalance += totalAmount;
                        manufacturerDoc.lastPurchaseDate = new Date();
                        await manufacturerDoc.save();
                    }
                }
            }
            else if (action === 'subtract') {
                if (stock.quantity >= Number(quantity)) {
                     stock.quantity -= Number(quantity);
                } else {
                     return res.status(400).json({ message: 'Insufficient stock' });
                }
            }
            else if (action === 'set') stock.quantity = Number(quantity);
            
            const updatedStock = await stock.save();
            res.json(updatedStock);
        } else {
            res.status(404).json({ message: 'Stock not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteStock = async (req, res) => {
    try {
        const stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
        if (stock) {
            await stock.deleteOne();
            res.json({ message: 'Stock removed' });
        } else {
            res.status(404).json({ message: 'Stock not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStocks, getStockById, createOrUpdateStock, updateStockQuantity, deleteStock };
