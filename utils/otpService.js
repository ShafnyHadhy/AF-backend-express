import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email using SendGrid
export const sendOTPEmail = async (email, otp, firstName) => {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "Email Verification OTP",
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 40px; text-align: center; }
                    .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; }
                    .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${firstName}</strong>,</p>
                        <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Your Company. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error(
      "❌ Error sending OTP email:",
      error.response?.body || error.message,
    );
    return false;
  }
};
