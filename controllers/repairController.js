import ProviderProfile from '../models/providerProfile.js';
import RepairRequest from '../models/RepairRequest.js';

export const createRepairRequest = async (req, res) => {
    try {
        const { productName, category, description, quantity, image, location, provider } = req.body;

        const providerProfile = await ProviderProfile.findById({ _id: provider });
        if (!providerProfile) {
            return res.status(400).json({ message: 'Invalid provider ID' });
        }

        const newRequest = new RepairRequest({
            user: req.user.userId,
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
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRepairRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user') {
            query.user = req.user.userId;
        } else if (req.user.role === 'provider') {
            query.provider = req.user.userId;
        }
        const requests = await RepairRequest.find(query).populate('user', 'firstName lastName email').populate('provider', 'firstName lastName email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRepairRequestById = async (req, res) => {
    try {
        const request = await RepairRequest.findById(req.params.id).populate('user', 'firstName lastName email').populate('provider', 'firstName lastName email');
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
        request.lifecycle.push({ status, note: note || `Status updated to ${status}` });

        if (req.user.role === 'provider' && status === 'Accepted') {
            request.provider = req.user.userId;
        }

        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
