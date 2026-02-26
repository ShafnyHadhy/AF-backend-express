import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import jwt from "jsonwebtoken";
import productRouter from "./routes/productRouter.js";
import repairRouter from "./routes/repairRouter.js";
import recycleRouter from "./routes/recycleRouter.js";
import adminRouter from "./routes/adminRouter.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors()); // Enable CORS for all routes and origins

app.use(express.json());

app.use(
    (req, res, next) => {
        const authHeader = req.header("Authorization");
        console.log("-----------------------------------------");
        console.log("Incoming Path:", req.path);

        if (authHeader) {
            console.log("Auth Header present:", authHeader.substring(0, 20) + "...");
            const parts = authHeader.split(" ");

            if (parts.length !== 2 || parts[0] !== "Bearer") {
                console.warn("Invalid Authorization Header Format");
                return res.status(401).json({
                    message: "Invalid Authorization header format. Expected 'Bearer <token>'"
                });
            }

            const token = parts[1];

            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err || decoded == null) {
                    console.error("JWT Verification Error:", err?.message);
                    return res.status(401).json({
                        message: "Invalid token! Please login again!"
                    });
                } else {
                    console.log("JWT Verified for:", decoded.email);
                    req.user = decoded;
                    next();
                }
            });
        } else {
            console.warn("No Authorization Header provided");
            next();
        }
    }
)

const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(
        () => {
            console.log("Database Connected!");
        }
    ).catch(
        (err) => {
            console.log("Database Connection Failed!");
            console.error("Error Detail:", err.message);

            if (err.message.includes("ENOTFOUND")) {
                console.error("DNS Error Detected: The server cannot resolve the MongoDB hostname.");
                console.error("Try switching your DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1).");
            } else if (err.message.includes("ETIMEDOUT")) {
                console.error("Connection Timed Out: Please check your internet connection and IP whitelisting in MongoDB Atlas.");
            }
        }
    );

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/recycling", recycleRouter);
app.use("/api/admin", adminRouter);


app.listen(5001,
    () => {
        console.log("Server is running on port 5001!");
    }
);