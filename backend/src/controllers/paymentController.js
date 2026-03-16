const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Manufacturer = require('../models/Manufacturer');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');

const recordPayment = async (req, res) => {
    try {
        const { type, referenceId, date, amount, paymentMethod, notes } = req.body;
        
        const payment = new Payment({
            user: req.user._id, partyType: type, referenceId, date, amount, paymentMethod, notes
        });

        const savedPayment = await payment.save();

        if (type === 'customer') {
            const customer = await Customer.findOne({ _id: referenceId, user: req.user._id });
            if (customer) {
                customer.totalPaid += amount;
                customer.remainingBalance = Math.max(0, customer.remainingBalance - amount);
                await customer.save();

                // Auto-settle unpaid or partial orders
                let remainingPayment = amount;
                const unpaidOrders = await Order.find({
                    user: req.user._id,
                    customer: referenceId,
                    paymentStatus: { $in: ['unpaid', 'partial'] }
                }).sort({ date: 1 }); // Oldest first

                for (let order of unpaidOrders) {
                    if (remainingPayment <= 0) break;
                    
                    const amountNeeded = order.totalAmount - (order.amountPaid || 0);
                    if (remainingPayment >= amountNeeded) {
                        order.amountPaid = order.totalAmount;
                        order.paymentStatus = 'paid';
                        remainingPayment -= amountNeeded;
                    } else {
                        order.amountPaid = (order.amountPaid || 0) + remainingPayment;
                        order.paymentStatus = 'partial';
                        remainingPayment = 0;
                    }
                    await order.save();
                }
            }
        } else if (type === 'manufacturer') {
            const manufacturer = await Manufacturer.findOne({ _id: referenceId, user: req.user._id });
            if (manufacturer) {
                manufacturer.totalPaid += amount;
                manufacturer.pendingBalance = Math.max(0, manufacturer.pendingBalance - amount);
                await manufacturer.save();

                // Auto-settle unpaid or partial purchases
                let remainingPayment = amount;
                const unpaidPurchases = await Purchase.find({
                    user: req.user._id,
                    manufacturer: referenceId,
                    paymentStatus: { $in: ['pending', 'partial'] }
                }).sort({ date: 1 }); // Oldest first

                for (let purchase of unpaidPurchases) {
                    if (remainingPayment <= 0) break;
                    
                    const amountNeeded = purchase.totalAmount - (purchase.amountPaid || 0);
                    if (remainingPayment >= amountNeeded) {
                        purchase.amountPaid = purchase.totalAmount;
                        purchase.paymentStatus = 'paid';
                        remainingPayment -= amountNeeded;
                    } else {
                        purchase.amountPaid = (purchase.amountPaid || 0) + remainingPayment;
                        purchase.paymentStatus = 'partial';
                        remainingPayment = 0;
                    }
                    await purchase.save();
                }
            }
        }

        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const filter = { user: req.user._id };
        if (req.query.type) filter.partyType = req.query.type;
        if (req.query.referenceId) filter.referenceId = req.query.referenceId;

        const payments = await Payment.find(filter)
            .populate('referenceId', 'name')
            .sort({ date: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { recordPayment, getPayments };
