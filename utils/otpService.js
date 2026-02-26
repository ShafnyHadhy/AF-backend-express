import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate numeric OTP with custom length (default 6)
export const generateCustomOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
};

// Generate alphanumeric OTP (for special cases)
export const generateAlphaNumericOTP = (length = 6) => {
  return crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
};

// Send OTP email using SendGrid (Enhanced)
export const sendOTPEmail = async (
  email,
  otp,
  firstName,
  purpose = "registration",
) => {
  // Different messages based on purpose
  const purposeMessages = {
    registration: {
      title: "Email Verification",
      message:
        "Thank you for registering! Please use the following OTP to verify your email address:",
      note: "This OTP is required to complete your registration.",
    },
    login: {
      title: "Login Verification",
      message:
        "You requested to login. Please use the following OTP to verify your identity:",
      note: "This OTP is required to complete your login.",
    },
    passwordReset: {
      title: "Password Reset",
      message:
        "You requested to reset your password. Please use the following OTP to verify your identity:",
      note: "This OTP is required to reset your password.",
    },
    profileUpdate: {
      title: "Profile Update Verification",
      message:
        "You requested to update your profile. Please use the following OTP to verify your identity:",
      note: "This OTP is required to complete your profile update.",
    },
  };

  const purposeData = purposeMessages[purpose] || purposeMessages.registration;

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: `${purposeData.title} - OTP`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 40px; text-align: center; }
              .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
              .otp-box { background-color: #f8f9fa; border: 3px dashed #667eea; padding: 25px; margin: 25px 0; border-radius: 15px; }
              .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace; }
              .timer-note { color: #e53e3e; font-size: 14px; margin: 15px 0; }
              .purpose-note { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; color: #0369a1; font-size: 14px; }
              .footer { background-color: #f8f9fa; padding: 25px; text-align: center; color: #666; font-size: 12px; }
              .warning { color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; padding: 10px; border-radius: 5px; margin: 20px 0; font-size: 13px; }
              .security-tip { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; }
              .security-tip ul { margin: 10px 0; padding-left: 20px; }
              .security-tip li { margin: 5px 0; color: #555; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${purposeData.title}</h1>
              </div>
              <div class="content">
                  <div class="greeting">
                      <p>Hello <strong>${firstName}</strong>,</p>
                  </div>
                  
                  <p>${purposeData.message}</p>
                  
                  <div class="otp-box">
                      <div class="otp-code">${otp}</div>
                  </div>
                  
                  <div class="timer-note">
                      ⏰ This OTP will expire in <strong>3 minutes</strong>
                  </div>
                  
                  <div class="purpose-note">
                      📝 ${purposeData.note}
                  </div>
                  
                  <div class="security-tip">
                      <strong>🔒 Security Tips:</strong>
                      <ul>
                          <li>Never share this OTP with anyone</li>
                          <li>Our staff will never ask for your OTP</li>
                          <li>If you didn't request this, please ignore this email</li>
                      </ul>
                  </div>
                  
                  <div class="warning">
                      ⚠️ If you didn't request this verification, your account may be compromised. Please contact support immediately.
                  </div>
              </div>
              <div class="footer">
                  <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                  <p>This is an automated message, please do not reply.</p>
                  <p>For support, contact: support@yourcompany.com</p>
              </div>
          </div>
      </body>
      </html>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`✅ OTP sent successfully to ${email} for ${purpose}`);
    return {
      success: true,
      messageId: response[0]?.headers["x-message-id"],
      purpose,
    };
  } catch (error) {
    console.error(
      "❌ Error sending OTP email:",
      error.response?.body || error.message,
    );

    // Enhanced error handling
    if (error.code === 403) {
      console.error("⚠️ SendGrid authentication error. Check your API key.");
    } else if (error.code === 429) {
      console.error("⚠️ Rate limit exceeded. Try again later.");
    }

    return {
      success: false,
      error: error.message,
      purpose,
    };
  }
};

// Verify OTP (utility function - to be used in controllers)
export const verifyOTPCode = (userOtp, storedOtp, otpExpires) => {
  // Check if OTP matches
  if (userOtp !== storedOtp) {
    return {
      valid: false,
      message: "Invalid OTP",
    };
  }

  // Check if OTP expired
  if (otpExpires < new Date()) {
    return {
      valid: false,
      message: "OTP expired. Please request new OTP",
    };
  }

  return {
    valid: true,
    message: "OTP verified successfully",
  };
};

// Batch send OTP (for multiple recipients - use carefully)
export const sendBulkOTP = async (recipients) => {
  // recipients: [{ email, otp, firstName, purpose }]
  const promises = recipients.map((recipient) =>
    sendOTPEmail(
      recipient.email,
      recipient.otp,
      recipient.firstName,
      recipient.purpose,
    ),
  );

  const results = await Promise.allSettled(promises);

  const summary = {
    total: recipients.length,
    successful: results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length,
    failed: results.filter((r) => r.status === "rejected" || !r.value.success)
      .length,
  };

  console.log(
    `📊 Bulk OTP send summary: ${summary.successful}/${summary.total} successful`,
  );
  return summary;
};

// For backward compatibility
export default {
  generateOTP,
  generateCustomOTP,
  generateAlphaNumericOTP,
  sendOTPEmail,
  verifyOTPCode,
  sendBulkOTP,
};
