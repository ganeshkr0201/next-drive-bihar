import { configDotenv } from "dotenv";
configDotenv();

import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        console.log('📧 Attempting to send email to:', to);
        console.log('📧 Email service configuration check...');
        
        // Check if required environment variables are set
        if (!process.env.EMAIL_USER) {
            throw new Error('EMAIL_USER environment variable not set');
        }
        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new Error('GOOGLE_CLIENT_ID environment variable not set');
        }
        if (!process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('GOOGLE_CLIENT_SECRET environment variable not set');
        }
        if (!process.env.GOOGLE_REFRESH_TOKEN) {
            throw new Error('GOOGLE_REFRESH_TOKEN environment variable not set');
        }

        console.log('✅ Email environment variables are set');
        console.log('🔐 Getting OAuth2 access token...');
        
        const accessToken = await oauth2Client.getAccessToken();
        
        if (!accessToken.token) {
            throw new Error('Failed to obtain OAuth2 access token');
        }
        
        console.log('✅ OAuth2 access token obtained');
        console.log('📮 Creating email transporter...');
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
            timeout: 10000, // 10 second timeout
        });

        console.log('✅ Email transporter created');

        const mailOptions = {
            from: `NextDrive Bihar <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        console.log('📤 Sending email...');
        const result = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', result.messageId);
        return result;
        
    } catch(err) {
        console.error('❌ Email Error Details:', {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
        
        // Provide more specific error messages
        if (err.message.includes('OAuth2')) {
            throw new Error('Email authentication failed. Please check OAuth2 configuration.');
        } else if (err.message.includes('timeout')) {
            throw new Error('Email service timeout. Please try again.');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
            throw new Error('Email service connection failed. Please check internet connection.');
        } else if (err.message.includes('Invalid login')) {
            throw new Error('Email authentication failed. Please check email credentials.');
        } else {
            throw new Error(`Email sending failed: ${err.message}`);
        }
    }
}