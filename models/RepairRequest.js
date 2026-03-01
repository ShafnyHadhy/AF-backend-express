import mongoose from 'mongoose';

const repairRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
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
            enum: ['Pending', 'Accepted', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
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

const RepairRequest = mongoose.model('RepairRequest', repairRequestSchema);

export default RepairRequest;
