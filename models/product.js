import mongoose from 'mongoose';

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
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true
    },
    purchaseDate: {
        type: Date,
        required: true
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

const Product = mongoose.model('Product', productSchema);

export default Product;