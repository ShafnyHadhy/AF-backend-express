import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/product.js';

dotenv.config();

const connectionString = process.env.MONGO_URI;

async function debug() {
    try {
        await mongoose.connect(connectionString);
        console.log("Connected to DB");

        const total = await Product.countDocuments({});
        console.log("Total products:", total);

        const allProducts = await Product.find({}).limit(10);
        console.log("Sample products (first 10):", JSON.stringify(allProducts, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error("Debug error:", err);
    }
}

debug();
