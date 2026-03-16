const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Customer = require('../models/Customer');
const Stock = require('../models/Stock');
const Order = require('../models/Order');

const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ user: req.user._id });
        const totalManufacturers = await Manufacturer.countDocuments({ user: req.user._id });
        const totalCustomers = await Customer.countDocuments({ user: req.user._id });
        
        const stocks = await Stock.find({ user: req.user._id }).populate('product', 'name');
        let totalStockCount = 0;
        let lowStockAlerts = [];
        
        stocks.forEach(stock => {
            totalStockCount += stock.quantity;
            if (stock.quantity < 20) { // threshold for low stock
                lowStockAlerts.push({
                    _id: stock._id,
                    productName: stock.product ? stock.product.name : 'Unknown Product',
                    size: stock.size,
                    quantity: stock.quantity,
                    unitType: stock.unitType
                });
            }
        });

        const recentOrders = await Order.find({ user: req.user._id })
            .populate('customer', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Aggregate business analytics
        const orders = await Order.find({ user: req.user._id });
        let totalRevenue = 0;
        let pendingCustomerPayments = 0;
        orders.forEach(order => {
            totalRevenue += order.totalAmount;
        });

        const customers = await Customer.find({ user: req.user._id });
        customers.forEach(c => {
             pendingCustomerPayments += (c.remainingBalance || 0);
        });

        const manufacturers = await Manufacturer.find({ user: req.user._id });
        let pendingManufacturerPayments = 0;
        manufacturers.forEach(m => {
            pendingManufacturerPayments += (m.pendingBalance || 0);
        });

        res.json({
            totalProducts,
            totalManufacturers,
            totalCustomers,
            totalStock: totalStockCount,
            lowStockAlerts,
            recentOrders,
            totalRevenue,
            pendingCustomerPayments,
            pendingManufacturerPayments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
