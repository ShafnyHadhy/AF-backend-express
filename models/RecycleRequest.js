import mongoose from 'mongoose';

const recycleRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        image: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['Pending', 'Scheduled', 'Collected', 'Recycled', 'Cancelled'],
            default: 'Pending',
        },
        pickupDate: {
            type: Date,
            required: false,
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String }
        },
        lifecycle: [
            {
                status: String,
                timestamp: { type: Date, default: Date.now },
                note: String,
            }
        ]
    },
    { timestamps: true }
);

const RecycleRequest = mongoose.model('RecycleRequest', recycleRequestSchema);

export default RecycleRequest;
