import express from "express";
import {
  registerCustomer,
  registerProvider,
  registerCustomerStep1,
  registerProviderStep1,
  verifyOTP,
  resendOTP,
  login,
  getAllProviders,
  getProviderById,
  getCustomerProfile,
  updateCustomerProfile,
  updateProviderProfile,
  addReview,
  getProviderReviews,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  isAdmin,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// OTP Registration Routes
router.post("/register/customer/step1", registerCustomerStep1);
router.post("/register/provider/step1", registerProviderStep1);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// ===== PUBLIC ROUTES =====
router.post("/register/customer", registerCustomer);
router.post("/register/provider", registerProvider);
router.post("/login", login);
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.get("/providers/:providerId/reviews", getProviderReviews);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);

// ===== PROTECTED ROUTES (require authentication) =====
router.get("/customer/profile", authenticate, getCustomerProfile);
router.put("/customer/profile", authenticate, updateCustomerProfile);
router.put("/provider/profile", authenticate, updateProviderProfile);
router.post("/providers/:providerId/reviews", authenticate, addReview);
router.post("/change-password", authenticate, changePassword);

export default router;
