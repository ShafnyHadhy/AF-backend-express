import express from "express";
import { 
        approveProviderProfile, 
        createProviderProfile, 
        deleteMyProviderProfile, 
        getAllProviderProfiles, 
        getMyProviderProfiles, 
        getNearbyProviders, 
        rejectProviderProfile, 
        updateMyProviderProfile
    } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);
providerRouter.get("/", getAllProviderProfiles);
providerRouter.get("/nearby", getNearbyProviders);
providerRouter.get("/me", getMyProviderProfiles);
providerRouter.put("/:providerCode", updateMyProviderProfile);
providerRouter.patch("/:id/approve", approveProviderProfile);
providerRouter.patch("/:id/reject", rejectProviderProfile);
providerRouter.delete("/:providerCode", deleteMyProviderProfile);

export default providerRouter;