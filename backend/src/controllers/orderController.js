const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Stock = require('../models/Stock');

const gettingOrders = async (req, res) => {
    try {
        const filter = { user: req.user._id };
        if (req.query.customer) filter.customer = req.query.customer;
        
        const orders = await Order.find(filter)
            .populate('customer', 'name phoneNumber')
            .sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('customer');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        const orderItems = await OrderItem.find({ order: order._id, user: req.user._id }).populate('product');
        res.json({ order, orderItems });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createOrder = async (req, res) => {
    const { customer, items } = req.body; 
    
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    try {
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.pricePerUnit * item.quantity;
        });

        const totalAmount = subtotal; 

        const order = new Order({
            user: req.user._id, customer, subtotal, totalAmount,
            invoiceNumber: 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)
        });

        const createdOrder = await order.save();

        for (const item of items) {
            const newOrderItem = new OrderItem({
                user: req.user._id,
                order: createdOrder._id,
                product: item.product,
                size: item.size,
                quantity: item.quantity,
                unitType: item.unitType,
                pricePerUnit: item.pricePerUnit
            });
            await newOrderItem.save();

            const stock = await Stock.findOne({ user: req.user._id, product: item.product, size: item.size, unitType: item.unitType });
            if (stock && stock.quantity >= item.quantity) {
                 stock.quantity -= item.quantity;
                 await stock.save();
            }

            const InventoryMovement = require('../models/InventoryMovement');
            await InventoryMovement.create({
                user: req.user._id,
                product: item.product,
                date: new Date(),
                type: 'sale',
                quantity: -item.quantity,
                referenceId: createdOrder._id,
                notes: `Sale for Order ${createdOrder.invoiceNumber}`
            });
        }

        const Customer = require('../models/Customer');
        const customerDoc = await Customer.findOne({ _id: customer, user: req.user._id });
        if (customerDoc) {
            customerDoc.totalOrders += 1;
            customerDoc.totalPurchaseValue += totalAmount;
            customerDoc.remainingBalance += totalAmount;
            customerDoc.lastOrderDate = new Date();
            await customerDoc.save();
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        order.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid') {
            order.amountPaid = order.totalAmount;
        } else if (paymentStatus === 'unpaid') {
            order.amountPaid = 0;
        }
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const duplicateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const orderItems = await OrderItem.find({ order: order._id, user: req.user._id });
        
        // Return structured data for frontend to prepopulate
        res.json({
            customer: order.customer,
            items: orderItems.map(item => ({
                product: item.product,
                size: item.size,
                unitType: item.unitType,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getOrders: gettingOrders, getOrderById, createOrder, updatePaymentStatus, duplicateOrder };
