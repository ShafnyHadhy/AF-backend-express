import jwt from "jsonwebtoken";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import {
  sendWelcomeEmail,
  sendLoginNotification,
} from "../utils/emailService.js";

export async function createUser(req, res) {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    sendWelcomeEmail({
      email: savedUser.email,
      firstName: savedUser.firstName,
    }).catch((err) => {
      console.error("Welcome email failed:", err.message);
    });

    res.json({
      message: "User created successfully!",
      user: {
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create user!",
      error: error.message,
    });
  }
}

export async function loginUser(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isPasswordMatching = bcrypt.compareSync(
      req.body.password,
      user.password,
    );

    if (isPasswordMatching) {
      const token = jwt.sign(
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "24h" },
      );

      sendLoginNotification({
        email: user.email,
        firstName: user.firstName,
      }).catch((err) => {
        console.error("Login email failed:", err.message);
      });

      res.json({
        message: "Login successful!",
        token: token,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed!" });
  }
}

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  if (req.user.role != "admin") {
    return false;
  }

  return true;
}
