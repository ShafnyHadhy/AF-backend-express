import express from "express";
import { 
        approveProviderProfile, 
        createProviderProfile, 
        getAllProviderProfiles, 
        getMyProviderProfiles, 
        rejectProviderProfile, 
        updateMyProviderProfile
    } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);
providerRouter.get("/", getAllProviderProfiles);
providerRouter.get("/me", getMyProviderProfiles);
providerRouter.put("/:providerCode", updateMyProviderProfile);
providerRouter.patch("/:id/approve", approveProviderProfile);
providerRouter.patch("/:id/reject", rejectProviderProfile);

export default providerRouter;