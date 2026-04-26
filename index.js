import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRouter.js";
import providerRouter from "./routes/providerProfileRouter.js";
import productRouter from "./routes/productRouter.js";
import repairRouter from "./routes/repairRouter.js";
import recycleRouter from "./routes/recycleRouter.js";
import adminRouter from "./routes/adminRouter.js";
import { sendEmail } from "./utils/emailService.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== BASIC MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==================== DATABASE CONNECTION ====================
const connectionString = process.env.MONGO_URI;

export const connectDB = async () => {
  if (!connectionString) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  await mongoose.connect(connectionString);
  console.log("Database Connected!");
};

if (process.env.NODE_ENV !== "test") {
  connectDB().catch((err) => {
    console.log("Database Connection Failed!", err);
  });
}

// ==================== ROUTES ====================
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/providers", providerRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/recycling", recycleRouter);
app.use("/api/admin", adminRouter);

app.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "sachiumeshika98@gmail.com",
      subject: "Test Email from SendGrid",
      html: "<h1>Hello!</h1><p>This is a test email from your project.</p>",
    });
    res.json({
      success: true,
      message: "Test email sent successfully!",
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      message: "Email failed",
      details: error.response?.body || error.message,
    });
  }
});

// ==================== HOME ROUTE ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "User Management API is running",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      providers: "/api/providers",
      repairs: "/api/repairs",
      recycling: "/api/recycling",
      admin: "/api/admin",
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
app.use(notFound);

// ==================== GLOBAL ERROR HANDLER ====================
app.use(errorHandler);

// ==================== START SERVER ====================
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
  });
}

export default app;
