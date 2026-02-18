import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import jwt from "jsonwebtoken";
import productRouter from "./routes/productRouter.js";
import cors from "cors";
import dotenv from "dotenv";
import { sendEmail } from "./utils/emailService.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  let token = req.header("Authorization");

  if (token != null) {
    token = token.replace("Bearer ", "");
    console.log(token);

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (decoded == null) {
        res.json({
          message: "Invalid token! Please login again!",
        });

        return;
      } else {
        req.user = decoded;
      }
    });
  }

  next(); //if he has token, it will be decoded and added to req.user, if not, it will be ignored and the request will be processed as usual.
});

const connectionString = process.env.MONGO_URI;

mongoose
  .connect(connectionString)
  .then(() => {
    console.log("Database Connected!");
  })
  .catch(() => {
    console.log("Database Connection Failed!");
  });

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);

// Test endpoint - TEMPORARY
app.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "sachiumeshika98@gmail.com",
      subject: "Test Email from SendGrid",
      html: "<h1>Hello!</h1><p>This is a test email from your project.</p>",
    });
    res.json({ message: "✅ Test email sent successfully!" });
  } catch (error) {
    res.status(500).json({
      error: "❌ Email failed",
      details: error.response?.body || error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000!");
});
