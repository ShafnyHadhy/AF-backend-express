import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import Product from '../models/product.js';
import RepairRequest from '../models/RepairRequest.js';
import RecycleRequest from '../models/RecycleRequest.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // 1. Clear existing data (Optional - use with caution)
        // await User.deleteMany({});
        // await RepairRequest.deleteMany({});
        // await RecycleRequest.deleteMany({});

        // 2. Create Admin and Provider if they don't exist
        const hashedPassword = await bcrypt.hash('password123', 10);

        const admin = await User.findOneAndUpdate(
            { email: 'admin@ecorevive.com' },
            {
                firstName: 'System',
                lastName: 'Admin',
                password: hashedPassword,
                role: 'admin',
                isEmailVarified: true
            },
            { upsert: true, new: true }
        );
        console.log('Admin user ready:', admin.email);

        const provider = await User.findOneAndUpdate(
            { email: 'provider@repairservice.com' },
            {
                firstName: 'Expert',
                lastName: 'Repairer',
                password: hashedPassword,
                role: 'provider',
                isEmailVarified: true
            },
            { upsert: true, new: true }
        );
        console.log('Provider user ready:', provider.email);

        const standardUser = await User.findOneAndUpdate(
            { email: 'user@gmail.com' },
            {
                firstName: 'John',
                lastName: 'Doe',
                password: hashedPassword,
                role: 'user',
                isEmailVarified: true
            },
            { upsert: true, new: true }
        );
        console.log('Standard user ready:', standardUser.email);

        // 2.5 Create sample Products
        const sampleProducts = [
            {
                productID: 'P001',
                name: 'iPhone 13',
                description: 'Latest apple smartphone with A15 chip',
                price: 999,
                labwlledPrice: '$999',
                category: 'Phone',
                images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200']
            },
            {
                productID: 'P002',
                name: 'Dell XPS 15',
                description: 'Powerful laptop for creators',
                price: 1500,
                labwlledPrice: '$1500',
                category: 'Laptop',
                images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200']
            }
        ];

        for (const p of sampleProducts) {
            await Product.findOneAndUpdate({ productID: p.productID }, p, { upsert: true });
        }
        console.log('Sample products seeded');

        // 3. Create sample Repair Requests
        const sampleRepair = new RepairRequest({
            user: standardUser._id,
            productName: 'iPhone 13 Screen Crack',
            category: 'Phone',
            description: 'The screen is completely shattered after a drop.',
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200',
            location: { lat: 6.9271, lng: 79.8612, address: 'Colombo 07' },
            status: 'Pending',
            lifecycle: [{ status: 'Pending', note: 'Initial request' }]
        });
        await sampleRepair.save();
        console.log('Sample Repair Request created');

        // 4. Create sample Recycle Requests
        const sampleRecycle = new RecycleRequest({
            user: standardUser._id,
            productName: 'Old Dell Laptop',
            category: 'Laptop',
            description: 'Non-functional battery and broken hinge.',
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200',
            location: { lat: 7.2906, lng: 80.6337, address: 'Kandy City Center' },
            status: 'Pending',
            lifecycle: [{ status: 'Pending', note: 'Initial request' }]
        });
        await sampleRecycle.save();
        console.log('Sample Recycle Request created');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
