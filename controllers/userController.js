import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  sendWelcomeEmail,
  sendLoginNotification,
  sendStatusChangeEmail,
  sendTestEmail as sendTestEmailService,
} from "../utils/emailService.js";
import { generateOTP, sendOTPEmail } from "../utils/otpService.js";

// ==================== REGISTRATION STEP 1 (Send OTP) - ALL ROLES ====================
export async function registerStep1(req, res) {
  try {
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

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check company registration uniqueness for provider/recycler
    if (role === "provider" && providerDetails?.companyRegistrationNo) {
      const existingCompany = await User.findOne({
        "providerDetails.companyRegistrationNo":
          providerDetails.companyRegistrationNo,
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "Company registration number already exists",
        });
      }
    }

    if (role === "recycler" && recyclerDetails?.companyRegistrationNo) {
      const existingCompany = await User.findOne({
        "recyclerDetails.companyRegistrationNo":
          recyclerDetails.companyRegistrationNo,
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "Company registration number already exists",
        });
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
  } catch (error) {
    console.error("Registration step 1 error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

// ==================== VERIFY OTP ====================
export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request new OTP",
      });
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
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
}

// ==================== RESEND OTP ====================
export async function resendOTP(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
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
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
}

// ==================== LOGIN ====================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
        needsVerification: true,
        email: user.email,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact support.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
}

// ==================== GET PROFILE ====================
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "-password -otp -otpExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
}

// ==================== UPDATE PROFILE ====================
export async function updateProfile(req, res) {
  try {
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
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
}

// ==================== GET ALL PROVIDERS ====================
export async function getAllProviders(req, res) {
  try {
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
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching providers",
      error: error.message,
    });
  }
}

// ==================== GET PROVIDER BY ID ====================
export async function getProviderById(req, res) {
  try {
    const { id } = req.params;

    const provider = await User.findOne({
      _id: id,
      role: "provider",
      isActive: true,
    }).select("-password -bankDetails -otp -otpExpires");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error("Error fetching provider:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching provider",
      error: error.message,
    });
  }
}

// ==================== GET ALL RECYCLERS ====================
export async function getAllRecyclers(req, res) {
  try {
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
  } catch (error) {
    console.error("Error fetching recyclers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recyclers",
      error: error.message,
    });
  }
}

// ==================== GET RECYCLER BY ID ====================
export async function getRecyclerById(req, res) {
  try {
    const { id } = req.params;

    const recycler = await User.findOne({
      _id: id,
      role: "recycler",
      isActive: true,
    }).select("-password -bankDetails -otp -otpExpires");

    if (!recycler) {
      return res.status(404).json({
        success: false,
        message: "Recycler not found",
      });
    }

    res.json({
      success: true,
      recycler,
    });
  } catch (error) {
    console.error("Error fetching recycler:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recycler",
      error: error.message,
    });
  }
}

// ==================== ADMIN: GET ALL USERS ====================
export async function getAllUsers(req, res) {
  try {
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
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
}

// ==================== ADMIN: GET USER BY ID ====================
export async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-password -otp -otpExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
}

// ==================== ADMIN: UPDATE USER ====================
export async function updateUserByAdmin(req, res) {
  try {
    const { userId } = req.params;
    const { role, isActive, firstName, lastName, phoneNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
      await sendStatusChangeEmail(
        user.email,
        user.firstName,
        changes.join(", "),
      );
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
  } catch (error) {
    console.error("Admin update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
}

// ==================== ADMIN: DELETE USER (HARD DELETE) ====================
export async function deleteUserByAdmin(req, res) {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete their own account",
      });
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
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
}

// ==================== ADMIN: DEACTIVATE USER ====================
export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deactivating user",
      error: error.message,
    });
  }
}

// ==================== ADMIN: ACTIVATE USER ====================
export async function activateUser(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Error activating user",
      error: error.message,
    });
  }
}

// ==================== ✅ TEST EMAIL (SINGLE VERSION) ====================
export async function sendTestEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await sendTestEmailService(email);

    res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
}

// ==================== FORGOT PASSWORD ====================
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
}

// ==================== RESET PASSWORD ==================
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
}

// ==================== CHANGE PASSWORD ====================
export async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
}

// ==================== INTERNAL HELPER FUNCTIONS ====================
function isAdmin(req) {
  if (req.user == null) {
    return false;
  }
  return req.user.role === "admin";
}
