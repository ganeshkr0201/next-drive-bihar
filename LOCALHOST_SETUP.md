# NextDrive Bihar - Localhost Development Setup

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

**Expected output:**
```
🚀 NextDrive Bihar Backend Server running on port: 3000
📍 Server URL: http://localhost:3000
🌐 Client URL: http://localhost:5173
📊 Environment: development
🔗 Database: Connected
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Test Connection
```bash
node test-connection.js
```

## 🔧 Configuration Files

### Backend (.env)
```env
PORT="3000"
CLIENT_URL="http://localhost:5173"
MONGO_URI="mongodb+srv://..."
JWT_SECRET="nextDriveBihar@ganesh+avinash"
# ... other configs
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_DEBUG_LOGS=true
# ... other configs
```

## 🐛 Troubleshooting

### Issue: "Network Error" or "Connection Refused"

**Solution 1: Check Backend is Running**
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"healthy",...}`

**Solution 2: Check CORS Configuration**
- Backend allows `http://localhost:5173`
- Frontend points to `http://localhost:3000`

**Solution 3: Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: F12 → Application → Local Storage → Clear

**Solution 4: Check Firewall/Antivirus**
- Temporarily disable firewall
- Add exceptions for ports 3000 and 5173

### Issue: "401 Unauthorized" on /auth/me

This is **normal behavior** when:
- No JWT token in localStorage
- Token has expired
- User is not logged in

### Issue: Email Verification Not Working

**Check Environment Variables:**
```bash
# In backend/.env
EMAIL_USER="nextdrivebihar.info@gmail.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."
GOOGLE_REDIRECT_URI="https://developers.google.com/oauthplayground"
```

## 📱 Development Workflow

1. **Start Backend First**
   ```bash
   cd backend && npm start
   ```

2. **Start Frontend Second**
   ```bash
   cd frontend && npm run dev
   ```

3. **Open Browser**
   - Navigate to: http://localhost:5173
   - Backend API: http://localhost:3000

4. **Debug Mode**
   - Frontend logs: Browser Console (F12)
   - Backend logs: Terminal where backend is running
   - API requests: Network tab in browser

## 🔍 Debug Information

### Frontend Debug Logs
With `VITE_ENABLE_DEBUG_LOGS=true`, you'll see:
```
📤 POST /auth/login
📥 200 POST /auth/login
```

### Backend Request Logs
Every request shows:
```
2024-01-20T10:30:00.000Z - POST /auth/login - Origin: http://localhost:5173 - Auth: None
```

## ✅ Success Indicators

### Backend Started Successfully:
- ✅ Server running message appears
- ✅ Database connection established
- ✅ No error messages in terminal

### Frontend Started Successfully:
- ✅ Vite dev server starts
- ✅ Browser opens automatically
- ✅ No compilation errors

### Connection Working:
- ✅ API calls appear in browser Network tab
- ✅ Backend logs show incoming requests
- ✅ No CORS errors in browser console

## 🆘 Still Having Issues?

1. **Check Node.js Version**: Ensure Node.js 16+ is installed
2. **Check npm Version**: Ensure npm 8+ is installed
3. **Clear node_modules**: Delete and reinstall dependencies
4. **Check Port Conflicts**: Ensure ports 3000 and 5173 are free
5. **Restart Everything**: Close all terminals and start fresh

## 📞 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Backend not running | Start backend first |
| `CORS error` | Wrong origin | Check CORS config |
| `404 Not Found` | Wrong API URL | Check VITE_API_URL |
| `401 Unauthorized` | No/invalid token | Login first |
| `Network Error` | Connection blocked | Check firewall |