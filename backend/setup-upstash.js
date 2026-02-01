#!/usr/bin/env node

/**
 * 🔧 Upstash Setup Helper
 * 
 * This script helps you set up Upstash Redis credentials in your .env file.
 * It will guide you through the process step by step.
 */

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupUpstash() {
  log(colors.blue + colors.bold, '\n🔧 Upstash Redis Setup Helper\n');
  
  log(colors.yellow, '📋 This script will help you configure Upstash Redis for NextDrive Bihar.');
  log(colors.yellow, '   We\'ll update your .env file with the correct credentials.\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log(colors.red, '❌ .env file not found!');
    log(colors.yellow, '💡 Please make sure you\'re running this from the backend directory.');
    process.exit(1);
  }

  log(colors.green, '✅ Found .env file');

  // Read current .env content
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check current Upstash configuration
  const hasUpstashUrl = envContent.includes('UPSTASH_REDIS_REST_URL=');
  const hasUpstashToken = envContent.includes('UPSTASH_REDIS_REST_TOKEN=');
  
  if (hasUpstashUrl && hasUpstashToken) {
    const urlMatch = envContent.match(/UPSTASH_REDIS_REST_URL="?([^"\n]+)"?/);
    const tokenMatch = envContent.match(/UPSTASH_REDIS_REST_TOKEN="?([^"\n]+)"?/);
    
    const currentUrl = urlMatch ? urlMatch[1] : '';
    const currentToken = tokenMatch ? tokenMatch[1] : '';
    
    if (currentUrl !== 'YOUR_UPSTASH_REDIS_REST_URL' && 
        currentToken !== 'YOUR_UPSTASH_REDIS_REST_TOKEN' &&
        currentUrl.startsWith('https://') &&
        currentToken.length > 20) {
      
      log(colors.green, '\n✅ Upstash credentials already configured!');
      log(colors.blue, `   URL: ${currentUrl.substring(0, 30)}...`);
      log(colors.blue, `   Token: ${currentToken.substring(0, 10)}...`);
      
      const shouldUpdate = await question(colors.yellow + '\n🔄 Do you want to update these credentials? (y/N): ' + colors.reset);
      
      if (shouldUpdate.toLowerCase() !== 'y' && shouldUpdate.toLowerCase() !== 'yes') {
        log(colors.green, '\n👍 Keeping existing credentials. You can test them with: npm run test-upstash');
        rl.close();
        return;
      }
    }
  }

  // Guide user through Upstash setup
  log(colors.cyan + colors.bold, '\n📚 Step-by-Step Guide:\n');
  
  log(colors.yellow, '1. 🌐 Visit Upstash Console:');
  log(colors.blue, '   https://console.upstash.com/\n');
  
  log(colors.yellow, '2. 🔐 Sign up or log in using:');
  log(colors.blue, '   • GitHub account (recommended)');
  log(colors.blue, '   • Google account');
  log(colors.blue, '   • Email/password\n');
  
  log(colors.yellow, '3. 🗄️ Create a new Redis database:');
  log(colors.blue, '   • Click "Create Database"');
  log(colors.blue, '   • Name: nextdrive-bihar-redis');
  log(colors.blue, '   • Type: Regional');
  log(colors.blue, '   • Region: Choose closest to your users');
  log(colors.blue, '   • Plan: Free (30MB, 10K commands/day)');
  log(colors.blue, '   • Click "Create"\n');
  
  log(colors.yellow, '4. 📋 Copy your credentials:');
  log(colors.blue, '   After creating the database, you\'ll see:');
  log(colors.blue, '   • UPSTASH_REDIS_REST_URL');
  log(colors.blue, '   • UPSTASH_REDIS_REST_TOKEN\n');

  await question(colors.green + '✅ Press Enter when you have your Upstash credentials ready...' + colors.reset);

  // Get credentials from user
  log(colors.cyan + colors.bold, '\n🔑 Enter Your Upstash Credentials:\n');
  
  const url = await question(colors.yellow + 'UPSTASH_REDIS_REST_URL (starts with https://): ' + colors.reset);
  
  if (!url || !url.startsWith('https://')) {
    log(colors.red, '❌ Invalid URL! It should start with https://');
    rl.close();
    process.exit(1);
  }
  
  const token = await question(colors.yellow + 'UPSTASH_REDIS_REST_TOKEN (long string): ' + colors.reset);
  
  if (!token || token.length < 20) {
    log(colors.red, '❌ Invalid token! It should be a long string (50+ characters)');
    rl.close();
    process.exit(1);
  }

  // Update .env file
  log(colors.yellow, '\n📝 Updating .env file...');
  
  let updatedContent = envContent;
  
  // Update or add UPSTASH_REDIS_REST_URL
  if (hasUpstashUrl) {
    updatedContent = updatedContent.replace(
      /UPSTASH_REDIS_REST_URL="?[^"\n]*"?/,
      `UPSTASH_REDIS_REST_URL="${url}"`
    );
  } else {
    updatedContent += `\n# Upstash Redis Configuration\nUPSTASH_REDIS_REST_URL="${url}"\n`;
  }
  
  // Update or add UPSTASH_REDIS_REST_TOKEN
  if (hasUpstashToken) {
    updatedContent = updatedContent.replace(
      /UPSTASH_REDIS_REST_TOKEN="?[^"\n]*"?/,
      `UPSTASH_REDIS_REST_TOKEN="${token}"`
    );
  } else {
    updatedContent += `UPSTASH_REDIS_REST_TOKEN="${token}"\n`;
  }
  
  // Write updated content
  fs.writeFileSync(envPath, updatedContent);
  
  log(colors.green, '✅ .env file updated successfully!');
  
  // Test the connection
  log(colors.yellow, '\n🧪 Testing your Upstash connection...');
  
  const shouldTest = await question(colors.cyan + 'Would you like to test the connection now? (Y/n): ' + colors.reset);
  
  if (shouldTest.toLowerCase() !== 'n' && shouldTest.toLowerCase() !== 'no') {
    log(colors.blue, '\n🔄 Running connection test...\n');
    
    rl.close();
    
    // Import and run the test
    try {
      const { spawn } = await import('child_process');
      const testProcess = spawn('node', ['test-upstash.js'], { stdio: 'inherit' });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          log(colors.green + colors.bold, '\n🎉 Setup completed successfully!');
          log(colors.blue, '\n📋 Next steps:');
          log(colors.blue, '   1. Start your backend: npm start');
          log(colors.blue, '   2. Test OTP functionality by registering a user');
          log(colors.blue, '   3. Check caching by visiting tour packages');
          log(colors.blue, '\n🚀 Your application is now using Upstash Redis!');
        } else {
          log(colors.red, '\n❌ Connection test failed. Please check your credentials.');
          log(colors.yellow, '💡 You can run the test again with: npm run test-upstash');
        }
      });
    } catch (error) {
      log(colors.red, '❌ Could not run connection test:', error.message);
      log(colors.yellow, '💡 You can run it manually with: npm run test-upstash');
    }
  } else {
    log(colors.green, '\n✅ Setup completed!');
    log(colors.yellow, '💡 You can test your connection anytime with: npm run test-upstash');
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log(colors.yellow, '\n\n👋 Setup cancelled by user.');
  rl.close();
  process.exit(0);
});

// Run the setup
setupUpstash().catch((error) => {
  log(colors.red, '\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});