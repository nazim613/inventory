const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Manufacturer = require('./models/Manufacturer');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const connectDB = require('./config/db');

// Load env vars based on root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        await connectDB();

        // Clear existing basic data
        await User.deleteMany();

        // Create Admin user
        const adminUser = new User({
            name: 'System Admin',
            email: 'admin@gmail.com',
            password: 'nazim123',
            role: 'admin'
        });
        await adminUser.save();

        console.log('✅ Seed Data Imported Successfully.');
        console.log('--- LOGIN CREDENTIALS ---');
        console.log('Email: admin@gmail.com');
        console.log('Password: nazim123');
        console.log('-------------------------');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

importData();
