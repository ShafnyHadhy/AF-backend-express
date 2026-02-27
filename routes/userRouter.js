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

  // Password Management
  forgotPassword,
  resetPassword,
  changePassword,

  // Test Email
  sendTestEmail,
} from "../controllers/userController.js";

import {
  authenticate,
  isAdmin,
  isCustomer,
  isProvider,
  isRecycler,
  isAdminOrOwner,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// Unified Registration with OTP
router.post("/register/step1", registerStep1);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", login);

// Public profile viewing
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.get("/recyclers", getAllRecyclers);
router.get("/recyclers/:id", getRecyclerById);

// Password management
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Test email (public for demo)
router.post("/test-email", sendTestEmail);

// Profile management (works for all roles)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Password change
router.post("/change-password", authenticate, changePassword);

router.get("/customer/dashboard", authenticate, isCustomer, (req, res) => {
  res.json({ success: true, message: "Customer dashboard" });
});

router.get("/provider/dashboard", authenticate, isProvider, (req, res) => {
  res.json({ success: true, message: "Provider dashboard" });
});

router.get("/recycler/dashboard", authenticate, isRecycler, (req, res) => {
  res.json({ success: true, message: "Recycler dashboard" });
});

router.put("/recycler/profile", authenticate, isRecycler, updateProfile);

//User management
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

// Delete user
router.delete("/admin/users/:userId", authenticate, isAdmin, deleteUserByAdmin);

// Dashboard
router.get("/admin/dashboard", authenticate, isAdmin, (req, res) => {
  res.json({ success: true, message: "Admin dashboard" });
});

router.get("/featured-providers", optionalAuth, (req, res) => {
  // This works with or without login
  res.json({ success: true, message: "Featured providers" });
});

export default router;
