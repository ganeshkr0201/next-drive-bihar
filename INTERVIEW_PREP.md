# NextDrive Bihar — Complete Interview Preparation Guide

> Focus on backend concepts, database design, and system design. Written specifically for explaining this project.

---

## 1. PROJECT OVERVIEW (30-second pitch)

**"NextDrive Bihar is a full-stack web application for a tour and car rental company operating in Bihar. It has three types of users — customers who book cars and tours, drivers who get assigned to bookings, and admins who manage everything. I built the backend with Node.js + Express, the database with MongoDB, and the frontend with React. The system handles authentication with JWT tokens, file uploads with Cloudinary, caching with Redis, and sends notifications via WhatsApp."**

---

## 2. TECH STACK — WHY EACH CHOICE

| Layer | Technology | Why chosen |
|-------|-----------|------------|
| Runtime | Node.js | Non-blocking I/O, good for API servers with many concurrent requests |
| Framework | Express.js | Minimal, flexible, large ecosystem |
| Database | MongoDB (Atlas) | Document model fits booking data well; schema can evolve |
| ODM | Mongoose | Schema validation, middleware hooks, easy relationships |
| Authentication | JWT (jsonwebtoken) | Stateless, scales horizontally, no session storage needed |
| Caching | Redis (Upstash) | OTP storage, rate limiting, fast key-value reads |
| File uploads | Cloudinary | Managed CDN for images; no server disk storage needed |
| Email | Nodemailer + Gmail | Transactional emails for OTP verification |
| OAuth | Passport.js + Google | Social login without storing passwords |
| Frontend | React + Vite | Fast SPA with code splitting |
| CSS | Tailwind CSS | Utility-first, no custom CSS files |
| Deployment (Frontend) | Vercel | Auto-deploy from GitHub, free tier |

---

## 3. BACKEND ARCHITECTURE

### 3.1 MVC Pattern
The backend follows **MVC (Model-View-Controller)**:

```
backend/
├── models/          ← M: Mongoose schemas (database layer)
├── controllers/     ← C: Business logic (what to do with requests)
├── routes/          ← URL → controller mapping
├── middlewares/     ← Functions that run before controllers
├── config/          ← DB, Redis, Cloudinary setup
├── utils/           ← Reusable helpers (JWT, OTP, email)
└── index.js         ← Entry point, app setup
```

### 3.2 Request Lifecycle
```
Client Request
    ↓
index.js (Express app receives it)
    ↓
CORS middleware (checks origin)
    ↓
Body parser (converts JSON string → JS object)
    ↓
Route file (matches URL pattern)
    ↓
Auth middleware (verifies JWT if required)
    ↓
Controller function (business logic + DB operations)
    ↓
JSON Response
```

### 3.3 Entry Point — index.js
Key things in `index.js`:
- **Environment-aware dotenv loading**: loads `.env.development` in dev, `.env` in production
- **CORS**: explicitly lists allowed origins (localhost + production domain)
- **Helmet**: adds security HTTP headers in production only
- **Graceful shutdown**: catches `SIGTERM`/`SIGINT` and disconnects Redis before closing

---

## 4. DATABASE — MONGODB & MONGOOSE

### 4.1 Why MongoDB (NoSQL) over SQL?

| SQL (MySQL/PostgreSQL) | MongoDB |
|----------------------|---------|
| Fixed schema (ALTER TABLE to add column) | Flexible schema (just add the field) |
| Joins across tables | Embed or reference documents |
| Good for transactional data | Good for hierarchical/nested data |

For this project, booking data has many optional fields (some bookings have marriage cars, some have passengers, etc.) — a flexible document schema is a better fit.

### 4.2 Schemas (Models)

#### User Model
```js
{
  name, email, password (hashed),
  role: ['user', 'admin', 'driver'],   // Three roles
  googleId, authProvider,              // Google OAuth
  avatar, avatarPublicId,              // Cloudinary
  phone, address, dateOfBirth, bio,
  isVerified: Boolean                  // Email verification flag
}
```
- Password is stored as a **bcrypt hash** (not plain text)
- `isVerified` gates login — unverified users cannot access protected routes

#### Booking Model (Tour)
```js
{
  user: ObjectId → User,           // Reference (foreign key equivalent)
  tourPackage: ObjectId → TourPackage,
  type: 'tour',
  numberOfTravelers, travelDate,
  totalAmount, paidAmount, discount,
  status: ['pending','confirmed','completed','cancelled'],
  contactNumber, emergencyContact,
  cancellationReason, cancelledBy, cancelledAt
}
```

#### CarBooking Model
The most complex model. Key fields:
```js
{
  user: ObjectId → User,
  isOfflineBooking: Boolean,           // Walk-in/WhatsApp bookings
  offlineCustomer: { name, phone, email, whatsappNumber },
  carType, tripType, pickupLocation, dropoffLocation,
  pickupDate, dropoffDate, pickupTime, dropoffTime,
  numberOfPassengers,
  tripType: ['one-way','round-trip','multi-city','outstation','marriage','monthly'],
  numberOfCars, selectedCars: [{ carId, carName, quantity, pricePerDay }],
  totalAmount, paidAmount, discount,
  status: ['pending','confirmed','in-progress','completed','cancelled'],
  paymentStatus: ['pending','partial','paid','refunded'],
  assignedDriver: ObjectId → Driver,  // Driver assignment
  driverDetails: { name, phone, licenseNumber },
  vehicleDetails: { make, model, plateNumber, color },
  notes: [{ content, addedBy, addedAt }],
  bookingReference: String (unique, auto-generated),
  cancellationReason, cancelledBy, cancelledByType, cancelledAt
}
```

**Virtual field**: `dueAmount` is a computed property (not stored in DB):
```js
carBookingSchema.virtual('dueAmount').get(function() {
  return Math.max(0, this.totalAmount - this.discount - this.paidAmount);
});
```

**Pre-save hook**: Auto-generates `bookingReference` and calculates `paymentStatus`:
```js
carBookingSchema.pre('save', async function() {
  if (!this.bookingReference) {
    this.bookingReference = 'CAR' + Date.now() + Math.floor(Math.random() * 1000);
  }
  // Auto-update payment status
  if (this.paidAmount === 0) this.paymentStatus = 'pending';
  else if (dueAmount <= 0) this.paymentStatus = 'paid';
  else this.paymentStatus = 'partial';
});
```

#### Driver Model
```js
{
  name, phone (10 digits, validated with regex),
  licenceType: ['LMV','HMV','HPMV','PSV','LMV-TR','MCWG'],
  drivingExperience, status: ['available','unavailable'],
  languagesKnown: [String],
  carType, carModel, carNumber,
  licenceImageFront, licenceImageBack,   // Cloudinary URLs
  driverPhoto, carFrontImage,
  addedBy: ObjectId → User,
  userId: ObjectId → User    // Auto-created login account
}
```

### 4.3 Relationships in MongoDB

MongoDB doesn't have JOIN like SQL. We use two approaches:

**1. Referencing (like foreign keys):**
```js
// In CarBooking:
assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }

// Query with populate (equivalent of JOIN):
await CarBooking.find().populate('assignedDriver', 'name phone carNumber')
```

**2. Embedding (nested documents):**
```js
// selectedCars is embedded directly inside CarBooking
selectedCars: [{ carId, carName, carType, quantity, pricePerDay }]
// No separate collection needed
```

**When to embed vs reference:**
- Embed when data is always read together and doesn't change independently
- Reference when data is shared across documents or can be updated independently

### 4.4 Indexes
Indexes speed up queries:
```js
carBookingSchema.index({ user: 1 });          // Fast lookup by user
carBookingSchema.index({ status: 1 });         // Fast filter by status
carBookingSchema.index({ pickupDate: 1 });     // Fast date range queries
carBookingSchema.index({ createdAt: -1 });     // Fast sort by newest
// bookingReference has unique:true → automatic unique index
```

Without indexes, MongoDB scans every document (O(n)). With indexes, it's O(log n).

### 4.5 Cascade Delete
When a user is deleted, we delete all their bookings, queries, notifications — prevents orphaned data:
```js
userSchema.pre('findOneAndDelete', async function() {
  await Booking.deleteMany({ user: userId });
  await CarBooking.deleteMany({ user: userId });
  await Query.deleteMany({ user: userId });
  // etc.
});
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 JWT (JSON Web Token)
JWT is a stateless authentication mechanism. No session stored on server.

**Structure of a JWT:**
```
header.payload.signature
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY2...eyJpc3MiOiJuZXh0ZHJpdmUtYmloYXIifQ.SIGNATURE
```

**What we store in the payload:**
```js
{
  id: user._id,
  email: user.email,
  role: 'user' | 'admin' | 'driver',
  name: user.name,
  iss: 'nextdrive-bihar',    // issuer
  aud: 'nextdrive-users',    // audience
  exp: 1234567890            // expiry timestamp
}
```

**Token Pair system:**
```
Access Token  → expires in 7 days  → used for every API call
Refresh Token → expires in 30 days → used only to get new access token
```

**How authentication works:**
```
1. User logs in with email + password
2. Backend verifies password with bcrypt.compare()
3. Backend generates token pair (access + refresh)
4. Frontend stores tokens in localStorage
5. Every subsequent request includes: Authorization: Bearer <accessToken>
6. Middleware extracts token, verifies signature, attaches user to req.user
```

**Why not sessions?**
- Sessions require server-side storage (RAM or database)
- JWT is self-contained — any server can verify it (scales horizontally)
- No need to hit database for every request to check session validity

### 5.2 bcrypt Password Hashing
```js
// When user registers:
const hashedPassword = await bcrypt.hash(password, 10);
// saltRounds = 10 means 2^10 = 1024 iterations of hashing
// Makes brute force attacks slow

// When user logs in:
const isValid = await bcrypt.compare(plainTextPassword, storedHash);
// Returns true/false without ever storing/comparing plain text
```

### 5.3 Role-Based Access Control (RBAC)
Three roles: `user`, `admin`, `driver`

```js
// Middleware chain on protected routes:
router.get('/admin/users',
  authenticateJWT,   // Step 1: verify JWT → sets req.user
  requireAdmin,      // Step 2: check req.user.role === 'admin'
  getAllUsers        // Step 3: run controller
);
```

**401 vs 403:**
- `401 Unauthorized` → no token or invalid token (not authenticated)
- `403 Forbidden` → valid token but wrong role (authenticated but not authorized)

### 5.4 Google OAuth (Passport.js)
```
User clicks "Login with Google"
    ↓
/auth/google → Passport redirects to Google
    ↓
User grants permission on Google's page
    ↓
Google redirects to /auth/google/callback with a code
    ↓
Passport exchanges code for user profile
    ↓
We find or create the user in our DB (upsert)
    ↓
Generate JWT tokens
    ↓
Redirect to frontend with tokens in URL params
```

---

## 6. REDIS & OTP SYSTEM

### 6.1 What is Redis?
Redis is an in-memory key-value store. Think of it as a super-fast dictionary. Much faster than MongoDB because data is in RAM, not disk.

**Use cases in this project:**
1. **OTP storage** — store OTP with TTL (auto-expires in 10 minutes)
2. **Rate limiting** — resend cooldown (30 seconds between OTP requests)
3. **API caching** — cache tour packages list to avoid repeated DB queries

### 6.2 OTP Flow
```
User registers with email
    ↓
We generate 6-digit OTP
    ↓
Hash it with bcrypt (same as password hashing)
    ↓
Store in Redis: key = "otp:user@email.com", value = { hashedOtp, attempts: 0 }, TTL = 600s
    ↓
Send plain OTP to user's email
    ↓
User enters OTP on frontend
    ↓
We get from Redis, compare with bcrypt.compare()
    ↓
If valid → delete from Redis, mark user as verified
If invalid → increment attempt counter, if attempts >= 5 → delete OTP (lockout)
```

**Why hash the OTP in Redis?**
Even if an attacker gains access to Redis, they can't extract the original OTP.

### 6.3 Redis Key Patterns
```
otp:<email>              → OTP data (TTL: 10 min)
otp_last_sent:<email>    → Cooldown marker (TTL: 30 sec)
admin_stats              → Cached statistics (TTL: 5 min)
tour_packages:*          → Cached tour packages
```

### 6.4 Cache Middleware
```js
// statsCache middleware:
// 1. Check if 'admin_stats' key exists in Redis
// 2. If yes → return cached response (skip controller)
// 3. If no → run controller, store result in Redis, return it

// invalidateCacheAfter middleware:
// After certain operations (creating bookings) → delete cache keys
// So next request gets fresh data
```

---

## 7. API DESIGN & REST PRINCIPLES

### 7.1 REST API Design
```
GET    /api/tour-packages        → list all tour packages (public)
GET    /api/tour-packages/:id    → get one package
POST   /api/bookings/tour        → create tour booking (auth required)
POST   /api/bookings/car         → create car booking (auth required)
GET    /api/bookings/my-bookings → get user's bookings (auth required)
PUT    /api/bookings/:id/cancel  → cancel a booking (auth required)

POST   /auth/register            → register user
POST   /auth/login               → login
POST   /auth/verify-otp          → verify email OTP
POST   /auth/refresh-token       → get new access token

GET    /admin/car-bookings        → all car bookings (admin only)
PATCH  /admin/car-bookings/:id/confirm → confirm booking
PUT    /admin/car-bookings/:id/driver  → assign driver
```

### 7.2 HTTP Status Codes Used
```
200 OK          → successful GET/PUT/PATCH
201 Created     → successful POST (new resource created)
400 Bad Request → validation failed, missing required fields
401 Unauthorized → no token / invalid token
403 Forbidden   → wrong role
404 Not Found   → resource doesn't exist
429 Too Many Requests → rate limit exceeded
500 Internal Server Error → unexpected server error
```

### 7.3 Request Body Validation
Validation happens in controllers:
```js
if (!customerName || !customerPhone) {
  return res.status(400).json({ success: false, message: 'Name and phone required' });
}
if (!/^\d{10}$/.test(form.phone)) {
  return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
}
```

---

## 8. FILE UPLOADS — CLOUDINARY

### 8.1 How It Works
```
Client sends multipart/form-data request with image file
    ↓
Multer middleware (memory storage) → stores file in memory as Buffer
    ↓
Controller uploads buffer to Cloudinary via stream
    ↓
Cloudinary returns { secure_url, public_id }
    ↓
We store the URL in MongoDB (not the file itself)
    ↓
Images served from Cloudinary's global CDN
```

### 8.2 Why Not Store Files on Server?
- Server storage is limited and costly
- Files would be lost if server restarts or crashes
- Cloudinary provides CDN (images load fast from nearest server), auto-resize, compression

### 8.3 Image Deletion
```js
// When we update a driver photo, we delete the old one:
await cloudinary.uploader.destroy(driver.driverPhotoPublicId);
// Then upload new one and store new URL + public_id
```

---

## 9. BOOKING SYSTEM LOGIC

### 9.1 Fare Calculation (Backend)
The fare is calculated **on the backend** (not trusted from frontend) to prevent tampering:

```js
switch (bookingType) {
  case 'one-way':
    cost = distance * car.pricing.oneWay.perKm + car.pricing.oneWay.extraAmount;
    break;
  case 'round-trip':
    cost = distance * 2 * car.pricing.roundTrip.perKm + extraAmount;
    // Round trip = 2x distance
    break;
  case 'marriage':
    cost = numberOfDays * car.pricing.marriage.perDay;
    break;
}
```

### 9.2 Distance Validation
The backend has a dictionary of known Bihar routes with accurate distances:
```js
const biharRoutes = {
  'patna-gaya': 100,
  'patna-muzaffarpur': 70,
  // ... 40+ routes
};
```
If the frontend sends a distance that's too different from the known value, the backend uses the pre-defined distance. This prevents users from sending a distance of 1 km for a 100 km trip.

### 9.3 Booking Status Flow
```
pending → confirmed → in-progress → completed
    ↓
cancelled (can happen from pending or confirmed)
```

- Admin confirms/cancels/completes bookings
- Driver can mark a confirmed booking as completed
- User can cancel only pending bookings

### 9.4 Driver Auto-Account Creation
When admin creates a driver, the system automatically creates a User account:
```
Driver phone: 9876543210
    ↓
User email: 9876543210@driver.nextdrive
User password (hashed): bcrypt("543210")  ← last 6 digits
User role: 'driver'
    ↓
Driver.userId → points to this User document
```

---

## 10. SECURITY MEASURES

| Threat | Protection |
|--------|-----------|
| SQL/NoSQL Injection | Mongoose parameterized queries (never concatenate user input into queries) |
| Password theft | bcrypt hashing with salt rounds = 10 |
| Token forgery | JWT signed with secret key (HMAC-SHA256) |
| CSRF | Stateless JWT (no cookies used) |
| XSS | Helmet sets security headers (X-Content-Type, X-Frame-Options) |
| Unauthorized access | Role-based middleware (requireAdmin, requireDriver) |
| Brute force OTP | 5 attempt limit + 30 second resend cooldown |
| Sensitive data exposure | `.select('-password')` when fetching users |
| Environment secrets | `.env` files (never committed to Git) |
| CORS | Whitelist of allowed origins |

---

## 11. COMMON INTERVIEW QUESTIONS & ANSWERS

### Q: What is the difference between authentication and authorization?
**Authentication** = "Who are you?" → verified by JWT token validation  
**Authorization** = "What can you do?" → checked by `requireAdmin`, `requireDriver` middleware

### Q: Why JWT over sessions?
JWT is stateless — the token contains all needed info. Sessions need server-side storage. JWT scales better across multiple server instances because no shared session store is needed.

### Q: What is CORS and why do you need it?
CORS (Cross-Origin Resource Sharing) — browser security policy that blocks requests to a different origin (domain/port). Our frontend (localhost:5173 / vercel.app) makes requests to backend (localhost:4000). Without CORS headers, the browser would block it. We explicitly whitelist allowed origins.

### Q: What is middleware in Express?
A function that runs between the request and the controller. Examples: `authenticateJWT` (checks token), `express.json()` (parses body), `cors()` (handles CORS headers). Middleware calls `next()` to pass control to the next function.

### Q: What is an index in MongoDB? Why use it?
An index is a data structure (B-tree) that stores a subset of fields in sorted order, making queries on those fields faster. Without index: full collection scan O(n). With index: O(log n). We index `user`, `status`, `pickupDate`, `createdAt` because those are the most queried fields.

### Q: What is the difference between PUT and PATCH?
- **PUT** = replace the entire resource
- **PATCH** = partial update (only specified fields)
We use PATCH for status updates: `PATCH /admin/bookings/:id/confirm`

### Q: How do you handle errors in Express?
We use try-catch in every async controller and return structured JSON responses:
```js
try {
  const booking = await CarBooking.findById(id);
  if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, booking });
} catch (error) {
  res.status(500).json({ success: false, message: error.message });
}
```

### Q: What is a virtual field in Mongoose?
A computed property that doesn't get stored in MongoDB:
```js
carBookingSchema.virtual('dueAmount').get(function() {
  return Math.max(0, this.totalAmount - this.discount - this.paidAmount);
});
```
`dueAmount` is calculated on the fly when you access `booking.dueAmount`. No extra DB column needed.

### Q: What is a pre-save hook in Mongoose?
A function that runs automatically before a document is saved. We use it to:
1. Auto-generate `bookingReference` (never duplicate)
2. Auto-calculate `paymentStatus` based on paid/total amounts

### Q: Explain your user roles.
Three roles in the system:
- **user** — customers who browse tours, rent cars, make bookings
- **admin** — company staff who confirm bookings, manage drivers, set prices
- **driver** — assigned to bookings, can view their trips, mark rides as complete

Each role has different API access enforced by middleware.

### Q: How does Google OAuth work in your project?
1. User clicks "Login with Google" → we redirect to Google's OAuth server
2. User approves → Google redirects to our callback URL with an auth code
3. Passport exchanges the code for user profile (name, email, Google ID)
4. We check if user exists in our DB by `googleId` or `email`
5. If not, create new user with `authProvider: 'google'` (no password stored)
6. Generate JWT tokens and redirect to frontend with tokens in URL

### Q: Why is bcrypt better than MD5/SHA for passwords?
MD5/SHA are fast (designed for data integrity). bcrypt is deliberately slow (`saltRounds = 10` → 1024 iterations). Slow hashing makes brute force attacks impractical. bcrypt also auto-generates a salt (random string added to password before hashing) — same password hash differently each time, defeating rainbow table attacks.

### Q: What is the difference between `populate` and embedding in Mongoose?
- **populate** = reference the document's ObjectId and fetch it at query time (lazy loading equivalent)
- **embedding** = store the data directly inside the parent document

We use both: `assignedDriver` is referenced (can be changed without duplicating data), `selectedCars` is embedded (part of the booking, changes with it).

### Q: How do you prevent price manipulation from the frontend?
Fare calculation happens on the backend using the car's pricing from the database. The frontend sends trip details (distance, type, car ID). The backend fetches the car's pricing, validates the distance against a dictionary of known routes, and calculates the fare. The user cannot manipulate the price by modifying the request.

---

## 12. PROJECT NUMBERS TO REMEMBER

- **8 MongoDB collections**: User, Booking (tour), CarBooking, Car, Driver, TourPackage, Gallery, Query, Notification, Feedback
- **3 user roles**: user, admin, driver
- **5 booking statuses**: pending, confirmed, in-progress, completed, cancelled
- **6 trip types**: one-way, round-trip, outstation, marriage, monthly, multi-city
- **2 token types**: access (7 days) + refresh (30 days)
- **OTP**: 10 minute TTL, 5 attempt limit, 30 second resend cooldown
- **Port**: 4000 (backend), 5173 (frontend dev)

---

## 13. WHAT MAKES THIS PROJECT STAND OUT

1. **Three distinct user dashboards** — different UI and API access per role (user/admin/driver)
2. **Real-time driver assignment** — admin assigns driver from live list, WhatsApp notifications sent to both driver and customer automatically
3. **Offline booking system** — admin can create bookings for walk-in/WhatsApp customers with no user account
4. **Auto driver account creation** — driver account is automatically provisioned when admin adds a driver
5. **Backend fare validation** — prices calculated and validated server-side, not trusted from client
6. **Redis-backed OTP** — OTPs stored in Redis with TTL, hashed, with attempt limiting and resend cooldown
7. **Distance validation dictionary** — 40+ Bihar routes with known accurate distances to prevent price manipulation
8. **Graceful shutdown** — SIGTERM/SIGINT handlers disconnect Redis cleanly before process exits

---

## 14. QUICK REVISION — KEY TERMS

| Term | One-line definition |
|------|-------------------|
| REST | Architectural style: URLs = resources, HTTP methods = actions |
| JWT | Self-contained token with payload + signature, no server session |
| bcrypt | Password hashing algorithm, deliberately slow, with salt |
| Middleware | Function between request and controller that can modify req/res |
| CORS | Browser policy; server must allow cross-origin requests |
| ODM | Object Document Mapper (Mongoose) — JS classes mapped to DB documents |
| Index | Data structure to speed up database queries |
| Virtual | Computed field in Mongoose not stored in DB |
| Pre-save hook | Mongoose lifecycle function that runs before document save |
| Populate | Mongoose query modifier that fetches referenced documents (like JOIN) |
| Redis TTL | Time-to-live — key auto-expires after set seconds |
| Cloudinary | Cloud image CDN + storage service |
| Helmet | Express middleware that sets secure HTTP headers |
| RBAC | Role-Based Access Control — permissions based on user role |
| 401 vs 403 | 401 = not authenticated; 403 = authenticated but not authorized |

---

> **Best of luck for your TCS interview! You built this project — you understand it better than anyone.**
