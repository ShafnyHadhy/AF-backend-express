import ProviderProfile from '../models/providerProfile.js';
import RecycleRequest from '../models/RecycleRequest.js';
import Product from '../models/product.js';

// CREATE
export const createRecycleRequest = async (req, res) => {
    try {
        const { productID, productName, category, description, quantity, image, location, provider } = req.body;

        const providerProfile = await ProviderProfile.findById({ _id: provider });
        if (!providerProfile) {
            return res.status(400).json({ message: 'Invalid provider ID' });
        }

        const newRequest = new RecycleRequest({
            user: req.user.userId,
            productID,
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
                product.status = 'recycling request';
                product.lifecycle.push({
                    eventType: 'Recycling Request',
                    description: `Recycling request submitted: ${description}`,
                    location: location?.address || (location?.lat ? `${location.lat}, ${location.lng}` : ""),
                    performedBy: req.user.email
                });
                await product.save();
                console.log(`Synced Recycling Request with Product ${productID}`);
            }
        }

        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ (List with Search & Filters)
export const getRecycleRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user' || req.user.role === 'customer') {
            query.user = req.user.userId;
        } else if (req.user.role === 'provider') {
            query.provider = req.user.userId;
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

export const getRecycleRequestById = async (req, res) => {
    try {
        const request = await RecycleRequest.findById(req.params.id).populate('user', 'firstName lastName email');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateRecycleStatus = async (req, res) => {
    try {
        const { status, note, ...otherDetails } = req.body;
        const request = await RecycleRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Recycling request not found' });

        // Apply any other dynamic fields from the body (like pickupDate)
        Object.assign(request, otherDetails);

        request.status = status;
        await request.save();

        // ✅ SYNC: Update Product Lifecycle on status change
        if (request.productID) {
            const product = await Product.findOne({ productID: request.productID });
            if (product) {
                let eventType = status;
                if (status === 'Completed') eventType = 'Recycled';

                product.lifecycle.push({
                    eventType,
                    description: note || `Recycling status updated to ${status}`,
                    performedBy: req.user.email
                });

                if (status === 'Completed') product.status = 'recycled';

                await product.save();
                console.log(`Synced Recycling status update with Product ${request.productID}`);
            }
        }

        res.json(request);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        res.status(500).json({ message: error.message });
    }
};

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

        await request.save();

        // ✅ SYNC: Update Product Lifecycle on status change
        if (status && status !== request.status && request.productID) {
            const product = await Product.findOne({ productID: request.productID });
            if (product) {
                let eventType = status;
                if (status === 'Completed') eventType = 'Recycled';

                product.lifecycle.push({
                    eventType,
                    description: note || `Recycling status updated to ${status}`,
                    performedBy: req.user.email
                });

                if (status === 'Completed') product.status = 'recycled';

                await product.save();
                console.log(`Synced Recycling Request update with Product ${request.productID}`);
            }
        }

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
