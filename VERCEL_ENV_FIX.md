# Vercel Environment Variable Fix

## 🚨 Issue Identified
Frontend is trying to connect to `https://nextdrivebihar.vercel.app` (frontend URL) instead of `https://next-drive-bihar.onrender.com` (backend URL).

## ✅ Backend Status
✅ Backend is running correctly at: `https://next-drive-bihar.onrender.com`
✅ API responds with: `{"success":"true","msg":"api working"}`

## 🔧 Solution: Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `nextdrivebihar` project
3. Go to "Settings" tab
4. Click "Environment Variables" in the sidebar

### Step 2: Add/Update Environment Variable
Add or update this environment variable:

**Name:** `VITE_API_URL`
**Value:** `https://next-drive-bihar.onrender.com`
**Environment:** Production (and Preview if you want)

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Or push any small change to trigger automatic redeploy

## 🎯 Expected Result
After updating and redeploying:
- ✅ Frontend will connect to correct backend URL
- ✅ API calls will work properly
- ✅ Login, register, and other features will function
- ✅ No more "Cannot connect to server" errors

## 🔍 Verification
After deployment, check browser console:
- Should see successful API calls to `next-drive-bihar.onrender.com`
- No more connection errors
- Features like login should work

## 📝 Other Important Environment Variables for Vercel
While you're there, make sure these are also set:

```
VITE_API_URL=https://next-drive-bihar.onrender.com
VITE_APP_NAME=NextDrive Bihar
VITE_ENABLE_GOOGLE_AUTH=true
VITE_CLOUDINARY_CLOUD_NAME=dwty4vilo
VITE_CLOUDINARY_BASE_URL=https://res.cloudinary.com
```

The main fix is updating `VITE_API_URL` to point to your Render backend!