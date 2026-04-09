import mongoose from 'mongoose';

console.log("!!! DB-MODEL: LOADING PRODUCT MODEL VERSION [2.0.1]");

const lifecycleSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const productSchema = new mongoose.Schema({
    productID: {
        type: String,
        required: true,
        unique: true,
    },
    ownerEmail: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    Brand: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: false
    },
    description: {
        type: String,
        default: ""
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    condition: {
        type: String,
        default: "good"
    },
    status: {
        type: String,
        default: "registered"
    },
    lifecycle: {
        type: [lifecycleSchema],
        default: []
    },
    qrCode: {
        type: String
    },
    images: {
        type: [String],
        default: []
    },
    isForSale: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    }
});

// Force a unique model name to avoid conflicts with previous versions in memory
const Product = mongoose.model('ProductUpdated', productSchema, 'products');

export default Product;