# Authentication Debug Guide

## 🔍 **Step-by-Step Debugging Process**

### **Step 1: Test Google OAuth Configuration**

#### **Check Current OAuth URLs:**
1. **Go to**: https://next-drive-bihar.vercel.app/login
2. **Click "Sign in with Google"**
3. **Check the URL you're redirected to**

**Expected URL pattern:**
```
https://accounts.google.com/oauth/authorize?
  client_id=249392961659-k4etgcfbomt5410nhmt9fun9n533bfhe.apps.googleusercontent.com
  &redirect_uri=https://next-drive-bihar.onrender.com/auth/google/callback
  &scope=profile%20email
  &response_type=code
```

**❌ If you see localhost in redirect_uri, the Google Console needs to be updated**

### **Step 2: Test Backend Session Debug**

#### **Before Login:**
Visit: `https://next-drive-bihar.onrender.com/debug/session`

**Expected Response:**
```json
{
  "authenticated": false,
  "sessionID": "some_session_id",
  "user": null,
  "cookies": "missing"
}
```

#### **After Login:**
Visit: `https://next-drive-bihar.onrender.com/debug/session`

**Expected Response:**
```json
{
  "authenticated": true,
  "sessionID": "some_session_id",
  "user": {
    "id": "user_id",
    "name": "Your Name",
    "email": "your@email.com",
    "role": "admin"
  },
  "cookies": "present"
}
```

### **Step 3: Test Admin API Endpoints**

#### **Test Admin Stats:**
Visit: `https://next-drive-bihar.onrender.com/admin/stats`

**✅ Expected Response (when authenticated as admin):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 5,
    "totalQueries": 10,
    "totalTourBookings": 3,
    "totalCarBookings": 2,
    "totalTourPackages": 4
  }
}
```

**❌ Error Response (when not authenticated):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**❌ Error Response (when not admin):**
```json
{
  "success": false,
  "message": "Admin privileges required"
}
```

### **Step 4: Check Backend Logs**

#### **Look for these log messages in Render:**

**✅ Successful OAuth:**
```
🔍 Google OAuth Success Handler:
- User authenticated: true
- User object: { id: ObjectId('...'), name: 'User Name', email: 'user@email.com' }
- Session ID: session_id_here
- Generated temp token for frontend
- Redirecting to: https://next-drive-bihar.vercel.app/auth/google/success?token=...
```

**✅ Successful Token Verification:**
```
✅ User logged in via OAuth token: user@email.com
```

**✅ Successful Admin Access:**
```
🔐 Admin middleware check - Authenticated: true
👤 User: User Name (user@email.com) - Role: admin
✅ Admin access granted
```

**❌ Failed Authentication:**
```
🔐 Admin middleware check - Authenticated: false
❌ User not authenticated
```

### **Step 5: Frontend Console Debugging**

#### **Open Browser Console and look for:**

**✅ Successful OAuth Flow:**
```
🔍 Found OAuth token, verifying...
✅ OAuth token verified, user logged in
✅ Session validated, user authenticated
```

**✅ Successful API Calls:**
```
Network tab should show:
- GET /admin/stats → 200 OK
- GET /admin/users → 200 OK  
- GET /admin/queries → 200 OK
- GET /admin/tour-bookings → 200 OK
```

**❌ Failed API Calls:**
```
Network tab will show:
- GET /admin/stats → 401 Unauthorized
- GET /admin/users → 401 Unauthorized
```

### **Step 6: Common Issues & Solutions**

#### **Issue 1: OAuth redirects to localhost**
**Cause:** Google Console still has localhost URLs
**Solution:** Update Google Cloud Console OAuth configuration

#### **Issue 2: "Authentication failed" message**
**Cause:** Token verification failing
**Solution:** Check backend logs for token verification errors

#### **Issue 3: "Admin privileges required"**
**Cause:** User doesn't have admin role
**Solution:** Check user role in database

#### **Issue 4: Session not persisting**
**Cause:** Cookie settings or CORS issues
**Solution:** Check cookie settings and CORS configuration

#### **Issue 5: API calls return 401**
**Cause:** Session not established or expired
**Solution:** Re-authenticate and check session persistence

### **Step 7: Manual Testing Commands**

#### **Test OAuth Callback (after getting code from Google):**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/auth/google/callback?code=YOUR_CODE_HERE" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Admin Stats:**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/stats" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Session Status:**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/debug/session" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

### **Step 8: Quick Fix Verification**

#### **After updating Google Console:**
1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache** completely
3. **Try incognito mode**
4. **Test OAuth flow** from scratch
5. **Check backend logs** for successful authentication
6. **Verify admin dashboard** loads data

## 🎯 **Success Indicators**

### **✅ Everything Working:**
- OAuth redirects to production backend URL
- Backend logs show successful authentication
- Session debug endpoint shows authenticated user
- Admin API endpoints return data
- Frontend console shows successful API calls
- Admin dashboard displays all data

### **❌ Still Broken:**
- OAuth redirects to localhost
- Backend logs show authentication failures
- Session debug shows unauthenticated
- Admin API endpoints return 401
- Frontend console shows API errors
- Admin dashboard is empty

The key is to follow this debugging process step by step to identify exactly where the authentication flow is breaking!