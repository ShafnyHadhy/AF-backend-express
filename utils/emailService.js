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

// Welcome email template

export async function sendWelcomeEmail(user) {
  const subject = `Welcome ${user.firstName || "User"}!`;
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
                .content { padding: 20px; }
                .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome ${user.firstName}!</h1>
                </div>
                <div class="content">
                    <p>Thank you for registering with us. We're excited to have you on board!</p>
                    <p>Your account has been successfully created.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse our products</li>
                        <li>Track repair status</li>
                        <li>Manage your profile</li>
                    </ul>
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

// Login notification email template

export async function sendLoginNotification(user) {
  const subject = "New Login Detected";
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 10px; text-align: center; }
                .content { padding: 20px; }
                .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Security Alert</h1>
                </div>
                <div class="content">
                    <p>Hello ${user.firstName},</p>
                    <p>A new login was detected on your account.</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p>If this was you, no action is needed.</p>
                    <p>If you didn't perform this action, please contact support immediately.</p>
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
