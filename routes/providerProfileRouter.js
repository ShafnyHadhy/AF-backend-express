import express from "express";
import { createProviderProfile, getAllProviderProfiles } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);
providerRouter.get("/", getAllProviderProfiles);

export default providerRouter;