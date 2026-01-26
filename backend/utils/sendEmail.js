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

// Enhanced debugging function
const logEmailDebug = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [EMAIL-${level}]`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, data);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

// Environment validation function
const validateEmailEnvironment = () => {
  const requiredVars = [
    'EMAIL_USER',
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN'
  ];
  
  const missing = [];
  const present = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push({
        name: varName,
        length: process.env[varName].length,
        preview: process.env[varName].substring(0, 10) + '...'
      });
    }
  });
  
  logEmailDebug('INFO', 'Environment validation results:', {
    present: present,
    missing: missing,
    totalRequired: requiredVars.length,
    totalPresent: present.length
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

export const sendEmail = async (to, subject, text, html) => {
    const startTime = Date.now();
    
    try {
        logEmailDebug('START', `Initiating email send to: ${to}`);
        logEmailDebug('INFO', 'Email details:', {
          to: to,
          subject: subject,
          hasText: !!text,
          hasHtml: !!html,
          textLength: text ? text.length : 0,
          htmlLength: html ? html.length : 0
        });
        
        // Step 1: Validate environment
        logEmailDebug('STEP', '1/5 - Validating environment variables...');
        validateEmailEnvironment();
        logEmailDebug('SUCCESS', 'Environment validation passed');
        
        // Step 2: Get OAuth2 access token
        logEmailDebug('STEP', '2/5 - Obtaining OAuth2 access token...');
        
        let accessToken;
        try {
          accessToken = await oauth2Client.getAccessToken();
          logEmailDebug('SUCCESS', 'OAuth2 access token obtained', {
            hasToken: !!accessToken.token,
            tokenType: typeof accessToken.token,
            tokenLength: accessToken.token ? accessToken.token.length : 0
          });
        } catch (oauthError) {
          logEmailDebug('ERROR', 'OAuth2 token generation failed:', {
            message: oauthError.message,
            code: oauthError.code,
            status: oauthError.status
          });
          throw new Error(`OAuth2 authentication failed: ${oauthError.message}`);
        }
        
        if (!accessToken.token) {
            logEmailDebug('ERROR', 'OAuth2 access token is null or undefined');
            throw new Error('Failed to obtain valid OAuth2 access token');
        }
        
        // Step 3: Create transporter
        logEmailDebug('STEP', '3/5 - Creating email transporter...');
        
        const transporterConfig = {
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
            timeout: 15000, // 15 second timeout
            connectionTimeout: 10000, // 10 second connection timeout
            greetingTimeout: 5000, // 5 second greeting timeout
            socketTimeout: 10000, // 10 second socket timeout
        };
        
        logEmailDebug('INFO', 'Transporter configuration:', {
          service: transporterConfig.service,
          authType: transporterConfig.auth.type,
          user: transporterConfig.auth.user,
          hasClientId: !!transporterConfig.auth.clientId,
          hasClientSecret: !!transporterConfig.auth.clientSecret,
          hasRefreshToken: !!transporterConfig.auth.refreshToken,
          hasAccessToken: !!transporterConfig.auth.accessToken,
          timeout: transporterConfig.timeout
        });

        const transporter = nodemailer.createTransporter(transporterConfig);
        logEmailDebug('SUCCESS', 'Email transporter created');

        // Step 4: Verify transporter
        logEmailDebug('STEP', '4/5 - Verifying transporter connection...');
        
        try {
          await transporter.verify();
          logEmailDebug('SUCCESS', 'Transporter verification passed');
        } catch (verifyError) {
          logEmailDebug('ERROR', 'Transporter verification failed:', {
            message: verifyError.message,
            code: verifyError.code,
            command: verifyError.command,
            response: verifyError.response
          });
          throw new Error(`Email service verification failed: ${verifyError.message}`);
        }

        // Step 5: Send email
        logEmailDebug('STEP', '5/5 - Sending email...');
        
        const mailOptions = {
            from: `NextDrive Bihar <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        logEmailDebug('INFO', 'Mail options:', {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          hasText: !!mailOptions.text,
          hasHtml: !!mailOptions.html
        });

        const result = await transporter.sendMail(mailOptions);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logEmailDebug('SUCCESS', 'Email sent successfully!', {
          messageId: result.messageId,
          response: result.response,
          envelope: result.envelope,
          duration: `${duration}ms`
        });
        
        return {
          success: true,
          messageId: result.messageId,
          response: result.response,
          duration: duration
        };
        
    } catch(err) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logEmailDebug('ERROR', 'Email sending failed:', {
          message: err.message,
          code: err.code,
          command: err.command,
          response: err.response,
          responseCode: err.responseCode,
          stack: process.env.NODE_ENV === 'development' ? err.stack : 'Stack trace hidden in production',
          duration: `${duration}ms`,
          to: to,
          subject: subject
        });
        
        // Enhanced error categorization
        let userFriendlyMessage = 'Email sending failed';
        let errorCategory = 'UNKNOWN';
        
        if (err.message.includes('OAuth2') || err.message.includes('authentication')) {
            errorCategory = 'AUTH_ERROR';
            userFriendlyMessage = 'Email authentication failed. OAuth2 configuration issue.';
        } else if (err.message.includes('timeout') || err.code === 'ETIMEDOUT') {
            errorCategory = 'TIMEOUT_ERROR';
            userFriendlyMessage = 'Email service timeout. Network or server issue.';
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
            errorCategory = 'CONNECTION_ERROR';
            userFriendlyMessage = 'Cannot connect to email service. Network issue.';
        } else if (err.message.includes('Invalid login') || err.responseCode === 535) {
            errorCategory = 'CREDENTIALS_ERROR';
            userFriendlyMessage = 'Email credentials are invalid or expired.';
        } else if (err.responseCode === 550) {
            errorCategory = 'RECIPIENT_ERROR';
            userFriendlyMessage = 'Recipient email address is invalid or blocked.';
        } else if (err.responseCode === 554) {
            errorCategory = 'SPAM_ERROR';
            userFriendlyMessage = 'Email rejected as spam or policy violation.';
        } else if (err.message.includes('quota') || err.responseCode === 552) {
            errorCategory = 'QUOTA_ERROR';
            userFriendlyMessage = 'Email quota exceeded. Try again later.';
        }
        
        logEmailDebug('ERROR', `Categorized as: ${errorCategory}`);
        
        const enhancedError = new Error(`${userFriendlyMessage} (${errorCategory})`);
        enhancedError.category = errorCategory;
        enhancedError.originalError = err.message;
        enhancedError.duration = duration;
        
        throw enhancedError;
    }
}