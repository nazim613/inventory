const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ user: req.user._id }).populate('manufacturer', 'name brandName');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user._id }).populate('manufacturer', 'name brandName');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, productId, manufacturer, brand, size, unitType, manufacturerPrice, image } = req.body;
    try {
        const productExists = await Product.findOne({ productId, user: req.user._id });
        if (productExists) {
            return res.status(400).json({ message: 'Product with this ID already exists' });
        }

        const product = new Product({
            user: req.user._id, name, productId, manufacturer, brand, size, unitType, manufacturerPrice, image
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
        if (product) {
            product.name = req.body.name || product.name;
            product.productId = req.body.productId || product.productId;
            if (req.body.manufacturer) product.manufacturer = req.body.manufacturer;
            product.brand = req.body.brand || product.brand;
            product.size = req.body.size || product.size;
            if (req.body.unitType) product.unitType = req.body.unitType;
            product.manufacturerPrice = req.body.manufacturerPrice || product.manufacturerPrice;
            product.image = req.body.image || product.image;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
