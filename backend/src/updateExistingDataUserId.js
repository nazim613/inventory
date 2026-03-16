const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Customer = require('./models/Customer');
const Manufacturer = require('./models/Manufacturer');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Purchase = require('./models/Purchase');
const InventoryMovement = require('./models/InventoryMovement');
const Payment = require('./models/Payment');
const Setting = require('./models/Setting');

const runMigration = async () => {
    try {
        await connectDB();
        
        // Find the main admin user
        const adminUser = await User.findOne({ email: 'admin@gmail.com' });
        
        if (!adminUser) {
            console.error('Admin user not found. Please ensure admin@gmail.com exists.');
            process.exit(1);
        }

        const adminId = adminUser._id;
        console.log(`Found admin user: ${adminId}`);

        // Update all existing records that don't have a user attached (or we can just update all for now)
        const models = [
            { name: 'Customer', model: Customer },
            { name: 'Manufacturer', model: Manufacturer },
            { name: 'Product', model: Product },
            { name: 'Stock', model: Stock },
            { name: 'Order', model: Order },
            { name: 'OrderItem', model: OrderItem },
            { name: 'Purchase', model: Purchase },
            { name: 'InventoryMovement', model: InventoryMovement },
            { name: 'Payment', model: Payment },
            { name: 'Setting', model: Setting }
        ];

        for (const { name, model } of models) {
            // Update documents where user is not set
            const result = await model.updateMany(
                { user: { $exists: false } }, 
                { $set: { user: adminId } }
            );
            console.log(`Updated ${result.modifiedCount} ${name} documents.`);
        }

        console.log('✅ Migration completed successfully!');
        process.exit();
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
