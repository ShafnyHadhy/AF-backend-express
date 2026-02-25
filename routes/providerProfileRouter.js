import express from "express";
import { createProviderProfile, getAllProviderProfiles, getMyProviderProfiles, updateMyProviderProfile } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);
providerRouter.get("/", getAllProviderProfiles);
providerRouter.get("/me", getMyProviderProfiles);
providerRouter.put("/:providerCode", updateMyProviderProfile);

export default providerRouter;