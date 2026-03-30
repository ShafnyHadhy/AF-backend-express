import mongoose from "mongoose";
import dotenv from "dotenv";
import QRCode from "qrcode";
import Product from "../models/product.js";

dotenv.config();

const updateQRCodes = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected!");

        const products = await Product.find({});
        console.log(`Found ${products.length} products to update.`);

        let count = 0;
        for (const product of products) {
            // Generate the new URL using the FRONTEND_URL in .env
            const publicURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product-public/${product.productID}`;
            
            // Generate the new QR Code
            const qrImage = await QRCode.toDataURL(publicURL);

            // Bypass validation to update only the QR Code for old products
            await Product.updateOne({ _id: product._id }, { $set: { qrCode: qrImage } });
            console.log(`Updated QR Code for product: ${product.productID}`);
            count++;
        }

        console.log(`\nAll ${count} QR Codes updated successfully to point to: ${process.env.FRONTEND_URL}`);
        process.exit(0);

    } catch (error) {
        console.error("Error updating QR codes:", error);
        process.exit(1);
    }
}

updateQRCodes();
