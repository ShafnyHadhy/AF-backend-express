import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        productID: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        altName: {
            type: [String],
            default: [],
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            default: [],
            required: false,
        },
        price: {
            type: Number,
            required: true,
        },
        labwlledPrice: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        }
    }
);

const Product = mongoose.model('Product', productSchema);

export default Product;