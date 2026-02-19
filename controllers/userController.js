import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  sendWelcomeEmail,
  sendLoginNotification,
} from "../utils/emailService.js";
import { generateOTP, sendOTPEmail } from "../utils/otpService.js";

// ==================== CUSTOMER REGISTRATION ====================
export async function registerCustomerStep1(req, res) {
  try {
    const { email, password, phoneNumber, address, customerDetails } = req.body;

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Prepare user data
    const userData = {
      email,
      password: hashedPassword,
      role: "customer",
      phoneNumber,
      address,
      customerDetails: {
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        dateOfBirth: customerDetails.dateOfBirth,
        nic: customerDetails.nic,
        bankDetails: customerDetails.bankDetails || {},
        preferredContactMethod:
          customerDetails.preferredContactMethod || "email",
        loyaltyPoints: 0,
        totalRepairs: 0,
      },
      isVerified: false,
      otp,
      otpExpires,
    };

    // If user exists but not verified, update; otherwise create new
    if (existingUser && !existingUser.isVerified) {
      await User.findByIdAndUpdate(existingUser._id, userData);
    } else {
      const user = new User(userData);
      await user.save();
    }

    // Send OTP email
    await sendOTPEmail(email, otp, customerDetails.firstName);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      email: email,
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

// ==================== PROVIDER REGISTRATION ====================
export async function registerProviderStep1(req, res) {
  try {
    const { email, password, phoneNumber, address, providerDetails } = req.body;

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if company registration already exists
    if (providerDetails.companyRegistrationNo) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Prepare user data
    const userData = {
      email,
      password: hashedPassword,
      role: "provider",
      phoneNumber,
      address,
      providerDetails: {
        firstName: providerDetails.firstName,
        lastName: providerDetails.lastName,
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
      },
      isVerified: false,
      otp,
      otpExpires,
    };

    // If user exists but not verified, update; otherwise create new
    if (existingUser && !existingUser.isVerified) {
      await User.findByIdAndUpdate(existingUser._id, userData);
    } else {
      const user = new User(userData);
      await user.save();
    }

    // Send OTP email
    await sendOTPEmail(email, otp, providerDetails.firstName);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      email: email,
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

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Check if OTP matches and not expired
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

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email after verification
    if (user.role === "customer") {
      sendWelcomeEmail({
        email: user.email,
        firstName: user.customerDetails.firstName,
      }).catch((err) => console.error("Welcome email failed:", err));
    } else {
      sendWelcomeEmail({
        email: user.email,
        firstName: user.providerDetails.firstName,
      }).catch((err) => console.error("Welcome email failed:", err));
    }

    res.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName:
          user.role === "customer"
            ? user.customerDetails?.firstName
            : user.providerDetails?.firstName,
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

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const firstName =
      user.role === "customer"
        ? user.customerDetails?.firstName
        : user.providerDetails?.firstName;

    await sendOTPEmail(email, otp, firstName);

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

// ==================== ORIGINAL REGISTRATION (Backward Compatibility) ====================
export async function registerCustomer(req, res) {
  try {
    const { email, password, phoneNumber, address, customerDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new customer
    const user = new User({
      email,
      password: hashedPassword,
      role: "customer",
      phoneNumber,
      address,
      customerDetails: {
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        dateOfBirth: customerDetails.dateOfBirth,
        nic: customerDetails.nic,
        bankDetails: customerDetails.bankDetails || {},
        preferredContactMethod:
          customerDetails.preferredContactMethod || "email",
        loyaltyPoints: 0,
        totalRepairs: 0,
      },
      isVerified: true, // Auto-verified for backward compatibility
    });

    await user.save();

    // Send welcome email (don't await - background)
    sendWelcomeEmail({
      email: user.email,
      firstName: user.customerDetails.firstName,
    }).catch((err) => console.error("Welcome email failed:", err));

    res.status(201).json({
      success: true,
      message: "Customer registered successfully!",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.customerDetails.firstName,
        lastName: user.customerDetails.lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

export async function registerProvider(req, res) {
  try {
    const { email, password, phoneNumber, address, providerDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if company registration already exists
    if (providerDetails.companyRegistrationNo) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new provider
    const user = new User({
      email,
      password: hashedPassword,
      role: "provider",
      phoneNumber,
      address,
      providerDetails: {
        firstName: providerDetails.firstName,
        lastName: providerDetails.lastName,
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
      },
      isVerified: true, // Auto-verified for backward compatibility
    });

    await user.save();

    // Send welcome email
    sendWelcomeEmail({
      email: user.email,
      firstName: user.providerDetails.firstName,
    }).catch((err) => console.error("Welcome email failed:", err));

    res.status(201).json({
      success: true,
      message: "Provider registered successfully!",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.providerDetails.firstName,
        lastName: user.providerDetails.lastName,
        companyName: user.providerDetails.companyName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

// ==================== LOGIN (Both Customer & Provider) ====================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
        needsVerification: true,
        email: user.email,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact support.",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" },
    );

    // Send login notification
    sendLoginNotification({
      email: user.email,
      firstName:
        user.role === "customer"
          ? user.customerDetails?.firstName
          : user.providerDetails?.firstName,
    }).catch((err) => console.error("Login email failed:", err));

    // Prepare response based on role
    let userResponse = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    if (user.role === "customer") {
      userResponse.firstName = user.customerDetails?.firstName;
      userResponse.lastName = user.customerDetails?.lastName;
      userResponse.loyaltyPoints = user.customerDetails?.loyaltyPoints;
    } else {
      userResponse.firstName = user.providerDetails?.firstName;
      userResponse.lastName = user.providerDetails?.lastName;
      userResponse.companyName = user.providerDetails?.companyName;
      userResponse.isAvailable = user.providerDetails?.isAvailable;
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

// ==================== GET ALL PROVIDERS ====================
export async function getAllProviders(req, res) {
  try {
    const { specialization, city, minRating } = req.query;

    // Build filter query
    let filter = { role: "provider", isActive: true };

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
      .select("-password -bankDetails -documents")
      .sort({ "providerDetails.rating.average": -1 });

    res.json({
      success: true,
      count: providers.length,
      providers: providers.map((provider) => ({
        id: provider._id,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        address: provider.address,
        providerDetails: {
          firstName: provider.providerDetails?.firstName,
          lastName: provider.providerDetails?.lastName,
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
    }).select("-password -bankDetails");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.json({
      success: true,
      provider: {
        id: provider._id,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        address: provider.address,
        providerDetails: {
          firstName: provider.providerDetails?.firstName,
          lastName: provider.providerDetails?.lastName,
          companyName: provider.providerDetails?.companyName,
          specialization: provider.providerDetails?.specialization,
          experience: provider.providerDetails?.experience,
          description: provider.providerDetails?.description,
          yearsInBusiness: provider.providerDetails?.yearsInBusiness,
          employeeCount: provider.providerDetails?.employeeCount,
          serviceArea: provider.providerDetails?.serviceArea,
          workingHours: provider.providerDetails?.workingHours,
          rating: provider.providerDetails?.rating,
          completedJobs: provider.providerDetails?.completedJobs,
          isAvailable: provider.providerDetails?.isAvailable,
          pricing: provider.providerDetails?.pricing,
          reviews: provider.providerDetails?.reviews,
        },
      },
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

// ==================== GET CUSTOMER PROFILE ====================
export async function getCustomerProfile(req, res) {
  try {
    const userId = req.user.userId;

    const customer = await User.findOne({
      _id: userId,
      role: "customer",
      isActive: true,
    }).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer._id,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        address: customer.address,
        customerDetails: customer.customerDetails,
        isEmailVerified: customer.isEmailVerified,
        isPhoneVerified: customer.isPhoneVerified,
        createdAt: customer.createdAt,
        lastLogin: customer.lastLogin,
      },
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

// ==================== UPDATE CUSTOMER PROFILE ====================
export async function updateCustomerProfile(req, res) {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = ["phoneNumber", "address", "customerDetails"];

    const updateData = {};
    for (let key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    const customer = await User.findOneAndUpdate(
      { _id: userId, role: "customer" },
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      customer: {
        id: customer._id,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        address: customer.address,
        customerDetails: customer.customerDetails,
      },
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

// ==================== UPDATE PROVIDER PROFILE ====================
export async function updateProviderProfile(req, res) {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      "phoneNumber",
      "address",
      "providerDetails.description",
      "providerDetails.specialization",
      "providerDetails.serviceArea",
      "providerDetails.workingHours",
      "providerDetails.pricing",
      "providerDetails.isAvailable",
    ];

    let updateData = {};

    // Handle nested updates
    if (updates.providerDetails) {
      updateData["providerDetails.description"] =
        updates.providerDetails.description;
      updateData["providerDetails.specialization"] =
        updates.providerDetails.specialization;
      updateData["providerDetails.serviceArea"] =
        updates.providerDetails.serviceArea;
      updateData["providerDetails.workingHours"] =
        updates.providerDetails.workingHours;
      updateData["providerDetails.pricing"] = updates.providerDetails.pricing;
      updateData["providerDetails.isAvailable"] =
        updates.providerDetails.isAvailable;
    }

    if (updates.phoneNumber) updateData.phoneNumber = updates.phoneNumber;
    if (updates.address) updateData.address = updates.address;

    const provider = await User.findOneAndUpdate(
      { _id: userId, role: "provider" },
      updateData,
      { new: true, runValidators: true },
    ).select("-password -bankDetails -documents");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      provider: {
        id: provider._id,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        address: provider.address,
        providerDetails: {
          firstName: provider.providerDetails?.firstName,
          lastName: provider.providerDetails?.lastName,
          companyName: provider.providerDetails?.companyName,
          specialization: provider.providerDetails?.specialization,
          description: provider.providerDetails?.description,
          serviceArea: provider.providerDetails?.serviceArea,
          workingHours: provider.providerDetails?.workingHours,
          pricing: provider.providerDetails?.pricing,
          isAvailable: provider.providerDetails?.isAvailable,
          rating: provider.providerDetails?.rating,
          completedJobs: provider.providerDetails?.completedJobs,
        },
      },
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

// ==================== ADD REVIEW FOR PROVIDER ====================
export async function addReview(req, res) {
  try {
    const { providerId } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user.userId;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Find provider
    const provider = await User.findOne({
      _id: providerId,
      role: "provider",
      isActive: true,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Add review
    const review = {
      customerId,
      rating,
      comment,
      date: new Date(),
    };

    provider.providerDetails.reviews.push(review);

    // Update average rating
    const totalReviews = provider.providerDetails.reviews.length;
    const totalRating = provider.providerDetails.reviews.reduce(
      (sum, r) => sum + r.rating,
      0,
    );
    provider.providerDetails.rating.average = totalRating / totalReviews;
    provider.providerDetails.rating.count = totalReviews;

    await provider.save();

    res.json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
}

// ==================== GET PROVIDER REVIEWS ====================
export async function getProviderReviews(req, res) {
  try {
    const { providerId } = req.params;

    const provider = await User.findOne({
      _id: providerId,
      role: "provider",
    }).populate(
      "providerDetails.reviews.customerId",
      "customerDetails.firstName customerDetails.lastName profileImage",
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.json({
      success: true,
      rating: provider.providerDetails?.rating,
      totalReviews: provider.providerDetails?.reviews?.length,
      reviews: provider.providerDetails?.reviews?.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        date: review.date,
        customer: review.customerId
          ? {
              name: `${review.customerId.customerDetails?.firstName} ${review.customerId.customerDetails?.lastName}`,
              image: review.customerId.profileImage,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
}

// ==================== VERIFY EMAIL ====================
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    // Verify token logic here
    // This would typically check a verification token in the database

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying email",
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

    // Generate password reset token logic here
    // Send email with reset link

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

// ==================== RESET PASSWORD ====================
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Verify token and update password logic here

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

    // Check current password
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

    // Hash new password
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

// ==================== ADMIN CHECK FUNCTION ====================
export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  const adminEmails = ["admin@example.com", "sachiumeshika98@gmail.com"];

  if (adminEmails.includes(req.user.email)) {
    return true;
  }

  return false;
}
