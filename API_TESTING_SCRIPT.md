# API Testing Script

## 🧪 **Complete API Testing Guide**

### **Prerequisites**
1. Backend deployed at: `https://next-drive-bihar.onrender.com`
2. Frontend deployed at: `https://next-drive-bihar.vercel.app`
3. User logged in with valid session

## 📋 **Testing Checklist**

### **1. Authentication APIs**

#### **Test Session Status**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/debug/session" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

**Expected Response:**
```json
{
  "authenticated": true,
  "sessionID": "session_id_here",
  "user": {
    "id": "user_id",
    "name": "User Name", 
    "email": "user@email.com",
    "role": "admin"
  },
  "cookies": "present"
}
```

#### **Test Current User Endpoint**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/auth/me" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@email.com",
    "role": "admin"
  }
}
```

### **2. Admin APIs**

#### **Test Admin Stats**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/stats" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

**Expected Response:**
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

#### **Test Admin Users**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/users" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Admin Queries**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/queries" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Admin Tour Bookings**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/tour-bookings" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Admin Tour Packages**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/admin/tour-packages" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

### **3. Public APIs**

#### **Test Tour Packages (No Auth Required)**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/api/tour-packages" \
  -v
```

#### **Test User Bookings (Auth Required)**
```bash
curl -X GET "https://next-drive-bihar.onrender.com/api/bookings/my-bookings" \
  -H "Cookie: sessionId=your_session_id" \
  -v
```

#### **Test Create Booking (Auth Required)**
```bash
curl -X POST "https://next-drive-bihar.onrender.com/api/bookings/tour" \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=your_session_id" \
  -d '{
    "tourPackage": "REPLACE_WITH_ACTUAL_TOUR_ID",
    "numberOfTravelers": 2,
    "travelDate": "2024-03-15T00:00:00.000Z",
    "totalAmount": 15000,
    "contactNumber": "9876543210",
    "pickupLocation": "Patna Railway Station"
  }' \
  -v
```

#### **Test Submit Query (Auth Required)**
```bash
curl -X POST "https://next-drive-bihar.onrender.com/api/queries" \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=your_session_id" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "subject": "Test Query",
    "message": "This is a test query",
    "category": "tour-package"
  }' \
  -v
```

## 🌐 **Frontend Testing**

### **1. Admin Dashboard Test**
1. **Login as admin**: Go to `https://next-drive-bihar.vercel.app/login`
2. **Access dashboard**: Go to `https://next-drive-bihar.vercel.app/admin/dashboard`
3. **Check data loading**:
   - Overview tab should show statistics
   - Users tab should show user list
   - Queries tab should show queries
   - Bookings tabs should show bookings
   - Tour packages tab should show packages

### **2. User Booking Test**
1. **Login as user**: Go to `https://next-drive-bihar.vercel.app/login`
2. **Browse packages**: Go to `https://next-drive-bihar.vercel.app/tour-packages`
3. **Book a tour**: Click on a package and try to book
4. **Check booking**: Go to `https://next-drive-bihar.vercel.app/user-dashboard`

### **3. Query Submission Test**
1. **Login as user**: Go to `https://next-drive-bihar.vercel.app/login`
2. **Submit query**: Go to `https://next-drive-bihar.vercel.app/contact`
3. **Check query**: Go to user dashboard to see submitted queries

## 🔍 **Browser DevTools Testing**

### **1. Network Tab Inspection**
1. **Open DevTools** → Network tab
2. **Clear network log**
3. **Perform actions** (login, book tour, etc.)
4. **Check API calls**:
   - Status codes should be 200/201 for success
   - No 401/403 authentication errors
   - Response data should be present

### **2. Console Log Inspection**
Look for these success messages:
```
✅ OAuth token verified, user logged in
✅ Session validated, user authenticated
✅ Admin access granted
```

Avoid these error messages:
```
❌ User not authenticated
❌ Session expired
❌ Authentication failed
```

### **3. Application Tab Inspection**
1. **Go to Application** → Cookies
2. **Check for sessionId cookie**:
   - Domain: `.onrender.com` or your backend domain
   - HttpOnly: true
   - Secure: true (in production)
   - SameSite: None (for cross-site)

## 📊 **Expected Test Results**

### **✅ All Tests Passing:**
- Authentication APIs return user data
- Admin APIs return dashboard data
- Public APIs work without authentication
- Booking creation succeeds
- Query submission succeeds
- Frontend loads data properly
- No 401/403 errors in network tab

### **❌ Tests Failing:**
- 401 Unauthorized errors → Authentication issue
- 403 Forbidden errors → Permission issue
- 500 Server errors → Backend issue
- Network errors → CORS or connectivity issue
- Empty responses → Database or logic issue

## 🚨 **Troubleshooting**

### **If Admin Dashboard is Empty:**
1. Check `/debug/session` endpoint
2. Verify user has admin role
3. Check network tab for API errors
4. Verify session cookies are present

### **If Booking Fails:**
1. Check user authentication status
2. Verify tour package ID exists
3. Check request payload format
4. Verify session cookies are sent

### **If APIs Return 401:**
1. Re-authenticate user
2. Check session cookie expiration
3. Verify CORS configuration
4. Check Google OAuth setup

## 🎯 **Success Criteria**

All APIs should work correctly when:
1. **Google OAuth is properly configured** in Google Cloud Console
2. **Session cookies are properly set** and sent with requests
3. **CORS is correctly configured** to allow credentials
4. **User has appropriate permissions** (admin for admin APIs)

The backend APIs are correctly implemented. The main issue is the Google OAuth configuration that needs to be updated in Google Cloud Console to use production URLs instead of localhost URLs.