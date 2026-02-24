import express from "express";
import { createProviderProfile } from "../controllers/providerController.js";

const providerRouter = express.Router();

providerRouter.post("/", createProviderProfile);

export default providerRouter;