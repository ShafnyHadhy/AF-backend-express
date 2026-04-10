import express from "express";
import {
  // Unified Registration
  registerStep1,
  verifyOTP,
  resendOTP,

  // Authentication
  login,

  // Profile Management
  getProfile,
  updateProfile,

  // Provider specific
  getAllProviders,
  getProviderById,

  // Recycler specific
  getAllRecyclers,
  getRecyclerById,

  // Admin routes
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
  deactivateUser,
  activateUser,

  // OTP Based Password Management
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  resendResetOTP,

  // Test Email
  sendTestEmail,
  uploadProfileImage,
  deleteProfileImage,
} from "../controllers/userController.js";

import {
  authenticate,
  isAdmin,
  isCustomer,
  isProvider,
  isRecycler,
  optionalAuth,
} from "../middleware/auth.js";

// Validation Middleware Imports
import {
  validateRegistration,
  validateLogin,
  validateOTPCode,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPasswordWithOTP,
  validateResendOTP,
} from "../middleware/validationMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Upload image
router.post("/profile/image", authenticate, uploadSingle, uploadProfileImage);

// Delete image
router.delete("/profile/image", authenticate, deleteProfileImage);

// Unified Registration with OTP
router.post("/register/step1", validateRegistration, registerStep1);
router.post("/verify-otp", validateOTPCode, verifyOTP);
router.post("/resend-otp", validateResendOTP, resendOTP);

// Login
router.post("/login", validateLogin, login);

// Step 1: Request OTP for password reset
router.post(
  "/forgot-password",
  validateForgotPassword,
  requestPasswordResetOTP,
);

// Step 2: Verify OTP and reset password (one call)
router.post(
  "/reset-password-with-otp",
  validateResetPasswordWithOTP,
  verifyOTPAndResetPassword,
);

// Resend OTP
router.post("/resend-reset-otp", validateResendOTP, resendResetOTP);

// ==================== PROFILE MANAGEMENT ROUTES ====================
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, validateProfileUpdate, updateProfile);

// ==================== PUBLIC PROFILE VIEWING ROUTES ====================
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.get("/recyclers", getAllRecyclers);
router.get("/recyclers/:id", getRecyclerById);

// ==================== TEST EMAIL ROUTE ====================
router.post("/test-email", sendTestEmail);

// ==================== ROLE-SPECIFIC DASHBOARDS ====================
router.get("/customer/dashboard", authenticate, isCustomer, (req, res) => {
  res.json({
    success: true,
    message: "Customer dashboard",
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/provider/dashboard", authenticate, isProvider, (req, res) => {
  res.json({
    success: true,
    message: "Provider dashboard",
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/recycler/dashboard", authenticate, isRecycler, (req, res) => {
  res.json({
    success: true,
    message: "Recycler dashboard",
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Recycler profile update
router.put(
  "/recycler/profile",
  authenticate,
  isRecycler,
  validateProfileUpdate,
  updateProfile,
);

// ==================== ADMIN USER MANAGEMENT ROUTES ====================
router.get("/admin/users", authenticate, isAdmin, getAllUsers);
router.get("/admin/users/:userId", authenticate, isAdmin, getUserById);
router.put("/admin/users/:userId", authenticate, isAdmin, updateUserByAdmin);
router.put(
  "/admin/users/:userId/deactivate",
  authenticate,
  isAdmin,
  deactivateUser,
);
router.put(
  "/admin/users/:userId/activate",
  authenticate,
  isAdmin,
  activateUser,
);
router.delete("/admin/users/:userId", authenticate, isAdmin, deleteUserByAdmin);

// Admin dashboard
router.get("/admin/dashboard", authenticate, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard",
    admin: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ==================== PUBLIC ROUTES WITH OPTIONAL AUTH ====================
router.get("/featured-providers", optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: "Featured providers",
    providers: [],
  });
});

export default router;
