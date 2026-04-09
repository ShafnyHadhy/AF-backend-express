import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String, // e.g., "Deleted User", "Approved Provider", "Generated Report"
            required: true,
        },
        entityType: {
            type: String, // "User", "RepairRequest", "RecycleRequest", "Provider", "Settings"
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: String, // Additional context info
        }
    },
    { timestamps: true }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
