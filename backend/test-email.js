// Test email service
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

import { sendEmail } from './utils/sendEmail.js';

const testEmail = async () => {
  try {
    console.log('🧪 Testing email service...');
    console.log('📧 Email user:', process.env.EMAIL_USER);
    console.log('🔑 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    console.log('🔑 Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('🔑 Google Refresh Token:', process.env.GOOGLE_REFRESH_TOKEN ? 'Set' : 'Not set');
    
    if (!process.env.EMAIL_USER) {
      throw new Error('Environment variables not loaded properly');
    }
    
    await sendEmail(
      process.env.EMAIL_USER, // Send to self for testing
      'Test Email - NextDrive Bihar',
      'This is a test email to verify email service is working.',
      '<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Email Service Test</h2><p>This is a test email to verify that the email service is working correctly.</p><p>Timestamp: ' + new Date().toISOString() + '</p></div>'
    );
    
    console.log('✅ Email service test completed successfully!');
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.error('Full error:', error);
  }
  process.exit(0);
};

testEmail();