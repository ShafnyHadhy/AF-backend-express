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
        } 
        from "../controllers/providerController.js";
import { authenticate } from "../middleware/auth.js";

const providerRouter = express.Router();

providerRouter.get("/nearby", getNearbyProviders);
providerRouter.get("/me", authenticate, getMyProviderProfiles);
providerRouter.get("/", getAllProviderProfiles);

providerRouter.post("/", authenticate, createProviderProfile);

providerRouter.patch("/:providerCode/deactivate", authenticate, deactivateMyProviderProfile);
providerRouter.patch("/:providerCode/reactivate", authenticate, restoreProviderProfile);

providerRouter.put("/:providerCode", authenticate, updateMyProviderProfile);

providerRouter.patch("/:id/approve", authenticate, approveProviderProfile);
providerRouter.patch("/:id/reject", authenticate, rejectProviderProfile);

export default providerRouter;