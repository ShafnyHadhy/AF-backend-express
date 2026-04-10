import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

// SendGrid API key configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generic email sending function
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL,
}) {
  try {
    const msg = {
      to: to,
      from: from,
      subject: subject,
      html: html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    };

    const response = await sgMail.send(msg);
    console.log("✅ Email sent successfully:", response[0]?.statusCode);
    return response;
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error.response?.body || error.message,
    );

    // Check errors
    if (
      error.code === 403 &&
      error.response?.body?.errors?.[0]?.message?.includes("verified sender")
    ) {
      console.error("⚠️ The from address is not verified in SendGrid!");
      console.error(
        "Go to Settings > Sender Authentication and verify your email.",
      );
    }

    if (error.code === 429) {
      console.error("⚠️ Daily limit reached (100 emails/day)");
    }

    throw error;
  }
}

// ==================== WELCOME EMAIL ====================
export async function sendWelcomeEmail(email, firstName, role = "customer") {
  const subject = `Welcome to Our Service, ${firstName}!`;

  // Role-based colors and icons
  const roleConfig = {
    customer: { color: "#3b82f6", icon: "👤", name: "Customer" },
    provider: { color: "#10b981", icon: "🔧", name: "Service Provider" },
    recycler: { color: "#8b5cf6", icon: "♻️", name: "Recycler" },
    admin: { color: "#ef4444", icon: "👑", name: "Administrator" },
  };

  const config = roleConfig[role] || roleConfig.customer;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: ${config.color}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .role-badge { background: #e0e7ff; color: ${config.color}; padding: 8px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
            .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 10px 0; display: flex; align-items: center; }
            .feature-icon { font-size: 20px; margin-right: 10px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${config.icon} Welcome ${firstName}!</h1>
            </div>
            <div class="content">
                <p>Thank you for registering with us. Your account has been successfully created.</p>
                
                <div style="text-align: center;">
                    <span class="role-badge">${config.name}</span>
                </div>
                
                <div class="features">
                    <h3>Your ${role} account features:</h3>
                    ${getRoleFeatures(role)}
                </div>
                
                <p>You can now login to your account and start using our services.</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="button">Login to Your Account</a>
                </div>
            </div>
            <div class="footer">
                <p>Best regards,<br>Your Team</p>
                <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

// Helper function for role-specific features
function getRoleFeatures(role) {
  const features = {
    customer: `
      <div class="feature-item"><span class="feature-icon">🔍</span> Find service providers near you</div>
      <div class="feature-item"><span class="feature-icon">🔧</span> Track your repair requests</div>
      <div class="feature-item"><span class="feature-icon">⭐</span> Rate and review services</div>
      <div class="feature-item"><span class="feature-icon">💰</span> Earn loyalty points</div>
    `,
    provider: `
      <div class="feature-item"><span class="feature-icon">📋</span> Manage repair requests</div>
      <div class="feature-item"><span class="feature-icon">📊</span> Track your earnings</div>
      <div class="feature-item"><span class="feature-icon">⭐</span> Build your reputation</div>
      <div class="feature-item"><span class="feature-icon">📅</span> Manage your schedule</div>
    `,
    recycler: `
      <div class="feature-item"><span class="feature-icon">♻️</span> Manage recycling requests</div>
      <div class="feature-item"><span class="feature-icon">📍</span> Set collection points</div>
      <div class="feature-item"><span class="feature-icon">📊</span> Track recycling metrics</div>
      <div class="feature-item"><span class="feature-icon">💰</span> Set your pricing</div>
    `,
    admin: `
      <div class="feature-item"><span class="feature-icon">👥</span> Manage all users</div>
      <div class="feature-item"><span class="feature-icon">🔄</span> Change user roles</div>
      <div class="feature-item"><span class="feature-icon">⚡</span> Activate/Deactivate accounts</div>
      <div class="feature-item"><span class="feature-icon">📊</span> View system reports</div>
    `,
  };
  return features[role] || features.customer;
}

// ==================== LOGIN NOTIFICATION ====================
export async function sendLoginNotification(user) {
  const subject = "🔐 New Login Detected on Your Account";

  const location = "Unknown location";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-item { margin: 10px 0; }
            .info-label { font-weight: bold; color: #555; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Security Alert</h1>
            </div>
            <div class="content">
                <p>Hello <strong>${user.firstName}</strong>,</p>
                <p>A new login was detected on your account.</p>
                
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-label">🕐 Time:</span> ${new Date().toLocaleString()}
                    </div>
                    <div class="info-item">
                        <span class="info-label">📍 Location:</span> ${location}
                    </div>
                    <div class="info-item">
                        <span class="info-label">💻 Device:</span> ${user.device || "Unknown device"}
                    </div>
                </div>
                
                <p>✅ If this was you, no action is needed.</p>
                <p>⚠️ If you didn't perform this action, please secure your account immediately.</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/change-password" class="button">Change Password</a>
                </div>
            </div>
            <div class="footer">
                <p>Best regards,<br>Your Team</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
  });
}

// ==================== STATUS CHANGE EMAIL ====================
export async function sendStatusChangeEmail(email, firstName, changes) {
  const subject = "📢 Your Account Status Has Been Updated";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .changes-box { background: #f8f9fa; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Account Update</h1>
            </div>
            <div class="content">
                <p>Hello <strong>${firstName}</strong>,</p>
                <p>Your account has been updated by an administrator.</p>
                
                <div class="changes-box">
                    <strong>📝 Changes made:</strong>
                    <p style="margin-top: 10px;">${changes}</p>
                </div>
                
                <p>If you have any questions about these changes, please contact our support team.</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="button">Login to Your Account</a>
                </div>
            </div>
            <div class="footer">
                <p>Best regards,<br>Your Team</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

// ==================== TEST EMAIL ====================
export async function sendTestEmail(email) {
  const subject = "✅ Test Email - SendGrid is Working!";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .success-icon { font-size: 64px; margin: 20px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: left; }
            .info-item { margin: 10px 0; }
            .info-label { font-weight: bold; color: #555; display: inline-block; width: 100px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .feature-list { text-align: left; margin-top: 20px; }
            .feature-list li { margin: 8px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Test Email</h1>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                <h2 style="color: #059669; margin-bottom: 20px;">Email Service is Working!</h2>
                <p>This is a test email to verify that SendGrid integration is working correctly.</p>
                
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-label">📧 To:</span> ${email}
                    </div>
                    <div class="info-item">
                        <span class="info-label">🕐 Time:</span> ${new Date().toLocaleString()}
                    </div>
                    <div class="info-item">
                        <span class="info-label">🔧 Service:</span> SendGrid
                    </div>
                    <div class="info-item">
                        <span class="info-label">📅 Date:</span> ${new Date().toLocaleDateString()}
                    </div>
                </div>
                
                <div class="feature-list">
                    <h4>✨ Available Email Features:</h4>
                    <ul>
                        <li>✅ Welcome emails on registration</li>
                        <li>✅ OTP verification emails</li>
                        <li>✅ Login notifications</li>
                        <li>✅ Status change notifications</li>
                        <li>✅ Test emails</li>
                    </ul>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated test message from your application</p>
                <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

// ==================== OTP EMAIL ====================
export async function sendOTPEmail(email, otp, firstName) {
  const subject = "🔐 Email Verification OTP";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .otp-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; }
            .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
            .timer-note { color: #e53e3e; font-size: 14px; margin-top: 10px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verification</h1>
            </div>
            <div class="content">
                <p>Hello <strong>${firstName}</strong>,</p>
                <p>Please use the following OTP to verify your email address:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p class="timer-note">⏰ This OTP will expire in 10 minutes</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

// ==================== PASSWORD RESET OTP EMAIL ====================
export async function sendPasswordResetOTPEmail(email, firstName, otp) {
  const subject = "🔐 Password Reset OTP - E Waste Management";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 550px;
                margin: 30px auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .content {
                padding: 35px;
                text-align: center;
            }
            .otp-box {
                background: #fff3e0;
                border: 2px dashed #f59e0b;
                padding: 25px;
                margin: 25px 0;
                border-radius: 12px;
            }
            .otp-code {
                font-size: 52px;
                font-weight: bold;
                letter-spacing: 12px;
                color: #f59e0b;
                font-family: monospace;
            }
            .timer-note {
                color: #ea580c;
                font-size: 14px;
                margin-top: 15px;
                font-weight: bold;
            }
            .warning {
                background: #fef2e8;
                padding: 15px;
                border-radius: 8px;
                color: #666;
                font-size: 13px;
                margin-top: 20px;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #eee;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                background: #f59e0b;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔑 Password Reset</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px;">Hello <strong>${firstName}</strong>,</p>
                <p>We received a request to reset your password.</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                
                <p class="timer-note">⏰ This OTP will expire in <strong>10 minutes</strong></p>
                
                <div class="warning">
                    <strong>⚠️ Security Alert:</strong> Never share this OTP with anyone!
                </div>
                
                <p style="margin-top: 25px;">If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br><strong>E Waste Management Team</strong></p>
                <p>© ${new Date().getFullYear()} E Waste Management. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}
