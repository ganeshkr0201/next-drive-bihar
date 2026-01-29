import nodemailer from "nodemailer";
import { google } from "googleapis";


const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // e.g. https://developers.google.com/oauthplayground
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});


const getAccessToken = async () => {
  try {
    const tokenResponse = await oauth2Client.getAccessToken();

    const accessToken =
      typeof tokenResponse === "string"
        ? tokenResponse
        : tokenResponse?.token;

    if (!accessToken) {
      throw new Error("Failed to generate OAuth2 access token");
    }

    return accessToken;
  } catch (error) {
    console.error("❌ OAuth2 token error:", error.message);
    throw new Error("OAuth2 authentication failed - refresh token may be expired");
  }
};



let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const accessToken = await getAccessToken();

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
    tls: {
      rejectUnauthorized: true,
    },
    timeout: 10000, // 10s
  });

  // Verify SMTP connection once
  await transporter.verify();
  console.log('✅ SMTP connection verified');

  return transporter;
};

// send email
export const sendEmail = async (to, subject, text, html) => {
  try {
    // Validate env variables
    const requiredEnv = [
      "EMAIL_USER",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
      "GOOGLE_REDIRECT_URI",
    ];

    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
      }
    }

    if (!to || !subject) {
      throw new Error("Email 'to' and 'subject' are required");
    }

    const mailTransporter = await getTransporter();

    const mailOptions = { 
      from: `NextDrive Bihar <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const result = await mailTransporter.sendMail(mailOptions);

    console.log("📧 Email sent:", result.messageId);
    return result;

  } catch (error) {
    console.error("❌ Email Send Error", {
      message: error.message,
      code: error.code,
      command: error.command,
    });

    if (error.message.includes("OAuth")) {
      throw new Error("Email authentication failed");
    }

    if (error.message.includes("timeout")) {
      throw new Error("Email service timeout");
    }

    throw new Error("Unable to send email at this time");
  }
};
