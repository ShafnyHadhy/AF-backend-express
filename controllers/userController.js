import User from "../models/user.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  sendWelcomeEmail,
  sendLoginNotification,
  sendStatusChangeEmail,
  sendPasswordResetOTPEmail,
  sendTestEmail as sendTestEmailService,
} from "../utils/emailService.js";
import { generateOTP, sendOTPEmail } from "../utils/otpService.js";
import { catchAsync, AppError } from "../middleware/errorHandler.js";

// ==================== REGISTRATION STEP 1 (Send OTP) - ALL ROLES ====================
export const registerStep1 = catchAsync(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    role,
    address,
    customerDetails,
    providerDetails,
    recyclerDetails,
    adminDetails,
  } = req.body;

  // Check required fields
  if (!email || !password || !firstName || !lastName || !phoneNumber || !role) {
    throw new AppError("Missing required fields", 400);
  }

  // Check if user already exists and is verified
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    throw new AppError("Email already registered", 400);
  }

  // Check company registration uniqueness for provider
  if (role === "provider" && providerDetails?.companyRegistrationNo) {
    const existingCompany = await User.findOne({
      "providerDetails.companyRegistrationNo":
        providerDetails.companyRegistrationNo,
    });
    if (existingCompany) {
      throw new AppError("Company registration number already exists", 400);
    }
  }

  // Check company registration uniqueness for recycler
  if (role === "recycler" && recyclerDetails?.companyRegistrationNo) {
    const existingCompany = await User.findOne({
      "recyclerDetails.companyRegistrationNo":
        recyclerDetails.companyRegistrationNo,
    });
    if (existingCompany) {
      throw new AppError("Company registration number already exists", 400);
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP (3 minutes)
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

  // Base user data
  const userData = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    role,
    address: address || {},
    isVerified: false,
    otp,
    otpExpires,
    isActive: true,
  };

  // Add role-specific details based on role
  if (role === "customer" && customerDetails) {
    userData.customerDetails = {
      ...customerDetails,
      loyaltyPoints: 0,
      totalRepairs: 0,
    };
  }

  if (role === "provider" && providerDetails) {
    userData.providerDetails = {
      firstName: providerDetails.firstName || firstName,
      lastName: providerDetails.lastName || lastName,
      companyName: providerDetails.companyName,
      companyPhone: providerDetails.companyPhone,
      companyRegistrationNo: providerDetails.companyRegistrationNo,
      specialization: providerDetails.specialization || [],
      experience: providerDetails.experience || 0,
      bankDetails: providerDetails.bankDetails || {},
      description: providerDetails.description || "",
      yearsInBusiness: providerDetails.yearsInBusiness || 0,
      employeeCount: providerDetails.employeeCount || 1,
      serviceArea: providerDetails.serviceArea || [],
      workingHours: providerDetails.workingHours || {
        monday: { open: "09:00", close: "18:00", isOpen: true },
        tuesday: { open: "09:00", close: "18:00", isOpen: true },
        wednesday: { open: "09:00", close: "18:00", isOpen: true },
        thursday: { open: "09:00", close: "18:00", isOpen: true },
        friday: { open: "09:00", close: "18:00", isOpen: true },
        saturday: { open: "09:00", close: "13:00", isOpen: true },
        sunday: { open: "00:00", close: "00:00", isOpen: false },
      },
      documents: providerDetails.documents || {},
      pricing: providerDetails.pricing || {},
      isAvailable: true,
      rating: { average: 0, count: 0 },
      completedJobs: 0,
      reviews: [],
    };
  }

  if (role === "recycler" && recyclerDetails) {
    userData.recyclerDetails = {
      firstName: recyclerDetails.firstName || firstName,
      lastName: recyclerDetails.lastName || lastName,
      companyName: recyclerDetails.companyName,
      companyPhone: recyclerDetails.companyPhone,
      companyRegistrationNo: recyclerDetails.companyRegistrationNo,
      recyclingTypes: recyclerDetails.recyclingTypes || [],
      collectionPoints: recyclerDetails.collectionPoints || [],
      pickupService: recyclerDetails.pickupService || { available: false },
      pricing: recyclerDetails.pricing || { pricePerKg: 0 },
      certifications: recyclerDetails.certifications || [],
      totalRecycled: 0,
      serviceArea: recyclerDetails.serviceArea || [],
      bankDetails: recyclerDetails.bankDetails || {},
      isAvailable: true,
      rating: { average: 0, count: 0 },
    };
  }

  if (role === "admin" && adminDetails) {
    userData.adminDetails = {
      firstName: adminDetails.firstName || firstName,
      lastName: adminDetails.lastName || lastName,
      department: adminDetails.department || "operations",
      permissions: adminDetails.permissions || ["view_reports"],
      accessLevel: adminDetails.accessLevel || "admin",
    };
  }

  // If user exists but not verified, update; otherwise create new
  if (existingUser && !existingUser.isVerified) {
    await User.findByIdAndUpdate(existingUser._id, userData);
  } else {
    const user = new User(userData);
    await user.save();
  }

  // Send OTP email
  await sendOTPEmail(email, otp, firstName);

  res.status(200).json({
    success: true,
    message: "OTP sent to your email",
    email: email,
    role: role,
  });
});

// ==================== VERIFY OTP ====================
export const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email already verified", 400);
  }

  if (user.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }

  if (user.otpExpires < new Date()) {
    throw new AppError("OTP expired. Please request new OTP", 400);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await sendWelcomeEmail(user.email, user.firstName, user.role);

  res.json({
    success: true,
    message: "Email verified successfully",
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

// ==================== RESEND OTP ====================
export const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email already verified", 400);
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  await sendOTPEmail(email, otp, user.firstName);

  res.json({
    success: true,
    message: "OTP resent successfully",
  });
});

// ==================== LOGIN ====================
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email first", 403);
  }

  if (!user.isActive) {
    throw new AppError(
      "Your account is deactivated. Please contact support.",
      403,
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "24h" },
  );

  sendLoginNotification({
    email: user.email,
    firstName: user.firstName,
  }).catch((err) => console.error("Login email failed:", err));

  const userResponse = {
    id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    isActive: user.isActive,
    isVerified: user.isVerified,
    address: user.address,
  };

  if (user.role === "customer") {
    userResponse.customerDetails = user.customerDetails;
  } else if (user.role === "provider") {
    userResponse.providerDetails = {
      companyName: user.providerDetails?.companyName,
      specialization: user.providerDetails?.specialization,
      isAvailable: user.providerDetails?.isAvailable,
      rating: user.providerDetails?.rating,
      completedJobs: user.providerDetails?.completedJobs,
    };
  } else if (user.role === "recycler") {
    userResponse.recyclerDetails = {
      companyName: user.recyclerDetails?.companyName,
      recyclingTypes: user.recyclerDetails?.recyclingTypes,
      isAvailable: user.recyclerDetails?.isAvailable,
      rating: user.recyclerDetails?.rating,
      totalRecycled: user.recyclerDetails?.totalRecycled,
    };
  } else if (user.role === "admin") {
    userResponse.adminDetails = {
      department: user.adminDetails?.department,
      accessLevel: user.adminDetails?.accessLevel,
    };
  }

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: userResponse,
  });
});

// ==================== GET PROFILE ====================
export const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId).select("-password -otp -otpExpires");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    user,
  });
});

// ==================== UPDATE PROFILE ====================
export const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const updates = req.body;

  const allowedUpdates = [
    "firstName",
    "lastName",
    "phoneNumber",
    "address",
    "profileImage",
  ];

  const updateData = {};

  for (let key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  }

  if (req.user.role === "customer" && updates.customerDetails) {
    updateData.customerDetails = updates.customerDetails;
  }

  if (req.user.role === "provider" && updates.providerDetails) {
    const allowedProviderUpdates = [
      "description",
      "specialization",
      "serviceArea",
      "workingHours",
      "pricing",
      "isAvailable",
    ];

    updateData.providerDetails = {};
    allowedProviderUpdates.forEach((field) => {
      if (updates.providerDetails[field] !== undefined) {
        updateData.providerDetails[field] = updates.providerDetails[field];
      }
    });
  }

  if (req.user.role === "recycler" && updates.recyclerDetails) {
    const allowedRecyclerUpdates = [
      "recyclingTypes",
      "collectionPoints",
      "pickupService",
      "pricing",
      "serviceArea",
      "isAvailable",
    ];

    updateData.recyclerDetails = {};
    allowedRecyclerUpdates.forEach((field) => {
      if (updates.recyclerDetails[field] !== undefined) {
        updateData.recyclerDetails[field] = updates.recyclerDetails[field];
      }
    });
  }

  if (req.user.role === "admin" && updates.adminDetails) {
    const allowedAdminUpdates = ["department"];

    updateData.adminDetails = {};
    allowedAdminUpdates.forEach((field) => {
      if (updates.adminDetails[field] !== undefined) {
        updateData.adminDetails[field] = updates.adminDetails[field];
      }
    });
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -otp -otpExpires");

  res.json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

// ==================== GET ALL PROVIDERS ====================
export const getAllProviders = catchAsync(async (req, res) => {
  const { specialization, city, minRating } = req.query;

  let filter = { role: "provider", isActive: true, isVerified: true };

  if (specialization) {
    filter["providerDetails.specialization"] = specialization;
  }

  if (city) {
    filter["address.city"] = city;
  }

  if (minRating) {
    filter["providerDetails.rating.average"] = {
      $gte: parseFloat(minRating),
    };
  }

  const providers = await User.find(filter)
    .select("-password -bankDetails -documents -otp -otpExpires")
    .sort({ "providerDetails.rating.average": -1 });

  res.json({
    success: true,
    count: providers.length,
    providers: providers.map((provider) => ({
      id: provider._id,
      email: provider.email,
      firstName: provider.firstName,
      lastName: provider.lastName,
      phoneNumber: provider.phoneNumber,
      address: provider.address,
      providerDetails: {
        companyName: provider.providerDetails?.companyName,
        specialization: provider.providerDetails?.specialization,
        experience: provider.providerDetails?.experience,
        rating: provider.providerDetails?.rating,
        completedJobs: provider.providerDetails?.completedJobs,
        isAvailable: provider.providerDetails?.isAvailable,
        pricing: provider.providerDetails?.pricing,
        description: provider.providerDetails?.description,
      },
    })),
  });
});

// ==================== GET PROVIDER BY ID ====================
export const getProviderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const provider = await User.findOne({
    _id: id,
    role: "provider",
    isActive: true,
  }).select("-password -bankDetails -otp -otpExpires");

  if (!provider) {
    throw new AppError("Provider not found", 404);
  }

  res.json({
    success: true,
    provider,
  });
});

// ==================== GET ALL RECYCLERS ====================
export const getAllRecyclers = catchAsync(async (req, res) => {
  const { recyclingType, city } = req.query;

  let filter = { role: "recycler", isActive: true, isVerified: true };

  if (recyclingType) {
    filter["recyclerDetails.recyclingTypes"] = recyclingType;
  }

  if (city) {
    filter["recyclerDetails.serviceArea"] = city;
  }

  const recyclers = await User.find(filter)
    .select("-password -bankDetails -otp -otpExpires")
    .sort({ "recyclerDetails.rating.average": -1 });

  res.json({
    success: true,
    count: recyclers.length,
    recyclers: recyclers.map((recycler) => ({
      id: recycler._id,
      email: recycler.email,
      firstName: recycler.firstName,
      lastName: recycler.lastName,
      phoneNumber: recycler.phoneNumber,
      address: recycler.address,
      recyclerDetails: {
        companyName: recycler.recyclerDetails?.companyName,
        recyclingTypes: recycler.recyclerDetails?.recyclingTypes,
        pickupService: recycler.recyclerDetails?.pickupService,
        pricing: recycler.recyclerDetails?.pricing,
        serviceArea: recycler.recyclerDetails?.serviceArea,
        rating: recycler.recyclerDetails?.rating,
        totalRecycled: recycler.recyclerDetails?.totalRecycled,
        isAvailable: recycler.recyclerDetails?.isAvailable,
      },
    })),
  });
});

// ==================== GET RECYCLER BY ID ====================
export const getRecyclerById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const recycler = await User.findOne({
    _id: id,
    role: "recycler",
    isActive: true,
  }).select("-password -bankDetails -otp -otpExpires");

  if (!recycler) {
    throw new AppError("Recycler not found", 404);
  }

  res.json({
    success: true,
    recycler,
  });
});

// ==================== ADMIN: GET ALL USERS ====================
export const getAllUsers = catchAsync(async (req, res) => {
  const { role, status, search, page = 1, limit = 10 } = req.query;

  let query = {};

  if (role) query.role = role;
  if (status) {
    query.isActive = status === "active";
  }
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password -otp -otpExpires")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ==================== ADMIN: GET USER BY ID ====================
export const getUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password -otp -otpExpires");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    user,
  });
});

// ==================== ADMIN: UPDATE USER ====================
export const updateUserByAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { role, isActive, firstName, lastName, phoneNumber } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const changes = [];
  const oldRole = user.role;
  const oldStatus = user.isActive;

  if (role && role !== user.role) {
    user.role = role;
    changes.push(`role changed from ${oldRole} to ${role}`);
  }

  if (isActive !== undefined && isActive !== user.isActive) {
    user.isActive = isActive;
    changes.push(`account ${isActive ? "activated" : "deactivated"}`);
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phoneNumber) user.phoneNumber = phoneNumber;

  await user.save();

  if (changes.length > 0) {
    await sendStatusChangeEmail(user.email, user.firstName, changes.join(", "));
  }

  res.json({
    success: true,
    message: "User updated successfully",
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

// ==================== ADMIN: DELETE USER (HARD DELETE) ====================
export const deleteUserByAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.userId) {
    throw new AppError("Admin cannot delete their own account", 400);
  }

  // Hard delete - permanently remove from database
  await User.findByIdAndDelete(userId);

  // Send email notification (optional)
  try {
    await sendStatusChangeEmail(
      user.email,
      user.firstName,
      "Your account has been permanently deleted by administrator",
    );
  } catch (emailError) {
    console.error("Failed to send deletion email:", emailError);
  }

  res.json({
    success: true,
    message: `User ${user.email} has been permanently deleted`,
  });
});

// ==================== ADMIN: DEACTIVATE USER ====================
export const deactivateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = false;
  await user.save();

  await sendStatusChangeEmail(
    user.email,
    user.firstName,
    "Your account has been deactivated by administrator",
  );

  res.json({
    success: true,
    message: "User deactivated successfully",
  });
});

// ==================== ADMIN: ACTIVATE USER ====================
export const activateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = true;
  await user.save();

  await sendStatusChangeEmail(
    user.email,
    user.firstName,
    "Your account has been activated by administrator",
  );

  res.json({
    success: true,
    message: "User activated successfully",
  });
});

// ==================== OTP BASED PASSWORD RESET ====================

// Step 1: Request Password Reset OTP
export const requestPasswordResetOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  // Security: Don't reveal if email exists
  if (!user || !user.isVerified) {
    return res.json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset OTP.",
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to user
  user.resetOTP = otp;
  user.resetOTPExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  // Debug log
  console.log("\n" + "=".repeat(60));
  console.log("🔐 PASSWORD RESET OTP REQUEST");
  console.log("=".repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`👤 User: ${user.firstName}`);
  console.log(`🔢 OTP: ${otp}`);
  console.log(`⏰ Expires: ${new Date(otpExpires).toLocaleString()}`);
  console.log("=".repeat(60) + "\n");

  try {
    // Send OTP email
    await sendPasswordResetOTPEmail(user.email, user.firstName, otp);
    console.log("✅ Password reset OTP email sent successfully!");

    res.json({
      success: true,
      message:
        "Password reset OTP sent to your email. It will expire in 10 minutes.",
    });
  } catch (emailError) {
    console.error("❌ Failed to send OTP email:", emailError.message);

    // Development mode - show OTP in response
    res.json({
      success: true,
      message: "Password reset OTP generated.",
      ...(process.env.NODE_ENV !== "production" && { devOTP: otp }),
    });
  }
});

// Verify OTP and Reset Password
export const verifyOTPAndResetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  // Validate inputs
  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  if (!newPassword || !confirmPassword) {
    throw new AppError("New password and confirm password are required", 400);
  }

  // Check if passwords match
  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new AppError(
      "Password must contain at least one uppercase letter",
      400,
    );
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new AppError(
      "Password must contain at least one lowercase letter",
      400,
    );
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new AppError("Password must contain at least one number", 400);
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
    throw new AppError(
      "Password must contain at least one special character",
      400,
    );
  }

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check if OTP exists
  if (!user.resetOTP) {
    throw new AppError(
      "No password reset request found. Please request a new OTP.",
      400,
    );
  }

  // Check if OTP expired
  if (user.resetOTPExpires < new Date()) {
    throw new AppError("OTP has expired. Please request a new OTP.", 400);
  }

  // Check if OTP matches
  if (user.resetOTP !== otp) {
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  // Check if new password is same as old
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(
      "New password cannot be the same as your current password",
      400,
    );
  }

  // Hash and save new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  // Clear reset OTP fields
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;

  await user.save();

  console.log(`✅ Password reset successful for: ${user.email}`);

  res.json({
    success: true,
    message:
      "Password reset successfully! You can now login with your new password.",
  });
});

// Resend Reset OTP
export const resendResetOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    return res.json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset OTP.",
    });
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.resetOTP = otp;
  user.resetOTPExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  console.log("\n" + "=".repeat(60));
  console.log("🔄 RESEND PASSWORD RESET OTP");
  console.log("=".repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`🔢 New OTP: ${otp}`);
  console.log("=".repeat(60) + "\n");

  try {
    await sendPasswordResetOTPEmail(user.email, user.firstName, otp);
    res.json({
      success: true,
      message: "New OTP sent to your email.",
    });
  } catch (emailError) {
    res.json({
      success: true,
      message: "New OTP generated.",
      ...(process.env.NODE_ENV !== "production" && { devOTP: otp }),
    });
  }
});

// ==================== TEST EMAIL ====================
export const sendTestEmail = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  await sendTestEmailService(email);

  res.json({
    success: true,
    message: "Test email sent successfully",
  });
});

// ==================== INTERNAL HELPER FUNCTIONS ====================
function isAdmin(req) {
  if (req.user == null) {
    return false;
  }
  return req.user.role === "admin";
}
