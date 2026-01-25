# Backend CORS Fix - Correct Frontend URL

## ✅ **Issue Fixed in Code**

Updated the CORS configuration to use the correct frontend URL:
- ✅ `https://next-drive-bihar.vercel.app` (with hyphens)

## 🔧 **Render Environment Variables to Update**

### Step 1: Go to Render Dashboard
1. Visit [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (`next-drive-bihar`)
3. Go to "Environment" tab

### Step 2: Verify CLIENT_URL
Make sure `CLIENT_URL` is set to:
```
✅ https://next-drive-bihar.vercel.app
```

### Step 3: Complete Environment Variables List
Ensure all these are set correctly in Render:

```
PORT=3000
CLIENT_URL=https://next-drive-bihar.vercel.app
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

## 🎯 **Expected Result**

After the backend redeploys with the updated CORS configuration:
- ✅ Frontend at `https://next-drive-bihar.vercel.app` will connect successfully
- ✅ No more "Cannot connect to server" errors
- ✅ All API calls will work properly
- ✅ Login, register, and other features will function

The CORS configuration now matches your actual frontend URL!