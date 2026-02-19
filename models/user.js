// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema(
//     {
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//         },
//         firstName: {
//             type: String,
//             required: true,
//         },
//         lastName: {
//             type: String,
//             required: true,
//         },
//         password: {
//             type: String,
//             required: true,
//         },
//         role: {
//             type: String,
//             required: true,
//             default: 'user',
//         },
//         isBlocked: {
//             type: Boolean,
//             default: false,
//         },
//         isEmailVarified: {
//             type: Boolean,
//             default: false,
//         },
//         image: {
//             type: String,
//             default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
//         }
//     }
// );

// const User = mongoose.model('User', userSchema);

// export default User;

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
      enum: ["customer", "provider"],
      default: "customer",
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
    createdAt: {
      type: Date,
      default: Date.now,
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
  },
  {
    timestamps: true,
  },
);

// ===== INDEXES ONLY (for performance) =====
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "customerDetails.nic": 1 });
userSchema.index({ "providerDetails.companyRegistrationNo": 1 });
userSchema.index({ "providerDetails.specialization": 1 });

const User = mongoose.model("User", userSchema);

export default User;
