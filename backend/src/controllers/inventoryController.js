const InventoryMovement = require('../models/InventoryMovement');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');

const getInventoryHistory = async (req, res) => {
    try {
        const { productId, startDate, endDate } = req.query;
        const filter = { user: req.user._id };
        
        if (productId) filter.product = productId;
        
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        let movements = await InventoryMovement.find(filter)
            .populate('product', 'name size')
            .sort({ date: -1 })
            .lean();

        // Dynamically fetch reference documents (Purchase or Order) to get payment statuses
        const purchaseIds = movements.filter(m => m.type === 'purchase' && m.referenceId).map(m => m.referenceId);
        const orderIds = movements.filter(m => m.type === 'sale' && m.referenceId).map(m => m.referenceId);

        const [purchases, orders] = await Promise.all([
            Purchase.find({ _id: { $in: purchaseIds }, user: req.user._id }, 'paymentStatus amountPaid totalAmount purchaseId').lean(),
            Order.find({ _id: { $in: orderIds }, user: req.user._id }, 'paymentStatus amountPaid totalAmount invoiceNumber').lean()
        ]);

        movements = movements.map(m => {
            if (m.type === 'purchase') {
                m.purchaseDetails = purchases.find(p => p._id.toString() === m.referenceId?.toString());
            } else if (m.type === 'sale') {
                m.orderDetails = orders.find(o => o._id.toString() === m.referenceId?.toString());
            }
            return m;
        });

        res.json(movements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getInventoryHistory };
