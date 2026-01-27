# 🚀 NextDrive Bihar - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Authentication System](#authentication-system)
5. [Database Schema](#database-schema)
6. [API Workflows](#api-workflows)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Features](#security-features)
9. [Deployment Guide](#deployment-guide)
10. [Development Setup](#development-setup)
11. [Feature Implementation](#feature-implementation)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**NextDrive Bihar** is a comprehensive travel booking platform designed specifically for Bihar tourism. The platform offers tour packages and car rental services with a focus on showcasing Bihar's rich cultural heritage and natural beauty.

### Key Features
- **Tour Package Booking**: Curated tour packages with detailed itineraries
- **Car Rental Services**: Premium vehicle rentals with professional drivers
- **User Management**: Complete user registration, authentication, and profile management
- **Admin Dashboard**: Comprehensive management interface for administrators
- **Query Management**: Customer support system with response tracking
- **Notification System**: Real-time notifications for users and admins
- **Image Management**: Cloudinary integration for optimized image storage
- **Mobile Responsive**: Fully responsive design for all devices

### Live URLs
- **Frontend**: https://next-drive-bihar.vercel.app
- **Backend API**: https://next-drive-bihar.onrender.com
- **GitHub Repository**: https://github.com/ganeshkr0201/next-drive-bihar.git

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
│   Vercel        │    │   Render        │    │   Atlas         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   File Storage  │    │   Email Service │
│   (Vercel)      │    │   (Cloudinary)  │    │   (Nodemailer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Request Flow

```
User Request → Frontend (React) → API Call (Axios) → Backend (Express) → Database (MongoDB) → Response
     ↓                                                        ↓
File Upload → Cloudinary → URL Storage                Email Service → User Notification
```

---

## 💻 Technology Stack

### Frontend Technologies
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS 3.4.0
- **Routing**: React Router DOM 6.20.0
- **HTTP Client**: Axios 1.6.0
- **State Management**: React Context API
- **Deployment**: Vercel

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.0
- **Database**: MongoDB with Mongoose 8.0.0
- **Authentication**: JSON Web Tokens (JWT)
- **File Upload**: Multer + Cloudinary
- **Email Service**: Nodemailer
- **Password Hashing**: bcryptjs
- **Deployment**: Render

### Third-Party Services
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Email Service**: Gmail SMTP
- **Authentication**: Google OAuth 2.0
- **Hosting**: Vercel (Frontend), Render (Backend)

---

## 🔐 Authentication System

### JWT-Based Authentication Flow

#### 1. User Registration Process

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant E as Email Service

    U->>F: Fill registration form
    F->>B: POST /auth/register
    B->>DB: Create user (unverified)
    B->>E: Send OTP email
    B->>F: Return user + verification required
    F->>U: Show verification screen
    
    U->>F: Enter OTP
    F->>B: POST /auth/verify-otp
    B->>DB: Verify OTP & activate user
    B->>F: Return JWT tokens (if autoLogin)
    F->>U: Redirect to dashboard
```

#### 2. Login Process

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter credentials
    F->>B: POST /auth/login
    B->>DB: Validate user
    B->>B: Generate JWT tokens
    B->>F: Return tokens + user data
    F->>F: Store tokens in localStorage
    F->>U: Redirect to dashboard
```

#### 3. Token Management

```javascript
// Token Structure
{
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 1 hour expiry
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 7 days expiry
}

// Automatic Token Refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const newTokens = await authService.refreshToken();
      // Retry original request with new token
    }
    return Promise.reject(error);
  }
);
```

### Authentication APIs

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/auth/register` | POST | User registration | None |
| `/auth/login` | POST | User login | None |
| `/auth/verify-otp` | POST | Email verification | None |
| `/auth/resend-otp` | POST | Resend OTP | None |
| `/auth/me` | GET | Get current user | JWT Required |
| `/auth/profile` | PUT | Update profile | JWT Required |
| `/auth/logout` | POST | User logout | JWT Required |
| `/auth/delete-account` | DELETE | Delete account | JWT Required |
| `/auth/refresh-token` | POST | Refresh tokens | Refresh Token |

---

## 🗄️ Database Schema

### User Model
```javascript
const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed with bcrypt
  role: { type: String, enum: ["user", "admin"], default: "user" },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  
  // Profile Information
  avatar: String, // Cloudinary URL
  avatarPublicId: String, // For Cloudinary deletion
  phone: String,
  address: String,
  dateOfBirth: Date,
  bio: String,
  
  // Verification
  isVerified: { type: Boolean, default: false },
  otpHash: String,
  otpExpireAt: Date,
  otpResendCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### TourPackage Model
```javascript
const tourPackageSchema = {
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  
  // Duration & Pricing
  duration: {
    days: { type: Number, required: true },
    nights: { type: Number, required: true }
  },
  pricing: {
    basePrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    currency: { type: String, default: "INR" }
  },
  
  // Images (Cloudinary Integration)
  images: {
    featured: String, // Cloudinary URL
    featuredPublicId: String, // For deletion
    gallery: [{
      url: String,
      publicId: String,
      caption: String,
      alt: String
    }]
  },
  
  // Package Details
  highlights: [String],
  category: String,
  status: { type: String, enum: ["Draft", "Published", "Archived"], default: "Draft" },
  featured: { type: Boolean, default: false },
  inclusions: [String],
  exclusions: [String],
  pickupLocations: [String],
  dropLocations: [String],
  
  // Management
  createdBy: { type: ObjectId, ref: "User" },
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
const bookingSchema = {
  user: { type: ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["tour", "car"], required: true },
  
  // Tour Booking Fields
  tourPackage: { type: ObjectId, ref: "TourPackage" },
  numberOfTravelers: Number,
  travelDate: Date,
  
  // Booking Details
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
  bookingReference: { type: String, unique: true },
  
  // Contact Information
  contactNumber: String,
  emergencyContact: String,
  specialRequests: String,
  pickupLocation: String,
  dropLocation: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: { type: ObjectId, ref: "User" },
  cancelledByType: { type: String, enum: ["user", "admin"] },
  cancelledAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Query Model
```javascript
const querySchema = {
  // User Information
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: String,
  
  // Query Details
  subject: { type: String, required: true },
  category: { type: String, enum: ["car-booking", "tour-package", "others"], required: true },
  message: { type: String, required: true },
  
  // Status Management
  status: { type: String, enum: ["pending", "resolved", "closed"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  
  // Response
  response: String,
  respondedAt: Date,
  respondedBy: { type: ObjectId, ref: "User" },
  
  // Feedback
  rating: { type: String, enum: ["satisfied", "unsatisfied"] },
  ratedAt: Date,
  feedback: String,
  
  // Relations
  user: { type: ObjectId, ref: "User" }, // Optional for non-registered users
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
const notificationSchema = {
  recipient: { type: ObjectId, ref: "User", required: true },
  sender: { type: ObjectId, ref: "User", required: true },
  
  type: { 
    type: String, 
    enum: ["query_response", "booking_update", "system", "general", "new_booking"], 
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Relations
  relatedQuery: { type: ObjectId, ref: "Query" },
  relatedBooking: { type: ObjectId, ref: "Booking" },
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: Date,
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  
  // Additional
  actionUrl: String,
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 API Workflows

### Tour Package Management Workflow

#### 1. Create Tour Package (Admin)
```javascript
// Request Flow
POST /admin/tour-packages
Content-Type: multipart/form-data

// Process:
1. Validate admin authentication
2. Process uploaded images
3. Upload images to Cloudinary
4. Generate unique slug from title
5. Create TourPackage document
6. Store Cloudinary public_ids for cleanup
7. Return complete package object

// Response:
{
  success: true,
  message: "Tour package created successfully",
  package: {
    _id: "package_id",
    title: "Bihar Heritage Tour",
    slug: "bihar-heritage-tour",
    images: {
      featured: "https://res.cloudinary.com/...",
      gallery: [...]
    },
    // ... other fields
  }
}
```

#### 2. Get Tour Packages (Public)
```javascript
// Request Flow
GET /api/tour-packages?featured=true&limit=10

// Process:
1. Parse query parameters
2. Build MongoDB query
3. Execute query with filters
4. Populate related fields
5. Return formatted response

// Response:
{
  success: true,
  packages: [
    {
      _id: "package_id",
      title: "Bihar Heritage Tour",
      pricing: { basePrice: 15000, originalPrice: 18000 },
      images: { featured: "cloudinary_url" },
      // ... other fields
    }
  ]
}
```

### Booking Management Workflow

#### 1. Create Tour Booking
```javascript
// Request Flow
POST /api/bookings/tour
Authorization: Bearer <jwt_token>

// Input:
{
  tourPackage: "package_id",
  numberOfTravelers: 4,
  travelDate: "2024-06-15",
  totalAmount: 60000,
  contactNumber: "1234567890",
  specialRequests: "Vegetarian meals"
}

// Process:
1. Validate JWT token
2. Verify tour package exists
3. Calculate total amount
4. Generate unique booking reference
5. Create Booking document
6. Send confirmation notification
7. Email confirmation to user

// Response:
{
  success: true,
  message: "Booking created successfully",
  booking: {
    _id: "booking_id",
    bookingReference: "TOUR1640995200123",
    status: "pending",
    // ... other fields
  }
}
```

#### 2. Admin Booking Management
```javascript
// Confirm Booking
PATCH /admin/bookings/:id/confirm
Authorization: Bearer <admin_jwt_token>

// Process:
1. Validate admin permissions
2. Update booking status to "confirmed"
3. Send confirmation notification to user
4. Update booking statistics
5. Log admin action

// Cancel Booking
PATCH /admin/bookings/:id/cancel
{
  reason: "Tour cancelled due to weather conditions"
}

// Process:
1. Update status to "cancelled"
2. Record cancellation reason and admin
3. Send cancellation notification
4. Process refund if applicable
```

### Query Management Workflow

#### 1. Submit Query
```javascript
// Request Flow
POST /api/queries
Authorization: Bearer <jwt_token>

// Input:
{
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  subject: "Tour inquiry",
  category: "tour-package",
  message: "I want to know about Bihar tour packages"
}

// Process:
1. Validate user authentication
2. Create Query document
3. Link to authenticated user
4. Send notification to admin
5. Auto-assign priority based on category
6. Return query with tracking ID
```

#### 2. Admin Response
```javascript
// Request Flow
PATCH /admin/queries/:id/respond
Authorization: Bearer <admin_jwt_token>

// Input:
{
  response: "Thank you for your inquiry. Here are our available packages...",
  status: "resolved"
}

// Process:
1. Validate admin permissions
2. Update query with response
3. Set status to "resolved"
4. Record response timestamp and admin
5. Send email notification to user
6. Create in-app notification
7. Return updated query
```

#### 3. User Feedback
```javascript
// Request Flow
PATCH /api/queries/:id/rate
Authorization: Bearer <jwt_token>

// Input:
{
  rating: "satisfied",
  feedback: "Great response, very helpful"
}

// Process:
1. Validate user owns the query
2. Update query with rating and feedback
3. Change status to "closed"
4. Record feedback timestamp
5. Update admin performance metrics
```

---

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── Navbar/
│   │   └── Navbar.jsx              # Main navigation with mobile UX
│   ├── Footer/
│   │   └── Footer.jsx              # Site footer
│   ├── Toast/
│   │   └── Toast.jsx               # Notification toasts
│   ├── NotificationPanel/
│   │   └── NotificationPanel.jsx   # Real-time notifications
│   ├── BiharCarousel/
│   │   └── BiharCarousel.jsx       # Image carousel
│   ├── TourPackagesSection/
│   │   └── TourPackagesSection.jsx # Tour packages display
│   ├── ProtectedRoute.jsx          # Route protection
│   ├── AdminProtectedRoute.jsx     # Admin route protection
│   └── ...
├── pages/
│   ├── Home.jsx                    # Landing page
│   ├── About.jsx                   # About us page
│   ├── TourPackages.jsx            # Tour packages listing
│   ├── TourDetail.jsx              # Individual tour details
│   ├── LoginPage.jsx               # User login
│   ├── RegisterPage.jsx            # User registration
│   ├── UserDashboard.jsx           # User dashboard
│   ├── AdminDashboard.jsx          # Admin management
│   └── ...
├── context/
│   ├── AuthContext.jsx             # Authentication state
│   ├── DataContext.jsx             # Global data management
│   └── ToastContext.jsx            # Toast notifications
├── services/
│   ├── authService.js              # Authentication API calls
│   ├── adminService.js             # Admin API calls
│   ├── bookingService.js           # Booking API calls
│   ├── tourService.js              # Tour package API calls
│   └── notificationService.js      # Notification API calls
├── hooks/
│   ├── useDataSync.js              # Data synchronization
│   ├── useLoading.js               # Loading state management
│   ├── useForm.js                  # Form handling
│   └── useApi.js                   # API call management
├── utils/
│   ├── errorHandler.js             # Centralized error handling
│   ├── storage.js                  # localStorage management
│   └── validation.js               # Form validation
└── config/
    ├── axios.js                    # Axios configuration
    └── env.js                      # Environment configuration
```

### State Management with Context API

#### AuthContext
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-validate JWT on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        
        // Validate token with backend
        try {
          const sessionUser = await authService.checkSession();
          setUser(sessionUser);
        } catch (error) {
          if (error.response?.status === 401) {
            authService.clearAuthData();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    login: async (email, password) => { /* ... */ },
    register: async (userData) => { /* ... */ },
    logout: async () => { /* ... */ },
    updateUser: (updatedUser) => setUser(updatedUser),
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### DataContext (Admin Dashboard)
```javascript
const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    users: [],
    queries: [],
    tourBookings: [],
    tourPackages: [],
    stats: {}
  });

  const [lastUpdated, setLastUpdated] = useState({});

  const value = {
    data,
    lastUpdated,
    updateData: (type, newData) => { /* ... */ },
    addItem: (type, item) => { /* ... */ },
    updateItem: (type, itemId, updatedItem) => { /* ... */ },
    removeItem: (type, itemId) => { /* ... */ },
    invalidateData: (type) => { /* ... */ }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
```

### Custom Hooks

#### useDataSync Hook
```javascript
export const useDataSync = (dataType, fetchFunction) => {
  const { data, lastUpdated, updateData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      updateData(dataType, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dataType, updateData]);

  // Auto-fetch if data is stale
  useEffect(() => {
    if (!lastUpdated[dataType]) {
      fetchData();
    }
  }, [dataType, lastUpdated, fetchData]);

  return {
    data: data[dataType] || [],
    isLoading,
    error,
    refetch: fetchData
  };
};
```

### Routing Structure
```javascript
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/tour-packages" element={<TourPackages />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/user-dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        
        {/* Tour Booking Routes */}
        <Route path="/tour-packages/:id" element={
          <TourBookingProtectedRoute>
            <TourDetail />
          </TourBookingProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
```

---

## 🛡️ Security Features

### Authentication Security
- **JWT Tokens**: Stateless authentication with access/refresh token pattern
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **OTP Verification**: Email-based account verification with expiring tokens
- **Token Refresh**: Automatic token renewal to maintain sessions
- **Rate Limiting**: Protection against brute force attacks

### Authorization
- **Role-Based Access**: User and admin roles with different permissions
- **Route Protection**: Frontend and backend route guards
- **API Middleware**: JWT validation on protected endpoints
- **Admin Verification**: Additional checks for admin-only operations

### Data Security
- **Input Validation**: Mongoose schema validation and custom validators
- **SQL Injection Prevention**: MongoDB's built-in protection
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Restricted cross-origin requests
- **Environment Variables**: Sensitive data stored securely

### File Security
- **Cloudinary Integration**: Secure image upload and storage
- **File Type Validation**: Restricted file types for uploads
- **Size Limits**: Maximum file size restrictions
- **Automatic Cleanup**: Orphaned file deletion

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)

1. **Connect Repository**
   ```bash
   # Connect GitHub repository to Vercel
   # Automatic deployments on push to main branch
   ```

2. **Environment Variables**
   ```env
   VITE_API_URL=https://next-drive-bihar.onrender.com
   VITE_APP_NAME=NextDrive Bihar
   VITE_ENABLE_DEBUG_LOGS=false
   VITE_ENABLE_NOTIFICATIONS=true
   ```

3. **Build Configuration**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```

### Backend Deployment (Render)

1. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nextdrive
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   CLIENT_URL=https://next-drive-bihar.vercel.app
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=NextDrive Bihar <noreply@nextdrivebihar.com>
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_AUTH_CALLBACK=https://next-drive-bihar.onrender.com/auth/google/callback
   ```

2. **Build Configuration**
   ```json
   {
     "buildCommand": "npm install",
     "startCommand": "npm start"
   }
   ```

### Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Choose appropriate region
   - Configure network access
   - Create database user

2. **Connection String**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

3. **Indexes** (Auto-created by Mongoose)
   - User email index
   - Tour package slug index
   - Booking reference index
   - Query status index

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for email service)

### Backend Setup
```bash
# Clone repository
git clone https://github.com/ganeshkr0201/next-drive-bihar.git
cd next-drive-bihar/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/nextdrive
JWT_SECRET=your-development-jwt-secret
JWT_REFRESH_SECRET=your-development-refresh-secret
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=NextDrive Bihar <noreply@localhost>
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=NextDrive Bihar
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## ✨ Feature Implementation

### 1. JWT Authentication System
- **Implementation**: Complete JWT-based authentication replacing session-based auth
- **Features**: Access/refresh token pattern, automatic token refresh, secure storage
- **Benefits**: Stateless, mobile-friendly, scalable

### 2. Cloudinary Integration
- **Implementation**: Automatic image upload, optimization, and deletion
- **Features**: Profile photos (400x400), tour images (1200x800), automatic cleanup
- **Benefits**: CDN delivery, optimized images, reduced server storage

### 3. Email Verification System
- **Implementation**: OTP-based email verification with rate limiting
- **Features**: 6-digit OTP, 10-minute expiry, resend functionality, auto-login option
- **Benefits**: Secure account verification, reduced spam accounts

### 4. Admin Dashboard
- **Implementation**: Comprehensive management interface with real-time data
- **Features**: User management, booking management, query responses, statistics
- **Benefits**: Complete platform control, efficient administration

### 5. Mobile-First Design
- **Implementation**: Responsive design with mobile-optimized navigation
- **Features**: Auto-closing mobile menu, touch-friendly interfaces, optimized layouts
- **Benefits**: Excellent mobile user experience

### 6. Notification System
- **Implementation**: Real-time notifications with email integration
- **Features**: In-app notifications, email notifications, notification history
- **Benefits**: Improved user engagement, timely updates

### 7. Query Management
- **Implementation**: Complete customer support system with response tracking
- **Features**: Query submission, admin responses, user feedback, satisfaction tracking
- **Benefits**: Efficient customer support, quality monitoring

### 8. Booking System
- **Implementation**: Complete tour booking workflow with status management
- **Features**: Tour selection, booking creation, status updates, cancellation handling
- **Benefits**: Streamlined booking process, comprehensive management

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Issues
**Problem**: JWT token expired or invalid
```javascript
// Solution: Implement automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refreshToken();
        return axios.request(error.config);
      } catch (refreshError) {
        authService.clearAuthData();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

#### 2. Image Upload Issues
**Problem**: Cloudinary upload fails
```javascript
// Solution: Check Cloudinary configuration
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
console.log('Cloudinary config:', cloudinary.config());
```

#### 3. Email Service Issues
**Problem**: OTP emails not sending
```javascript
// Solution: Check Gmail app password and configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use app password, not regular password
  }
});

// Test email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Email configuration error:', error);
  } else {
    console.log('Email server ready');
  }
});
```

#### 4. Database Connection Issues
**Problem**: MongoDB connection fails
```javascript
// Solution: Check connection string and network access
const connectToDB = async (uri) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
```

#### 5. CORS Issues
**Problem**: Cross-origin requests blocked
```javascript
// Solution: Configure CORS properly
app.use(cors({
  origin: [
    'https://next-drive-bihar.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: false, // Set to false for JWT
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Performance Optimization

#### 1. Database Optimization
```javascript
// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
tourPackageSchema.index({ slug: 1 });
bookingSchema.index({ user: 1, status: 1 });
querySchema.index({ status: 1, createdAt: -1 });
```

#### 2. Frontend Optimization
```javascript
// Implement lazy loading for routes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TourPackages = lazy(() => import('./pages/TourPackages'));

// Use React.memo for expensive components
const TourCard = React.memo(({ tour }) => {
  // Component implementation
});
```

#### 3. API Optimization
```javascript
// Implement pagination for large datasets
const getQueries = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const queries = await Query.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Query.countDocuments();

  res.json({
    success: true,
    queries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
```

---

## 📊 Monitoring and Analytics

### Error Tracking
```javascript
// Implement global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

### Logging
```javascript
// Implement structured logging
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }
};
```

---

## 🔮 Future Enhancements

### Planned Features
1. **Payment Integration**: Razorpay/Stripe integration for online payments
2. **Real-time Chat**: Customer support chat system
3. **Mobile App**: React Native mobile application
4. **Advanced Analytics**: Detailed booking and user analytics
5. **Multi-language Support**: Hindi and English language options
6. **Push Notifications**: Browser push notifications
7. **Social Media Integration**: Social login and sharing
8. **Review System**: User reviews and ratings for tours
9. **Loyalty Program**: Points and rewards system
10. **Advanced Search**: Filters and search functionality

### Technical Improvements
1. **Microservices Architecture**: Split into smaller services
2. **Redis Caching**: Implement caching layer
3. **GraphQL API**: Alternative to REST API
4. **Docker Containerization**: Containerized deployment
5. **CI/CD Pipeline**: Automated testing and deployment
6. **Load Balancing**: Handle increased traffic
7. **Database Sharding**: Scale database horizontally
8. **CDN Integration**: Faster content delivery
9. **Monitoring Dashboard**: Application performance monitoring
10. **Automated Testing**: Unit, integration, and e2e tests

---

## 📞 Support and Contact

### Development Team
- **Lead Developer**: Ganesh Kumar
- **GitHub**: https://github.com/ganeshkr0201
- **Repository**: https://github.com/ganeshkr0201/next-drive-bihar

### Project Links
- **Live Application**: https://next-drive-bihar.vercel.app
- **API Documentation**: https://next-drive-bihar.onrender.com
- **GitHub Repository**: https://github.com/ganeshkr0201/next-drive-bihar

### Getting Help
1. **Issues**: Create GitHub issues for bugs and feature requests
2. **Documentation**: Refer to this comprehensive documentation
3. **Code Review**: Follow the established coding standards
4. **Testing**: Test thoroughly before deploying changes

---

*This documentation is maintained and updated regularly. Last updated: January 2025*