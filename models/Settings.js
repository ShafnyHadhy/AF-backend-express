import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        notificationsEnabled: {
            type: Boolean,
            default: true,
        },
        contactEmail: {
            type: String,
            default: 'admin@ecorevive.com',
        },
        autoApproveProviders: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
