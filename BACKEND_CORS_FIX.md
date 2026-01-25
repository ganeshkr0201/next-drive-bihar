# Backend CORS Fix - Environment Variables Issue

## 🚨 **Issue Found**

The backend debug endpoint shows:
```json
{"CLIENT_URL":"https://next-drive-bihar.vercel.app"}
```

But your actual frontend URL is:
```
https://nextdrivebihar.vercel.app
```

This URL mismatch is causing CORS issues!

## ✅ **Solution: Update Render Environment Variables**

### Step 1: Go to Render Dashboard
1. Visit [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (`next-drive-bihar`)
3. Go to "Environment" tab

### Step 2: Update CLIENT_URL
Find the `CLIENT_URL` variable and change it from:
```
❌ https://next-drive-bihar.vercel.app
```
To:
```
✅ https://nextdrivebihar.vercel.app
```

### Step 3: Verify Other Environment Variables
Make sure these are set correctly in Render:

```
PORT=3000
CLIENT_URL=https://nextdrivebihar.vercel.app
MONGO_URI=your_mongodb_connection_string
PASSPORT_SECRET=your_passport_secret
EMAIL_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AUTH_CALLBACK=https://next-drive-bihar.onrender.com/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 4: Save and Redeploy
1. Click "Save Changes"
2. Wait for automatic redeploy
3. Check logs to ensure no errors

## 🔍 **Verification**

After updating, test these URLs:

1. **Backend Debug**: `https://next-drive-bihar.onrender.com/debug/env`
   - Should show: `"CLIENT_URL":"https://nextdrivebihar.vercel.app"`

2. **Frontend Connection**: Visit your frontend
   - Should connect successfully to backend
   - No more "Cannot connect to server" errors

## 🎯 **Expected Result**

- ✅ CORS will allow requests from correct frontend domain
- ✅ Frontend will connect to backend successfully
- ✅ All API calls will work properly
- ✅ Login, register, and other features will function

The issue is just a URL mismatch in the environment variables!