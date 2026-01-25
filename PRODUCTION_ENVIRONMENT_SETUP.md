# 🚀 Production Environment Setup Guide

## 🔧 Render Backend Environment Variables

Set these environment variables in your Render dashboard:

### Required Variables:
```bash
NODE_ENV=production
PORT=3000
MONGO_URI=your_mongodb_connection_string
PASSPORT_SECRET=your_passport_secret_key
CLIENT_URL=https://next-drive-bihar.vercel.app
```

### Email Configuration:
```bash
EMAIL_USER=your_email@gmail.com
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

### Google OAuth Configuration:
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

## 🔍 Google Cloud Console OAuth Setup

**CRITICAL**: Update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Find your OAuth Client ID
4. Update **Authorized JavaScript Origins**:
   - `https://next-drive-bihar.vercel.app`
   - `https://next-drive-bihar.onrender.com`
5. Update **Authorized Redirect URIs**:
   - `https://next-drive-bihar.onrender.com/auth/google/callback`
6. **Remove all localhost URLs** from production OAuth client

## 🔧 Session Configuration Issues Fixed

### Backend Changes:
1. **Added MongoDB Session Store**: Sessions now persist in database instead of memory
2. **Trust Proxy**: Enabled for secure cookies behind reverse proxy
3. **Enhanced CORS**: Better cross-origin support for production
4. **Request Logging**: Added for debugging production issues
5. **Environment Detection**: Automatic NODE_ENV setting

### Frontend Changes:
1. **Production Environment**: Added `.env.production` with correct API URL
2. **Enhanced Debugging**: Better error logging in AuthContext
3. **Network Error Handling**: Improved handling of connection issues

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized on /auth/me
**Cause**: Session cookies not working across domains
**Solution**: 
- Ensure `NODE_ENV=production` is set in Render
- Verify `CLIENT_URL` matches your Vercel domain exactly
- Check that `trust proxy` is enabled

### Issue 2: CORS Errors
**Cause**: Frontend domain not in CORS whitelist
**Solution**:
- Add your exact Vercel URL to CORS origins
- Ensure `credentials: true` is set
- Check for typos in domain names

### Issue 3: Google OAuth Fails
**Cause**: OAuth URLs not updated for production
**Solution**:
- Update Google Cloud Console with production URLs
- Remove all localhost URLs
- Verify callback URL matches exactly

### Issue 4: Session Not Persisting
**Cause**: Using memory store in production
**Solution**:
- MongoDB session store now implemented
- Sessions persist across server restarts
- 7-day session expiry configured

## 🔄 Deployment Steps

1. **Push Code**: All changes are committed and pushed
2. **Set Environment Variables**: Use the variables listed above with your actual values
3. **Update Google OAuth**: Follow the Google Cloud Console steps
4. **Test Authentication**: Try login/logout flow
5. **Monitor Logs**: Check Render logs for any errors

## 🧪 Testing Checklist

- [ ] Backend health check: `https://next-drive-bihar.onrender.com/`
- [ ] Frontend loads: `https://next-drive-bihar.vercel.app/`
- [ ] User registration works
- [ ] Email verification works
- [ ] User login works
- [ ] Session persists after page refresh
- [ ] Google OAuth works
- [ ] Profile updates work
- [ ] Tour package browsing works
- [ ] Booking creation works

## 📞 Support

If issues persist:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly using the API documentation

## 🔐 Security Note

**Important**: Never commit actual API keys, secrets, or tokens to your repository. Always use environment variables and keep sensitive information in your deployment platform's environment variable settings.