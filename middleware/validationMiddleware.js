// middleware/validationMiddleware.js
import {
  validateRegistrationData,
  validateLoginData,
  validateOTP,
  validateProfileUpdateData,
  validateForgotPasswordData,
} from "../utils/validation.js";

// ==================== REGISTRATION VALIDATION ====================
export const validateRegistration = (req, res, next) => {
  const result = validateRegistrationData(req.body);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.errors.map((error) => ({ message: error })),
    });
  }

  next();
};

// ==================== LOGIN VALIDATION ====================
export const validateLogin = (req, res, next) => {
  const result = validateLoginData(req.body);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.errors.map((error) => ({ message: error })),
    });
  }

  next();
};

// ==================== OTP VALIDATION ====================
export const validateOTPCode = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Please provide a valid email address",
    });
  }

  // OTP validation
  const otpResult = validateOTP(otp);
  if (!otpResult.isValid) {
    errors.push({ field: "otp", message: otpResult.message });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  next();
};

// ==================== PROFILE UPDATE VALIDATION ====================
export const validateProfileUpdate = (req, res, next) => {
  const result = validateProfileUpdateData(req.body);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.errors.map((error) => ({ message: error })),
    });
  }

  next();
};

// ==================== FORGOT PASSWORD (OTP REQUEST) VALIDATION ====================
export const validateForgotPassword = (req, res, next) => {
  const result = validateForgotPasswordData(req.body);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.errors.map((error) => ({ message: error })),
    });
  }

  next();
};

// ==================== RESET PASSWORD WITH OTP VALIDATION ====================
export const validateResetPasswordWithOTP = (req, res, next) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  const errors = [];

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Please provide a valid email address",
    });
  }

  // OTP validation
  if (!otp) {
    errors.push({ field: "otp", message: "OTP is required" });
  } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    errors.push({ field: "otp", message: "OTP must be a 6-digit number" });
  }

  // New password validation
  if (!newPassword) {
    errors.push({ field: "newPassword", message: "New password is required" });
  } else {
    if (newPassword.length < 8) {
      errors.push({
        field: "newPassword",
        message: "Password must be at least 8 characters long",
      });
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one lowercase letter",
      });
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one number",
      });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one special character",
      });
    }
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Please confirm your password",
    });
  } else if (newPassword !== confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  next();
};

// ==================== RESEND OTP VALIDATION ====================
export const validateResendOTP = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Please provide a valid email address",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  next();
};
