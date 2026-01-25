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
        const accessToken = await oauth2Client.getAccessToken();
        
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
        });

        const mailOptions = {
            from: `nextDriveBihar <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const result = await transporter.sendMail(mailOptions);

        return result;
    }
    catch(err) {
        console.log(`❌ Email Error: ${err}`);
        throw err;
    }
}

