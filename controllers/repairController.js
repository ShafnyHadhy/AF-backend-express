import ProviderProfile from '../models/providerProfile.js';
import RepairRequest from '../models/RepairRequest.js';
import Product from '../models/product.js';

// CREATE
export const createRepairRequest = async (req, res) => {
    try {
        const { productID, productName, category, description, quantity, image, location, provider } = req.body;

        const providerProfile = await ProviderProfile.findById({ _id: provider });
        if (!providerProfile) {
            return res.status(400).json({ message: 'Invalid provider ID' });
        }

        const newRequest = new RepairRequest({
            user: req.user.userId,
            productID, // Now correctly defined
            productName,
            provider: providerProfile.userId,
            category,
            description,
            quantity,
            image,
            location,
            lifecycle: [{ status: 'Pending', note: 'Request created' }]
        });
        await newRequest.save();

        // ✅ SYNC: Update Product Lifecycle
        if (productID) {
            const product = await Product.findOne({ productID });
            if (product) {
                product.status = 'under repair';
                product.lifecycle.push({
                    eventType: 'Repair Request',
                    description: `Repair request submitted: ${description}`,
                    location: location?.address || (location?.lat ? `${location.lat}, ${location.lng}` : ""),
                    performedBy: req.user.email
                });
                await product.save();
                console.log(`Synced Repair Request with Product ${productID}`);
            }
        }

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
        if (req.user.role === 'admin') {
            // Admin can see all, no query filter added unless specified in query params
        } else if (req.user.role === 'provider') {
            query.provider = req.user.userId;
        } else {
            // Default: Users only see their own requests
            query.user = req.user.userId;
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

export const updateRepairStatus = async (req, res) => {
    try {
        const { status, note, pickupDate } = req.body;

        const request = await RepairRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (pickupDate) request.pickupDate = pickupDate;

        request.status = status;
        await request.save();

        // ✅ SYNC: Update Product Lifecycle on status change
        if (request.productID) {
            const product = await Product.findOne({ productID: request.productID });
            if (product) {
                let eventType = status;
                if (status === 'Accepted') eventType = 'Repair Accepted';
                if (status === 'Completed') eventType = 'Repaired';

                product.lifecycle.push({
                    eventType,
                    description: note || `Repair status updated to ${status}`,
                    performedBy: req.user.email
                });

                if (status === 'Completed') product.status = 'active';
                else if (status === 'Accepted') product.status = 'under repair';

                await product.save();
                console.log(`Synced Repair status update with Product ${request.productID}`);
            }
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

        await request.save();

        // ✅ SYNC: Update Product Lifecycle on status change
        if (status && status !== request.status && request.productID) {
            const product = await Product.findOne({ productID: request.productID });
            if (product) {
                let eventType = status;
                if (status === 'Accepted') eventType = 'Repair Accepted';
                if (status === 'Completed') eventType = 'Repaired';

                product.lifecycle.push({
                    eventType,
                    description: note || `Repair status updated to ${status}`,
                    performedBy: req.user.email
                });

                if (status === 'Completed') product.status = 'active';
                else if (status === 'Accepted') product.status = 'under repair';

                await product.save();
                console.log(`Synced Repair Request update with Product ${request.productID}`);
            }
        }

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
