# 🚀 Upstash Redis Setup Guide - NextDrive Bihar

## ⚡ Quick Start

**For the fastest setup, run this command from the backend directory:**

```bash
cd backend
npm run setup-upstash
```

**Then test your connection:**

```bash
npm run test-upstash
```

**That's it! 🎉** Your application is now using serverless Redis.

---

## 📋 Overview

This guide will help you migrate from localhost Redis to **Upstash Redis** - a serverless, managed Redis service that's perfect for production deployments.

## 🎯 Benefits of Upstash Redis

- ✅ **Serverless**: No server management required
- ✅ **Auto-scaling**: Scales automatically with your traffic
- ✅ **Global**: Low-latency worldwide
- ✅ **Cost-effective**: Pay only for what you use
- ✅ **Production-ready**: Built for high availability
- ✅ **Easy deployment**: Works with Vercel, Netlify, etc.

---

## 🔧 Step 1: Create Upstash Account

1. **Visit [Upstash Console](https://console.upstash.com/)**
2. **Sign up** using:
   - GitHub account (recommended)
   - Google account
   - Email/password

---

## 🗄️ Step 2: Create Redis Database

1. **Click "Create Database"**
2. **Configure your database:**
   ```
   Name: nextdrive-bihar-redis
   Type: Regional (for better performance)
   Region: Choose closest to your users
   Plan: Free (30MB, 10K commands/day)
   ```
3. **Click "Create"**

---

## 🔑 Step 3: Get Connection Credentials

After creating the database, you'll see:

### **REST API Credentials:**
```
UPSTASH_REDIS_REST_URL: https://your-region-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

### **Copy these values** - you'll need them for your `.env` file.

---

## ⚙️ Step 4: Update Environment Variables

### **Option A: Automated Setup (Recommended)**
```bash
cd backend
npm run setup-upstash
```

This script will:
- ✅ Guide you through the Upstash setup process
- ✅ Automatically update your `.env` file
- ✅ Test your connection
- ✅ Provide troubleshooting if needed

### **Option B: Manual Setup**

### **Backend `.env` file:**
```env
# Redis Configuration - Upstash (Primary)
UPSTASH_REDIS_REST_URL="https://your-region-xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ"

# Legacy Redis (Fallback for local development)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
```

### **Production `.env` (Render/Railway/etc.):**
```env
UPSTASH_REDIS_REST_URL=https://your-region-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

---

## 🚀 Step 5: Test Your Connection

### **Before Starting Your Application:**
```bash
cd backend
# Test Upstash connection
npm run test-upstash
```

**Expected output:**
```
🧪 Testing Upstash Redis Connection...

1. Checking environment variables...
✅ Environment variables found
   URL: https://your-region-xxxxx...
   Token: AxxxxxxQ...

2. Initializing Upstash Redis client...

3. Testing connection...
✅ Connection successful! (45ms)

4. Testing basic operations...
✅ SET operation successful
✅ GET operation successful
✅ EXISTS operation successful
✅ TTL operation successful (59s remaining)
✅ DELETE operation successful

5. Testing OTP-like operations...
✅ OTP operations successful

6. Testing rate limiting operations...
✅ Rate limiting operations successful

🎉 All tests passed! Upstash Redis is working correctly.

📋 Summary:
   ✅ Connection established
   ✅ Basic operations (SET, GET, EXISTS, TTL, DEL)
   ✅ OTP storage and retrieval
   ✅ Rate limiting (INCR)
   ⚡ Average latency: ~45ms

🚀 Your application is ready to use Upstash Redis!
```

### **Start Your Application:**
```bash
cd backend
npm start
```

**Expected output:**
```
🔗 Connecting to Upstash Redis...
✅ Upstash Redis connected successfully
🌐 Using Upstash Redis (Serverless)
🎯 Redis initialized successfully
```

### **Health Check:**
```bash
curl http://localhost:4000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "redis": {
    "status": "connected",
    "latency": "45ms",
    "provider": "Upstash (Serverless)",
    "type": "upstash"
  }
}
```

---

## 🔄 Step 6: Verify Migration

### **Test OTP Functionality:**
1. **Register a new user** - OTP should be stored in Upstash
2. **Check Upstash Console** - You should see keys like `otp:user@example.com`
3. **Verify OTP** - Should work seamlessly

### **Test Caching:**
1. **Visit tour packages** - First request hits database
2. **Refresh page** - Second request hits Upstash cache
3. **Check response times** - Should be faster on cached requests

---

## 📊 Monitoring & Management

### **Upstash Console Features:**
- 📈 **Metrics**: Request count, latency, memory usage
- 🔍 **Data Browser**: View/edit keys and values
- 📋 **Logs**: Monitor Redis operations
- ⚙️ **Settings**: Configure TTL, memory limits

### **Key Patterns in Your Database:**
```
otp:user@example.com              # OTP storage
otp_last_sent:user@example.com    # Rate limiting
admin_stats                       # Dashboard cache
tour_packages:1:10               # Tour packages cache
public:/api/tour-categories      # Public API cache
```

---

## 🔧 Configuration Details

### **Connection Priority:**
1. **Upstash Redis** (if credentials provided)
2. **Localhost Redis** (fallback for development)
3. **No Redis** (graceful degradation)

### **Feature Compatibility:**

| Feature | Localhost Redis | Upstash Redis |
|---------|----------------|---------------|
| **OTP Management** | ✅ Full support | ✅ Full support |
| **Caching** | ✅ Full support | ✅ Full support |
| **Rate Limiting** | ✅ Full support | ✅ Full support |
| **Pattern Invalidation** | ✅ SCAN support | ⚠️ Limited (no SCAN) |
| **Key Statistics** | ✅ KEYS command | ⚠️ Limited (no KEYS) |

---

## 🚨 Important Notes

### **Upstash Limitations:**
- ❌ **No SCAN command**: Pattern invalidation is limited
- ❌ **No KEYS command**: Can't list all keys
- ✅ **REST API**: Uses HTTP instead of Redis protocol
- ✅ **Automatic TTL**: Handles expiration automatically

### **Workarounds Implemented:**
- **Cache invalidation**: Specific key deletion instead of patterns
- **Statistics**: Limited stats for Upstash
- **Graceful fallback**: Falls back to localhost if Upstash fails

---

## 💰 Pricing & Limits

### **Free Tier:**
- **Storage**: 30 MB
- **Commands**: 10,000 per day
- **Bandwidth**: 1 GB per month
- **Perfect for**: Development and small applications

### **Paid Plans:**
- **Pay-per-request**: $0.2 per 100K requests
- **Pro**: $10/month (1M requests included)
- **Enterprise**: Custom pricing

---

## 🛠️ Troubleshooting

### **Connection Issues:**
```bash
# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test connection manually
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
     "$UPSTASH_REDIS_REST_URL/ping"
```

### **Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Wrong token | Check `UPSTASH_REDIS_REST_TOKEN` |
| `404 Not Found` | Wrong URL | Check `UPSTASH_REDIS_REST_URL` |
| `Connection timeout` | Network issue | Check internet connection |
| `Rate limit exceeded` | Too many requests | Upgrade plan or optimize usage |

---

## 🎉 Success Indicators

### **✅ Upstash Working:**
- Server logs show "Using Upstash Redis (Serverless)"
- Health check shows `"provider": "Upstash (Serverless)"`
- OTP emails work correctly
- Cache responses are fast
- Upstash console shows activity

### **✅ Performance Benefits:**
- **Global CDN**: Low latency worldwide
- **Auto-scaling**: Handles traffic spikes
- **No maintenance**: Fully managed service
- **High availability**: 99.9% uptime SLA

---

## 🔄 Rollback Plan

If you need to rollback to localhost Redis:

1. **Remove Upstash credentials** from `.env`:
   ```env
   # UPSTASH_REDIS_REST_URL=""
   # UPSTASH_REDIS_REST_TOKEN=""
   ```

2. **Restart server** - it will automatically use localhost Redis

3. **Start local Redis**:
   ```bash
   redis-server
   ```

---

## 🎯 Next Steps

1. **✅ Set up Upstash Redis**
2. **✅ Update environment variables**
3. **✅ Test OTP functionality**
4. **✅ Verify caching works**
5. **🔄 Deploy to production**
6. **📊 Monitor performance**
7. **🚀 Scale as needed**

Your NextDrive Bihar application is now powered by **enterprise-grade, serverless Redis**! 🎉

---

## 📞 Support

- **Upstash Docs**: https://docs.upstash.com/
- **Upstash Discord**: https://discord.gg/w9SenAtbme
- **GitHub Issues**: For application-specific issues

**Happy scaling!** 🚀