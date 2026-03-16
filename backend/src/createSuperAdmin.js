const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const create = async () => {
    try {
        await connectDB();
        const exists = await User.findOne({ email: 'super@gmail.com' });
        if (!exists) {
            await User.create({
                name: 'Agency Super Admin',
                email: 'super@gmail.com',
                password: 'super123',
                role: 'superadmin'
            });
            console.log('✅ Super admin created: super@gmail.com / super123');
        } else {
            console.log('⚠️ Super admin already exists');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
create();
