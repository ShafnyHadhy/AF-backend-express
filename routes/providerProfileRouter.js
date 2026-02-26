import express from "express";
import { 
        approveProviderProfile, 
        createProviderProfile, 
        deactivateMyProviderProfile, 
        getAllProviderProfiles, 
        getMyProviderProfiles, 
        getNearbyProviders, 
        rejectProviderProfile, 
        restoreProviderProfile, 
        updateMyProviderProfile
    } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.get("/nearby", getNearbyProviders);
providerRouter.get("/me", getMyProviderProfiles);
providerRouter.get("/", getAllProviderProfiles);

providerRouter.post("/", createProviderProfile);

providerRouter.patch("/:providerCode/deactivate", deactivateMyProviderProfile);
providerRouter.patch("/:providerCode/reactivate", restoreProviderProfile);

providerRouter.put("/:providerCode", updateMyProviderProfile);

providerRouter.patch("/:id/approve", approveProviderProfile);
providerRouter.patch("/:id/reject", rejectProviderProfile);

export default providerRouter;