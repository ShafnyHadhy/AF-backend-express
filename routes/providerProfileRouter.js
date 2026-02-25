import express from "express";
import { createProviderProfile, getAllProviderProfiles, getMyProviderProfiles } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);
providerRouter.get("/", getAllProviderProfiles);
providerRouter.get("/me", getMyProviderProfiles);

export default providerRouter;