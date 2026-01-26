import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html) => {
    try {
        console.log('📧 Attempting to send email to:', to);
        console.log('📧 Email service configuration check...');
        
        // Check if required environment variables are set
        if (!process.env.EMAIL_USER) {
            throw new Error('EMAIL_USER environment variable not set');
        }
        if (!process.env.EMAIL_PASSWORD) {
            throw new Error('EMAIL_PASSWORD environment variable not set');
        }

        console.log('✅ Email environment variables are set');
        console.log('📮 Creating email transporter with App Password...');
        
        // Use Gmail with App Password (more reliable than OAuth2)
        const transporter = nodemailer.createTransporter({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD, // Gmail App Password
            },
            timeout: 15000, // 15 second timeout
            secure: true,
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
        console.error(`❌ Email Error Details:`, {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
        
        // Provide more specific error messages
        if (err.message.includes('Invalid login')) {
            throw new Error('Email authentication failed. Please check EMAIL_PASSWORD (Gmail App Password).');
        } else if (err.message.includes('timeout')) {
            throw new Error('Email service timeout. Please try again.');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
            throw new Error('Email service connection failed. Please check internet connection.');
        } else if (err.message.includes('535')) {
            throw new Error('Gmail authentication failed. Please check App Password.');
        } else {
            throw new Error(`Email sending failed: ${err.message}`);
        }
    }
}

// Fallback email service using a different provider if Gmail fails
export const sendEmailFallback = async (to, subject, text, html) => {
    try {
        console.log('📧 Attempting fallback email service...');
        
        // You can add other email providers here as fallback
        // For now, we'll use a simple SMTP configuration
        
        const transporter = nodemailer.createTransporter({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `NextDrive Bihar <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Fallback email sent successfully:', result.messageId);
        return result;
        
    } catch (err) {
        console.error('❌ Fallback email also failed:', err.message);
        throw err;
    }
}