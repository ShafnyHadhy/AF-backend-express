import RepairRequest from '../models/RepairRequest.js';

// CREATE
export const createRepairRequest = async (req, res) => {
    try {
        const { productName, category, description, quantity, image, location } = req.body;
        const newRequest = new RepairRequest({
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
export const getRepairRequests = async (req, res) => {
    try {
        let query = {};
        
        // Role-based scoping
        if (req.user.role === 'user') {
            query.user = req.user.userId;
        } else if (req.user.role === 'provider') {
            query.provider = req.user.userId;
        }

        // Filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.category) query.category = req.query.category;
        if (req.query.provider) query.provider = req.query.provider;

        // Search (Product Name or Description)
        if (req.query.search) {
            query.$or = [
                { productName: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const requests = await RepairRequest.find(query)
            .populate('user', 'firstName lastName email')
            .populate('provider', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ (Single)
export const getRepairRequestById = async (req, res) => {
    try {
        const request = await RepairRequest.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('provider', 'firstName lastName email');
        
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// UPDATE (Full Update + Status)
export const updateRepairRequest = async (req, res) => {
    try {
        const { status, note, pickupDate, ...otherData } = req.body;
        const request = await RepairRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Authorization: Admin can update any, User/Provider only their own linked requests
        if (req.user.role !== 'admin' && 
            request.user.toString() !== req.user.userId && 
            request.provider?.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        // Apply general field updates (productName, category, description, quantity, etc.)
        Object.assign(request, otherData);

        if (pickupDate) request.pickupDate = pickupDate;

        // Status update logic
        if (status && status !== request.status) {
            request.status = status;
            request.lifecycle.push({ status, note: note || `Status updated to ${status}` });

            // Auto-assign provider if Accepted by a provider
            if (req.user.role === 'provider' && status === 'Accepted') {
                request.provider = req.user.userId;
            }
        }

        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE
export const deleteRepairRequest = async (req, res) => {
    try {
        const request = await RepairRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Authorization: Admin can delete any, User can delete their own
        if (req.user.role !== 'admin' && request.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        await RepairRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Repair request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
