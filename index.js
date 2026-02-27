import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRouter.js";
import providerRouter from "./routes/providerProfileRouter.js";
import productRouter from "./routes/productRouter.js";
import repairRouter from "./routes/repairRouter.js";
import recycleRouter from "./routes/recycleRouter.js";
import adminRouter from "./routes/adminRouter.js";
import { sendEmail } from "./utils/emailService.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  let token = req.header("Authorization");

  if (token != null) {
    token = token.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log("JWT Error:", err.message);
      } else if (decoded) {
        req.user = decoded;
      }
    });
  }

  next();
});

// MongoDB connection
const connectionString = process.env.MONGO_URI;

mongoose
  .connect(connectionString)
  .then(() => {
    console.log("✅ Database Connected!");
  })
  .catch((err) => {
    console.log("❌ Database Connection Failed!", err);
  });

// ==================== USER MANAGEMENT ROUTES ONLY ====================
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/providers", providerRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/recycling", recycleRouter);
app.use("/api/admin", adminRouter);

app.listen(5000,
    () => {
        console.log("Server is running on port 5000!");
    }
);

// ==================== TEST EMAIL ENDPOINT ====================
app.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "sachiumeshika98@gmail.com",
      subject: "Test Email from SendGrid",
      html: "<h1>Hello!</h1><p>This is a test email from your project.</p>",
    });
    res.json({
      success: true,
      message: "✅ Test email sent successfully!",
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      message: "❌ Email failed",
      details: error.response?.body || error.message,
    });
  }
});

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 User Management API is running",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      testEmail: "/test-email",
    },
    supportedRoles: ["customer", "provider", "recycler", "admin"],
    features: [
      "Registration with OTP",
      "Login with JWT",
      "Role-based dashboards",
      "Profile management",
      "Email notifications",
      "Admin user management",
    ],
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found. Available endpoints: /api/users, /test-email, /",
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}!`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`👥 Roles: Customer, Provider, Recycler, Admin`);
  console.log(`📧 Test email: http://localhost:${PORT}/test-email`);
});
