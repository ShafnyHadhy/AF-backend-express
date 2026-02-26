import RecycleRequest from '../models/RecycleRequest.js';

export const createRecycleRequest = async (req, res) => {
    try {
        const { productName, category, description, quantity, image, location } = req.body;
        const newRequest = new RecycleRequest({
            user: req.user.id,
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

export const getRecycleRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user') {
            query.user = req.user.id;
        }
        const requests = await RecycleRequest.find(query).populate('user', 'firstName lastName email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRecycleStatus = async (req, res) => {
    try {
        const { status, note, ...otherDetails } = req.body;
        const request = await RecycleRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Recycling request not found' });

        // Apply any other dynamic fields from the body (like pickupDate)
        Object.assign(request, otherDetails);

        request.status = status;
        request.lifecycle.push({ status, note: note || `Status updated to ${status}` });
        await request.save();
        res.json(request);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        res.status(500).json({ message: error.message });
    }
};
