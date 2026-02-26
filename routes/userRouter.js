import express from "express";
import {
  // Unified Registration
  registerStep1,
  verifyOTP,
  resendOTP,

  // Role-specific registrations
  registerCustomer,
  registerProvider,
  registerCustomerStep1,
  registerProviderStep1,

  // Authentication
  login,

  // Profile Management
  getProfile,
  updateProfile,

  // Customer specific (legacy)
  getCustomerProfile,
  updateCustomerProfile,

  // Provider specific
  updateProviderProfile,
  getAllProviders,
  getProviderById,

  // Recycler specific (NEW)
  getAllRecyclers,
  getRecyclerById,

  // Reviews
  addReview,
  getProviderReviews,

  // Admin routes (NEW)
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
  verifyEmail,

  // Test Email (NEW)
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

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Unified Registration with OTP (for all roles)
router.post("/register/step1", registerStep1);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Legacy registration routes (backward compatibility)
router.post("/register/customer/step1", registerCustomerStep1);
router.post("/register/provider/step1", registerProviderStep1);
router.post("/register/customer", registerCustomer);
router.post("/register/provider", registerProvider);

// Login
router.post("/login", login);

// Public profile viewing
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.get("/recyclers", getAllRecyclers); // NEW
router.get("/recyclers/:id", getRecyclerById); // NEW
router.get("/providers/:providerId/reviews", getProviderReviews);

// Password management
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);

// Test email (public for demo)
router.post("/test-email", sendTestEmail); // NEW

// ==================== PROTECTED ROUTES (Any Authenticated User) ====================

// Profile management (works for all roles)
router.get("/profile", authenticate, getProfile); // NEW - unified profile
router.put("/profile", authenticate, updateProfile); // NEW - unified update

// Legacy profile routes (keep for compatibility)
router.get("/customer/profile", authenticate, getCustomerProfile);
router.put("/customer/profile", authenticate, updateCustomerProfile);
router.put("/provider/profile", authenticate, updateProviderProfile);

// Password change
router.post("/change-password", authenticate, changePassword);

// Reviews (customers only)
router.post(
  "/providers/:providerId/reviews",
  authenticate,
  isCustomer,
  addReview,
);

// ==================== CUSTOMER ONLY ROUTES ====================

router.get("/customer/dashboard", authenticate, isCustomer, (req, res) => {
  res.json({ success: true, message: "Customer dashboard" });
});

// ==================== PROVIDER ONLY ROUTES ====================

router.get("/provider/dashboard", authenticate, isProvider, (req, res) => {
  res.json({ success: true, message: "Provider dashboard" });
});

// ==================== RECYCLER ONLY ROUTES ==================== (NEW)

router.get("/recycler/dashboard", authenticate, isRecycler, (req, res) => {
  res.json({ success: true, message: "Recycler dashboard" });
});

router.put("/recycler/profile", authenticate, isRecycler, updateProfile);

// ==================== ADMIN ONLY ROUTES ==================== (NEW)

// User management
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

// Delete user (hard delete)
router.delete("/admin/users/:userId", authenticate, isAdmin, deleteUserByAdmin);

// Dashboard
router.get("/admin/dashboard", authenticate, isAdmin, (req, res) => {
  res.json({ success: true, message: "Admin dashboard" });
});

// ==================== OPTIONAL AUTH ROUTES ====================

router.get("/featured-providers", optionalAuth, (req, res) => {
  // This works with or without login
  res.json({ success: true, message: "Featured providers" });
});

export default router;
