import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ===== COMMON FIELDS =====
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["customer", "provider", "recycler", "admin"],
      default: "customer",
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
    },

    // ===== ACCOUNT STATUS =====

    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    // ===== OTP =====
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },

    // ===== CUSTOMER FIELDS =====
    customerDetails: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      nic: String,
      bankDetails: {
        accountHolderName: String,
        bankName: String,
        branch: String,
        accountNumber: String,
        accountType: {
          type: String,
          enum: ["savings", "current"],
        },
      },
      preferredContactMethod: {
        type: String,
        enum: ["email", "phone", "whatsapp"],
        default: "email",
      },
      loyaltyPoints: {
        type: Number,
        default: 0,
      },
      totalRepairs: {
        type: Number,
        default: 0,
      },
    },

    // ===== PROVIDER FIELDS =====
    providerDetails: {
      // Personal Information
      firstName: String,
      lastName: String,

      // Company Information
      companyName: String,
      companyPhone: String,
      companyRegistrationNo: String,

      // Professional Details
      specialization: [
        {
          type: String,
          enum: [
            "mobile",
            "laptop",
            "desktop",
            "tablet",
            "printer",
            "cctv",
            "network",
            "tv",
            "camera",
            "other",
          ],
        },
      ],
      experience: Number,

      // Bank Details
      bankDetails: {
        accountHolderName: String,
        bankName: String,
        branch: String,
        accountNumber: String,
        accountType: {
          type: String,
          enum: ["savings", "current"],
        },
      },

      // Business Details
      description: String,
      yearsInBusiness: Number,
      employeeCount: {
        type: Number,
        default: 1,
      },
      serviceArea: [
        {
          city: String,
          distance: Number,
        },
      ],

      // Working Hours
      workingHours: {
        monday: { open: String, close: String, isOpen: Boolean },
        tuesday: { open: String, close: String, isOpen: Boolean },
        wednesday: { open: String, close: String, isOpen: Boolean },
        thursday: { open: String, close: String, isOpen: Boolean },
        friday: { open: String, close: String, isOpen: Boolean },
        saturday: { open: String, close: String, isOpen: Boolean },
        sunday: { open: String, close: String, isOpen: Boolean },
      },

      // Documents
      documents: {
        businessRegCert: String,
        qualificationDocs: [
          {
            name: String,
            url: String,
            uploadedAt: Date,
          },
        ],
      },

      // Performance
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      completedJobs: {
        type: Number,
        default: 0,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },

      // Pricing
      pricing: {
        consultationFee: Number,
        hourlyRate: Number,
        minServiceCharge: Number,
      },

      // Reviews
      reviews: [
        {
          customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: Number,
          comment: String,
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // ===== RECYCLER FIELDS ===== (New)
    recyclerDetails: {
      // Personal Information
      firstName: String,
      lastName: String,

      // Company Information
      companyName: String,
      companyPhone: String,
      companyRegistrationNo: String,

      // Recycler Specific
      recyclingTypes: [
        {
          type: String,
          enum: [
            "electronics",
            "plastic",
            "metal",
            "paper",
            "glass",
            "batteries",
            "other",
          ],
        },
      ],
      collectionPoints: [
        {
          name: String,
          address: String,
          city: String,
          contactNumber: String,
          operatingHours: String,
        },
      ],
      pickupService: {
        available: { type: Boolean, default: false },
        fee: Number,
        minimumWeight: Number,
      },
      pricing: {
        pricePerKg: Number,
        negotiable: { type: Boolean, default: true },
      },
      certifications: [
        {
          name: String,
          issuedBy: String,
          validUntil: Date,
        },
      ],
      totalRecycled: {
        type: Number, // in kg
        default: 0,
      },
      serviceArea: [String], // Cities they serve

      // Bank Details
      bankDetails: {
        accountHolderName: String,
        bankName: String,
        branch: String,
        accountNumber: String,
        accountType: {
          type: String,
          enum: ["savings", "current"],
        },
      },

      // Performance
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
    },

    // ===== ADMIN FIELDS ===== (New)
    adminDetails: {
      firstName: String,
      lastName: String,
      department: {
        type: String,
        enum: ["management", "operations", "finance", "support", "technical"],
      },
      permissions: [
        {
          type: String,
          enum: [
            "manage_users",
            "manage_providers",
            "manage_recyclers",
            "manage_repairs",
            "view_reports",
            "manage_system",
          ],
        },
      ],
      accessLevel: {
        type: String,
        enum: ["super_admin", "admin", "moderator"],
        default: "admin",
      },
    },
  },
  {
    timestamps: true,
  },
);

// ===== INDEXES for performance =====
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "customerDetails.nic": 1 });
userSchema.index({ "providerDetails.companyRegistrationNo": 1 });
userSchema.index({ "providerDetails.specialization": 1 });
userSchema.index({ "recyclerDetails.companyRegistrationNo": 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });

// ===== VIRTUAL for full name =====
userSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }

  // Fallback to role-specific names
  if (this.role === "customer" && this.customerDetails?.firstName) {
    return `${this.customerDetails.firstName} ${this.customerDetails.lastName}`;
  }
  if (this.role === "provider" && this.providerDetails?.firstName) {
    return `${this.providerDetails.firstName} ${this.providerDetails.lastName}`;
  }
  if (this.role === "recycler" && this.recyclerDetails?.firstName) {
    return `${this.recyclerDetails.firstName} ${this.recyclerDetails.lastName}`;
  }
  if (this.role === "admin" && this.adminDetails?.firstName) {
    return `${this.adminDetails.firstName} ${this.adminDetails.lastName}`;
  }

  return this.email;
});

// ===== METHODS =====
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
