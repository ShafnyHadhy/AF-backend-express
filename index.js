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

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
    (req, res, next) => {
        const authHeader = req.header("Authorization");

        if (authHeader) {
            const parts = authHeader.split(" ");

            if (parts.length !== 2 || parts[0] !== "Bearer") {
                return res.status(401).json({
                    message: "Invalid Authorization header format. Expected 'Bearer <token>'"
                });
            }

            const token = parts[1];

            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err || decoded == null) {
                    return res.status(401).json({
                        message: "Invalid token! Please login again!"
                    });
                } else {
                    req.user = decoded;
                    next();
                }
            });
        } else {
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
app.use("/api/providers", providerRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/recycling", recycleRouter);
app.use("/api/admin", adminRouter);

app.listen(5000,
    () => {
        console.log("Server is running on port 5000!");
    }
);