const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const InventoryMovement = require('../models/InventoryMovement');

const getManufacturers = async (req, res) => {
    try {
        const manufacturers = await Manufacturer.find({ user: req.user._id });
        res.json(manufacturers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getManufacturerById = async (req, res) => {
    try {
        const manufacturer = await Manufacturer.findById(req.params.id);
        if (manufacturer) {
            res.json(manufacturer);
        } else {
            res.status(404).json({ message: 'Manufacturer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getManufacturerProducts = async (req, res) => {
    try {
        // Find all products by this manufacturer
        const products = await Product.find({ manufacturer: req.params.id, user: req.user._id });
        
        // Find total stock of each product by aggregating sizes
        const productIds = products.map(p => p._id);
        const stocks = await Stock.find({ product: { $in: productIds }, user: req.user._id });
        
        // Aggregate stock quantities per product ID
        const stockMap = {};
        stocks.forEach(s => {
            if (!stockMap[s.product]) {
                stockMap[s.product] = { totalQuantity: 0, sizes: [] };
            }
            stockMap[s.product].totalQuantity += s.quantity;
            stockMap[s.product].sizes.push({ size: s.size || 'N/A', quantity: s.quantity, unit: s.unitType });
        });

        // Fetch recent inventory movements (incoming stock) for these products
        const movements = await InventoryMovement.find({ 
            user: req.user._id,
            product: { $in: productIds },
            type: { $in: ['purchase', 'adjustment'] },
            quantity: { $gt: 0 } // Only positive incoming stock
        }).sort({ date: -1 }).limit(50);

        // Group movements by product ID
        const movementMap = {};
        movements.forEach(m => {
            if (!movementMap[m.product]) {
                movementMap[m.product] = [];
            }
            movementMap[m.product].push(m);
        });

        const productsWithStock = products.map(p => ({
            ...p.toObject(),
            stockInfo: stockMap[p._id] || { totalQuantity: 0, sizes: [] },
            recentMovements: movementMap[p._id] || []
        }));

        res.json(productsWithStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createManufacturer = async (req, res) => {
    const { name, brandName, phoneNumber, factoryAddress, subBrands } = req.body;
    try {
        const manufacturer = new Manufacturer({
            user: req.user._id, name, brandName, phoneNumber, factoryAddress, subBrands
        });
        const createdManufacturer = await manufacturer.save();
        res.status(201).json(createdManufacturer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateManufacturer = async (req, res) => {
    try {
        const manufacturer = await Manufacturer.findOne({ _id: req.params.id, user: req.user._id });
        if (manufacturer) {
            manufacturer.name = req.body.name || manufacturer.name;
            manufacturer.brandName = req.body.brandName || manufacturer.brandName;
            manufacturer.phoneNumber = req.body.phoneNumber || manufacturer.phoneNumber;
            manufacturer.factoryAddress = req.body.factoryAddress || manufacturer.factoryAddress;
            if (req.body.subBrands) {
                manufacturer.subBrands = req.body.subBrands;
            }

            const updatedManufacturer = await manufacturer.save();
            res.json(updatedManufacturer);
        } else {
            res.status(404).json({ message: 'Manufacturer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteManufacturer = async (req, res) => {
    try {
        const manufacturer = await Manufacturer.findOne({ _id: req.params.id, user: req.user._id });
        if (manufacturer) {
            await manufacturer.deleteOne();
            res.json({ message: 'Manufacturer removed' });
        } else {
            res.status(404).json({ message: 'Manufacturer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getManufacturers,
    getManufacturerById,
    getManufacturerProducts,
    createManufacturer,
    updateManufacturer,
    deleteManufacturer
};
