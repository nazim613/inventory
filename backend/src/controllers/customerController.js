const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ user: req.user._id });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCustomer = async (req, res) => {
    const { name, phoneNumber, address, signatureOrStamp, customPrices } = req.body;
    try {
        const customer = new Customer({
            user: req.user._id, name, phoneNumber, address, signatureOrStamp, customPrices
        });
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
        if (customer) {
            customer.name = req.body.name || customer.name;
            customer.phoneNumber = req.body.phoneNumber || customer.phoneNumber;
            customer.address = req.body.address || customer.address;
            customer.signatureOrStamp = req.body.signatureOrStamp || customer.signatureOrStamp;
            if (req.body.customPrices) {
                customer.customPrices = req.body.customPrices;
            }

            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomerProducts = async (req, res) => {
    try {
        // 1. Find all orders for this customer
        const orders = await Order.find({ customer: req.params.id, user: req.user._id }).lean();
        const orderIds = orders.map(o => o._id);

        if (orderIds.length === 0) {
            return res.json([]);
        }

        // 2. Find all order items matching these orders, populate the product
        const items = await OrderItem.find({ order: { $in: orderIds } })
            .populate('product')
            .lean();

        // 3. Group by product and format movements
        const productMap = {};

        items.forEach(item => {
            if (!item.product) return; // safeguard if product was deleted

            const pId = item.product._id.toString();

            if (!productMap[pId]) {
                productMap[pId] = {
                    ...item.product,
                    totalPurchased: 0,
                    recentMovements: []
                };
            }

            // Find the parent order to get the date and invoice number
            const parentOrder = orders.find(o => o._id.toString() === item.order.toString());
            const itemDate = parentOrder ? parentOrder.date : item.createdAt;
            const invoiceRef = parentOrder ? parentOrder.invoiceNumber : item.order;

            const qtyStr = Math.abs(item.quantity);

            productMap[pId].totalPurchased += qtyStr;
            
            // Format to match the InventoryMovement shape used by the frontend modal
            productMap[pId].recentMovements.push({ 
                _id: item._id, // unique key
                date: itemDate,
                quantity: qtyStr,
                referenceId: invoiceRef,
                type: 'sale',
                orderDetails: parentOrder ? {
                    paymentStatus: parentOrder.paymentStatus,
                    amountPaid: parentOrder.amountPaid,
                    totalAmount: parentOrder.totalAmount
                } : null
            }); 
        });

        // Convert map to array and sort movements by date descending
        const productsList = Object.values(productMap).map(prod => {
            prod.recentMovements.sort((a, b) => new Date(b.date) - new Date(a.date));
            return prod;
        });

        res.json(productsList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerProducts
};
