import ProviderProfile from "../models/providerProfile.js";

export async function createProviderProfile(req, res) {

    try {

        const user = req.user;

        if(user == null){
            res.status(401).json(
                {
                    message: "Unaurthorized user..."
                }
            )
            return
        }

        console.log(user);

        const lastProvider = await ProviderProfile.findOne().sort({ createdAt: -1 });

        let newProviderCode = "PROV0000001";

        if (lastProvider?.providerCode) {
            const lastNum = parseInt(lastProvider.providerCode.replace("PROV", ""), 10);
            const nextNum = lastNum + 1;
            newProviderCode = "PROV" + String(nextNum).padStart(7, "0");
        }

        const providerData = req.body;

        console.log(providerData); 

        const newProviderProfile = new ProviderProfile(
            {
                userId: req.user.id,
                providerCode: newProviderCode,
                businessName: providerData.businessName,
                providerType: providerData.providerType,
                categories: providerData.categories,
                description: providerData.description,
                contactPerson: providerData.contactPerson,
                phone: providerData.phone,
                email: providerData.email,
                addressLine: providerData.addressLine,
                city: providerData.city,
                district: providerData.district,
                location: {
                    type: "Point",
                    coordinates: providerData.location.coordinates,
                },
                serviceRadiusKm: providerData.serviceRadiusKm,
            }
        )

        const savedProviderProfile = await newProviderProfile.save();

        res.status(201).json(
            {
                message: "Provider profile created successfully!",
                providerProfile: savedProviderProfile,
            }
        );

    } catch (error) {
        res.status(500).json(
            {
                message: 'Error creating provider profile',
                error: error.message
            }
        );
    }
}

export async function getAllProviderProfiles(req, res) {

    try {

       const { status } = req.query;

        const filter = {};
        if (status) filter.approvalStatus = status;

        const providerProfiles = await ProviderProfile.find(filter).sort({ createdAt: -1 });

        res.status(200).json(providerProfiles);

    } catch (error) {
        res.status(500).json(
            {
                message: 'Error fetching provider profiles',
                error: error.message
            }
        );
    }
}

export async function getMyProviderProfiles(req, res) {

    try {

        const userId = req.user.id;

        if (!userId) {
            res.status(401).json(
                {
                    message: "Unauthorized user..."
                }
            );
            return;
        }

        const myProfiles = await ProviderProfile.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(myProfiles);
    } catch (error) {
        res.status(500).json(
            {
                message: 'Error fetching my provider profiles',
                error: error.message
            }
        );
    }
}

export async function updateMyProviderProfile(req, res) {

    try {

        const userId = req.user.id;
        const providerCode = req.params.providerCode;

        if (!userId) {
            res.status(401).json(
                {
                    message: "Unauthorized user..."
                }
            );
            return;
        }

        const existing = await ProviderProfile.findOne({ providerCode }); 
        if (!existing) return res.status(404).json(
            { 
                message: "Provider profile not found" 
            }
        );

        if (existing.userId.toString() !== userId.toString()) {
            return res.status(403).json(
                { 
                    message: "Forbidden: Not your profile" 
                }
            );
        }

        const updated = await ProviderProfile.findOneAndUpdate( { providerCode }, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(
            {
                message: "Provider profile updated successfully!",
                providerProfile: updated,
            }
        );

    } catch (error) {
        res.status(500).json(
            {
                message: 'Error updating provider profile',
                error: error.message
            }
        );
    }
}

export async function approveProviderProfile(req, res) {

    try {

        if (req.user.role !== "admin") {
            return res.status(403).json(
                {
                    message: "Forbidden: Admins only"
                }
            );
        }

        const { id } = req.params;

        const updated = await ProviderProfile.findByIdAndUpdate( id,
            {
                approvalStatus: "approved",
                approvedAt: new Date(),
                rejectionReason: "",
            },
            { new: true }
        );

        res.status(200).json(
            {
                message: "Provider profile approved successfully!",
                providerProfile: updated,
            }
        );

    } catch (error) {
        res.status(500).json(
            {
                message: 'Error approving provider profile',
                error: error.message
            }
        );
    }
}

export async function rejectProviderProfile(req, res) {

    try {

        const { id } = req.params;
        const { reason } = req.body;

        const updated = await ProviderProfile.findByIdAndUpdate( id,
            {
                approvalStatus: "rejected",
                approvedAt: null,
                rejectionReason: reason || "Rejected by admin",
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: "Provider profile not found" });

        res.status(200).json(
            { 
                message: "Rejected", 
                providerProfile: updated 
            }
        );

    } catch (error) {
        res.status(500).json(
            {
                message: "Error rejecting provider profile",
                error: error.message,
            }
        );
    }
}