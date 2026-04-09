import RepairRequest from '../models/RepairRequest.js';
import RecycleRequest from '../models/RecycleRequest.js';
import User from '../models/user.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';

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
        const { startDate, endDate, providerId, category, repairStatus, recycleStatus } = req.query;

        let repairFilter = {};
        let recycleFilter = {};

        // Date Range
        if (startDate && endDate && startDate !== 'all') {
            // Check for valid dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                repairFilter.createdAt = { $gte: start, $lte: end };
                recycleFilter.createdAt = { $gte: start, $lte: end };
            }
        }

        // Exact Match Filters
        if (category && category !== 'all' && category !== '') {
            repairFilter.category = category;
            recycleFilter.category = category;
        }

        if (repairStatus && repairStatus !== 'all' && repairStatus !== '') {
            repairFilter.status = repairStatus;
        }

        if (recycleStatus && recycleStatus !== 'all' && recycleStatus !== '') {
            recycleFilter.status = recycleStatus;
        }

        if (providerId && providerId !== 'all' && providerId !== '') {
            repairFilter.provider = providerId;
        }

        const repairs = await RepairRequest.find(repairFilter)
            .populate('user', 'firstName lastName')
            .populate('provider', 'firstName lastName');
        const recycling = await RecycleRequest.find(recycleFilter)
            .populate('user', 'firstName lastName');

        const combined = [
            ...repairs.map(r => ({ ...r._doc, type: 'Repair' })),
            ...recycling.map(r => ({ ...r._doc, type: 'Recycling' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Generate Chart Data from the filtered results
        
        // 1. Bar Chart: Breakdown of Repairs vs Recycling
        const barChart = [
            { name: 'Repairs', count: repairs.length },
            { name: 'Recycling', count: recycling.length }
        ];

        // 2. Pie Charts: Status metrics
        const repairStatusesMap = {};
        repairs.forEach(r => repairStatusesMap[r.status] = (repairStatusesMap[r.status] || 0) + 1);
        const pieChartRepairs = Object.keys(repairStatusesMap).map(k => ({ name: k, value: repairStatusesMap[k] }));

        const recycleStatusesMap = {};
        recycling.forEach(r => recycleStatusesMap[r.status] = (recycleStatusesMap[r.status] || 0) + 1);
        const pieChartRecycling = Object.keys(recycleStatusesMap).map(k => ({ name: k, value: recycleStatusesMap[k] }));

        // 3. Line Chart: Monthly Trends for filtered records
        const monthlyTrendMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Populate missing months if range is specified
        if (startDate && endDate && startDate !== 'all') {
             const start = new Date(startDate);
             const end = new Date(endDate);
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                 let current = new Date(start);
                 current.setDate(1); // Set to 1st of month to avoid overflow skips
                 while (current <= end) {
                     const monthName = months[current.getMonth()];
                     const year = current.getFullYear();
                     const key = `${monthName} ${year}`;
                     monthlyTrendMap[key] = { name: key, repairs: 0, recycling: 0, sortKey: parseFloat(`${year}.${current.getMonth()}`) };
                     current.setMonth(current.getMonth() + 1);
                 }
             }
        }

        combined.forEach(item => {
            const date = new Date(item.createdAt);
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();
            const key = `${monthName} ${year}`;
            
            if (!monthlyTrendMap[key]) {
                monthlyTrendMap[key] = { name: key, repairs: 0, recycling: 0, sortKey: parseFloat(`${year}.${date.getMonth()}`) };
            }
            if (item.type === 'Repair') {
                monthlyTrendMap[key].repairs += 1;
            } else {
                monthlyTrendMap[key].recycling += 1;
            }
        });

        const lineChart = Object.values(monthlyTrendMap).sort((a, b) => a.sortKey - b.sortKey).map(({ sortKey, ...rest }) => rest);

        res.json({
            list: combined,
            charts: {
                barChart,
                pieChartRepairs,
                pieChartRecycling,
                lineChart
            }
        });
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

// --- User Management APIs ---
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(id, { role }, { new: true });

        const adminId = req.user ? (req.user.id || req.user._id || req.user.userId) : null;
        if (adminId) {
            await ActivityLog.create({
                adminId,
                action: `Changed user role to ${role}`,
                entityType: 'User',
                entityId: id,
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to update role", error: error.message });
    }
};

export const toggleBlockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isBlocked = !user.isBlocked;
        await user.save();

        const adminId = req.user ? (req.user.id || req.user._id || req.user.userId) : null;
        if (adminId) {
            await ActivityLog.create({
                adminId,
                action: user.isBlocked ? "Blocked User" : "Unblocked User",
                entityType: 'User',
                entityId: id,
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to toggle block status", error: error.message });
    }
};

// --- Provider Management APIs ---
export const getProviders = async (req, res) => {
    try {
        const providers = await User.find({ role: 'provider' }).select("-password");

        // Populate perfomance metric
        const providerData = await Promise.all(providers.map(async (provider) => {
            const completedRepairs = await RepairRequest.countDocuments({ provider: provider._id, status: 'Completed' });
            return {
                ...provider._doc,
                completedRepairs
            };
        }));

        res.status(200).json(providerData);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch providers", error: error.message });
    }
};

// --- Activity Log APIs ---
export const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().populate('adminId', 'firstName lastName email').sort({ createdAt: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activity logs", error: error.message });
    }
};

// --- Settings APIs ---
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings", error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings", error: error.message });
    }
};

