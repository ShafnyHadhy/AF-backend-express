import RecycleRequest from '../models/RecycleRequest.js';

// CREATE
export const createRecycleRequest = async (req, res) => {
    try {
        const { productName, category, description, quantity, image, location } = req.body;
        const newRequest = new RecycleRequest({
            user: req.user.userId,
            productName,
            category,
            description,
            quantity,
            image,
            location,
            lifecycle: [{ status: 'Pending', note: 'Request created' }]
        });
        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ (List with Search & Filters)
export const getRecycleRequests = async (req, res) => {
    try {
        let query = {};
        
        // Role-based scoping
        if (req.user.role === 'user') {
            query.user = req.user.userId;
        }

        // Filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.category) query.category = req.query.category;

        // Search (Product Name or Description)
        if (req.query.search) {
            query.$or = [
                { productName: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const requests = await RecycleRequest.find(query)
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ (Single)
export const getRecycleRequestById = async (req, res) => {
    try {
        const request = await RecycleRequest.findById(req.params.id)
            .populate('user', 'firstName lastName email');
        
        if (!request) return res.status(404).json({ message: 'Recycling request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// UPDATE (Full Update + Status)
export const updateRecycleRequest = async (req, res) => {
    try {
        const { status, note, pickupDate, ...otherData } = req.body;
        const request = await RecycleRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Recycling request not found' });

        // Authorization: Admin can update any, User only their own
        if (req.user.role !== 'admin' && request.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        // Apply general field updates
        Object.assign(request, otherData);

        if (pickupDate) request.pickupDate = pickupDate;

        // Status update logic
        if (status && status !== request.status) {
            request.status = status;
            request.lifecycle.push({ status, note: note || `Status updated to ${status}` });
        }

        await request.save();
        res.json(request);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        res.status(500).json({ message: error.message });
    }
};

// DELETE
export const deleteRecycleRequest = async (req, res) => {
    try {
        const request = await RecycleRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Recycling request not found' });

        // Authorization: Admin can delete any, User can delete their own
        if (req.user.role !== 'admin' && request.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        await RecycleRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Recycling request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
