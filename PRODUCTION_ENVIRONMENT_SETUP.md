# 🚀 Production Environment Setup Guide - JWT Authentication

## 🔧 Render Backend Environment Variables

Set these environment variables in your Render dashboard:

### Required Variables:
```bash
NODE_ENV=production
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_for_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=https://next-drive-bihar.vercel.app
```

### Email Configuration:
```bash
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**Important**: You need to generate a Gmail App Password:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password as EMAIL_PASSWORD

### Google OAuth Configuration (Temporarily Disabled):
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AUTH_CALLBACK=https://next-drive-bihar.onrender.com/auth/google/callback
```

### Cloudinary Configuration:
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🌐 Vercel Frontend Environment Variables

Set these in your Vercel dashboard:

### Production Variables:
```bash
VITE_API_URL=https://next-drive-bihar.onrender.com
VITE_API_TIMEOUT=15000
VITE_ENABLE_DEBUG_LOGS=false
```

## 🔐 JWT Authentication Benefits

### Why JWT Instead of Sessions:
1. **Mobile Friendly**: No cookie issues on mobile browsers
2. **Stateless**: No server-side session storage required
3. **Cross-Origin**: Works perfectly with different domains
4. **Scalable**: No session synchronization between servers
5. **Secure**: Tokens are signed and can include expiration

### How JWT Works:
1. User logs in with credentials
2. Server generates access token (7 days) and refresh token (30 days)
3. Frontend stores tokens in localStorage
4. All API requests include `Authorization: Bearer <token>` header
5. Server validates token on each request
6. Automatic token refresh when access token expires

## 🔧 Authentication Flow Changes

### Backend Changes:
1. **Removed Express Sessions**: No more session cookies or MongoDB session store
2. **Added JWT Utilities**: Token generation, verification, and refresh
3. **JWT Middleware**: Replaces Passport session authentication
4. **Stateless Authentication**: No server-side session management
5. **Automatic Token Refresh**: Seamless token renewal

### Frontend Changes:
1. **Token Storage**: Access and refresh tokens stored in localStorage
2. **Authorization Headers**: All requests include Bearer token
3. **Automatic Refresh**: Interceptor handles token expiration
4. **No Cookies**: Eliminates all cookie-related issues
5. **Mobile Compatible**: Works on all devices and browsers

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: 
- Ensure JWT_SECRET is set in production
- Check if tokens are being sent in Authorization header
- Verify token hasn't expired

### Issue 2: Token Refresh Fails
**Cause**: Refresh token expired or invalid
**Solution**:
- User needs to login again
- Check JWT_REFRESH_EXPIRES_IN setting
- Ensure refresh token is stored correctly

### Issue 3: CORS Errors
**Cause**: Authorization header not allowed
**Solution**:
- Ensure 'Authorization' is in allowedHeaders
- credentials: false for JWT (no cookies needed)
- Check domain whitelist

### Issue 4: Mobile Authentication Issues
**Cause**: Cookie/session problems (now resolved with JWT)
**Solution**:
- JWT tokens work on all devices
- No cookie restrictions
- localStorage works universally

## 🔄 Migration from Sessions to JWT

### What Changed:
1. **Authentication Method**: Sessions → JWT tokens
2. **Storage**: Server sessions → Client localStorage
3. **Headers**: Cookies → Authorization Bearer
4. **Validation**: Session check → Token verification
5. **Expiration**: Session timeout → Token expiration

### What Stayed the Same:
1. **API Endpoints**: Same URLs and request/response formats
2. **User Data**: Same user information and permissions
3. **Security**: Still secure, actually more secure
4. **Functionality**: All features work the same

## 🧪 Testing Checklist

- [ ] Backend health check: `https://next-drive-bihar.onrender.com/`
- [ ] Frontend loads: `https://next-drive-bihar.vercel.app/`
- [ ] User registration works
- [ ] Email verification works
- [ ] User login works (returns JWT tokens)
- [ ] Token persists after page refresh
- [ ] API calls include Authorization header
- [ ] Token refresh works automatically
- [ ] Profile updates work
- [ ] Tour package browsing works
- [ ] Booking creation works
- [ ] Mobile authentication works

## 📱 Mobile Compatibility

### JWT Advantages for Mobile:
1. **No Cookie Issues**: Mobile browsers often block third-party cookies
2. **Universal Support**: localStorage works on all mobile browsers
3. **App Integration**: Easy to integrate with mobile apps later
4. **Offline Capability**: Tokens work offline until expiration
5. **Cross-Platform**: Same authentication for web and mobile

## 🔐 Security Considerations

### JWT Security Features:
1. **Signed Tokens**: Prevents tampering
2. **Expiration**: Automatic token expiry
3. **Refresh Mechanism**: Secure token renewal
4. **Stateless**: No server-side session hijacking
5. **HTTPS Only**: Secure transmission in production

### Best Practices:
1. Use strong JWT_SECRET (minimum 32 characters)
2. Set appropriate expiration times
3. Implement token refresh mechanism
4. Use HTTPS in production
5. Clear tokens on logout

## 📞 Support

If issues persist:
1. Check Render logs for JWT-related errors
2. Verify JWT_SECRET is set correctly
3. Test API endpoints with Postman/curl using Bearer tokens
4. Check browser localStorage for tokens
5. Monitor network tab for Authorization headers

## 🔐 Security Note

**Important**: 
- Never commit JWT_SECRET to your repository
- Use a strong, unique JWT_SECRET in production
- Rotate JWT_SECRET periodically for enhanced security
- Always use HTTPS in production to protect tokens in transit