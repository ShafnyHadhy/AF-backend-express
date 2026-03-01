import RepairRequest from '../models/RepairRequest.js';
import RecycleRequest from '../models/RecycleRequest.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalRepairs = await RepairRequest.countDocuments();
        const totalRecycling = await RecycleRequest.countDocuments();

        const completedRepairs = await RepairRequest.countDocuments({ status: 'Completed' });
        const completedRecycling = await RecycleRequest.countDocuments({ status: 'Recycled' });

        // Simple monthly trend data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        const repairTrend = await RepairRequest.aggregate([
            { $match: { createdAt: { $gte: new Date(`${currentYear}-01-01`) } } },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);

        const recycleTrend = await RecycleRequest.aggregate([
            { $match: { createdAt: { $gte: new Date(`${currentYear}-01-01`) } } },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);

        const trendData = months.map((month, index) => {
            const rCount = repairTrend.find(t => t._id === index + 1)?.count || 0;
            const rcCount = recycleTrend.find(t => t._id === index + 1)?.count || 0;
            return { name: month, repairs: rCount, recycling: rcCount };
        });

        res.json({
            kpis: {
                totalRepairs,
                totalRecycling,
                completedRepairs,
                completedRecycling
            },
            trendData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllRequestsReport = async (req, res) => {
    try {
        const repairs = await RepairRequest.find().populate('user', 'firstName lastName').populate('provider', 'firstName lastName');
        const recycling = await RecycleRequest.find().populate('user', 'firstName lastName');

        const combined = [
            ...repairs.map(r => ({ ...r._doc, type: 'Repair' })),
            ...recycling.map(r => ({ ...r._doc, type: 'Recycling' }))
        ].sort((a, b) => b.createdAt - a.createdAt);

        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRequest = async (req, res) => {
    const { type, id } = req.params;
    const updateData = req.body;

    try {
        let updated;
        if (type === 'Repair') {
            updated = await RepairRequest.findByIdAndUpdate(id, updateData, { new: true });
        } else if (type === 'Recycling') {
            updated = await RecycleRequest.findByIdAndUpdate(id, updateData, { new: true });
        } else {
            return res.status(400).json({ message: "Invalid request type" });
        }

        if (!updated) {
            return res.status(404).json({ message: `${type} request not found` });
        }

        res.json({ message: `${type} request updated successfully`, data: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteRequest = async (req, res) => {
    const { type, id } = req.params;

    try {
        let deleted;
        if (type === 'Repair') {
            deleted = await RepairRequest.findByIdAndDelete(id);
        } else if (type === 'Recycling') {
            deleted = await RecycleRequest.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ message: "Invalid request type" });
        }

        if (!deleted) {
            return res.status(404).json({ message: `${type} request not found` });
        }

        res.json({ message: `${type} request deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
