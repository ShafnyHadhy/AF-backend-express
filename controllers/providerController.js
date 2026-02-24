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