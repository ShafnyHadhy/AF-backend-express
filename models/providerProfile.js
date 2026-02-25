import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    providerCode: {
      type: String,
      unique: true,
      sparse: true, 
      trim: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    providerType: {
      type: String,
      required: true,
      enum: ["repair_center", "recycler"],
      index: true,
    },

    categories: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one category is required",
      },
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    contactPerson: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    city: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    district: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
      index: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        required: true,
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return (
              typeof lng === "number" &&
              typeof lat === "number" &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            );
          },
          message: "Coordinates must be [lng, lat] with valid ranges",
        },
      },
    },

    serviceRadiusKm: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 10,
    },
    
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

providerSchema.index({ location: "2dsphere" });

providerSchema.index({ providerType: 1, approvalStatus: 1, isActive: 1 });

const ProviderProfile = mongoose.model("ProviderProfile", providerSchema);

export default ProviderProfile;