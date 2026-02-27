import RepairRequest from '../models/RepairRequest.js';

export const createRepairRequest = async (req, res) => {
    try {
        const { productName, category, description, quantity, image, location } = req.body;
        const newRequest = new RepairRequest({
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

export const getRepairRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user') {
            query.user = req.user.id;
        } else if (req.user.role === 'provider') {
            query = { $or: [{ provider: req.user.id }, { provider: null, status: 'Pending' }] };
        }
        const requests = await RepairRequest.find(query).populate('user', 'firstName lastName email').populate('provider', 'firstName lastName email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRepairStatus = async (req, res) => {
    try {
        const { status, note, ...otherDetails } = req.body;
        const request = await RepairRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (req.user.role === 'provider' && status === 'Accepted') {
            request.provider = req.user.id;
        }

        // Apply any other dynamic fields from the body (like pickupDate)
        Object.assign(request, otherDetails);

        request.status = status;
        request.lifecycle.push({ status, note: note || `Status updated to ${status}` });
        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
