# NextDrive Bihar - Backend API Documentation

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://next-drive-bihar.onrender.com`

## Authentication
Most endpoints require authentication via session cookies. The API uses Express sessions with Passport.js for authentication.

---

## 🔐 Authentication Routes (`/auth`)

### 1. Register User
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Authentication**: Not required
- **Input**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Output**:
```json
{
  "message": "Registration successful! Please check your email for verification code.",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "authProvider": "local",
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "requiresVerification": true
}
```

### 2. Login User
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Authentication**: Not required
- **Input**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Output**:
```json
{
  "message": "Login Successful",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "authProvider": "local",
    "avatar": "cloudinary_url",
    "isVerified": true
  }
}
```

### 3. Verify OTP
- **Method**: `POST`
- **Endpoint**: `/auth/verify-otp`
- **Authentication**: Not required
- **Input**:
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "autoLogin": true
}
```
- **Output**:
```json
{
  "message": "Email verified and logged in successfully!",
  "verified": true,
  "autoLogin": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true
  }
}
```

### 4. Resend OTP
- **Method**: `POST`
- **Endpoint**: `/auth/resend-otp`
- **Authentication**: Not required
- **Input**:
```json
{
  "email": "john@example.com"
}
```
- **Output**:
```json
{
  "message": "Verification code sent successfully!"
}
```

### 5. Google OAuth Login
- **Method**: `GET`
- **Endpoint**: `/auth/google`
- **Authentication**: Not required
- **Description**: Redirects to Google OAuth consent screen

### 6. Google OAuth Callback
- **Method**: `GET`
- **Endpoint**: `/auth/google/callback`
- **Authentication**: Not required
- **Description**: Handles Google OAuth callback and redirects to frontend

### 7. Get Current User
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "cloudinary_url"
  }
}
```

### 8. Update User Profile
- **Method**: `PUT`
- **Endpoint**: `/auth/profile`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Input**:
```json
{
  "name": "John Updated",
  "phone": "1234567890",
  "address": "123 Main St",
  "dateOfBirth": "1990-01-01",
  "bio": "Travel enthusiast",
  "avatar": "file_upload"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Updated",
    "email": "john@example.com",
    "avatar": "cloudinary_url",
    "avatarPublicId": "cloudinary_public_id",
    "phone": "1234567890",
    "address": "123 Main St",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "bio": "Travel enthusiast"
  }
}
```

### 9. Logout User
- **Method**: `GET`
- **Endpoint**: `/auth/logout`
- **Authentication**: Required
- **Output**:
```json
{
  "message": "Logged out successfully"
}
```

### 10. Delete Account
- **Method**: `DELETE`
- **Endpoint**: `/auth/delete-account`
- **Authentication**: Required
- **Input**:
```json
{
  "password": "password123",
  "confirmText": "DELETE MY ACCOUNT"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Your account and all associated data have been permanently deleted",
  "deletedData": {
    "tourBookings": 5,
    "carBookings": 2,
    "queries": 3,
    "notifications": 10,
    "avatar": "Yes"
  }
}
```

---

## 🌐 Public Routes (`/api`)

### 1. Get Tour Packages
- **Method**: `GET`
- **Endpoint**: `/api/tour-packages`
- **Authentication**: Not required
- **Query Parameters**:
  - `featured`: `true` (optional) - Get only featured packages
  - `limit`: `number` (optional) - Limit number of results
  - `category`: `string` (optional) - Filter by category
- **Output**:
```json
{
  "success": true,
  "packages": [
    {
      "_id": "package_id",
      "title": "Bihar Heritage Tour",
      "slug": "bihar-heritage-tour",
      "description": "Explore the rich heritage of Bihar",
      "duration": {
        "days": 5,
        "nights": 4
      },
      "pricing": {
        "basePrice": 15000,
        "originalPrice": 18000,
        "currency": "INR"
      },
      "images": {
        "featured": "cloudinary_url",
        "gallery": [
          {
            "url": "cloudinary_url",
            "caption": "Image caption"
          }
        ]
      },
      "highlights": ["Visit Nalanda", "Explore Rajgir"],
      "category": "Heritage & Culture",
      "status": "Published",
      "featured": true,
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin Name"
      }
    }
  ]
}
```

### 2. Get Single Tour Package
- **Method**: `GET`
- **Endpoint**: `/api/tour-packages/:identifier`
- **Authentication**: Not required
- **Parameters**: `identifier` can be slug or ID
- **Output**: Same as above but single package object

### 3. Get Tour Categories
- **Method**: `GET`
- **Endpoint**: `/api/tour-categories`
- **Authentication**: Not required
- **Output**:
```json
{
  "success": true,
  "categories": ["Heritage & Culture", "Adventure", "Religious"]
}
```

### 4. Create Tour Booking
- **Method**: `POST`
- **Endpoint**: `/api/bookings/tour`
- **Authentication**: Required
- **Input**:
```json
{
  "tourPackage": "package_id",
  "numberOfTravelers": 4,
  "travelDate": "2024-06-15",
  "totalAmount": 60000,
  "specialRequests": "Vegetarian meals",
  "contactNumber": "1234567890",
  "emergencyContact": "9876543210",
  "pickupLocation": "Patna Railway Station",
  "dropLocation": "Patna Airport"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "booking_id",
    "bookingReference": "BK-2024-001",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tourPackage": {
      "_id": "package_id",
      "title": "Bihar Heritage Tour",
      "duration": {
        "days": 5,
        "nights": 4
      },
      "pricing": {
        "basePrice": 15000
      }
    },
    "numberOfTravelers": 4,
    "travelDate": "2024-06-15T00:00:00.000Z",
    "totalAmount": 60000,
    "status": "pending",
    "bookingDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Get User Bookings
- **Method**: `GET`
- **Endpoint**: `/api/bookings/my-bookings`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id",
      "bookingReference": "BK-2024-001",
      "tourPackage": {
        "title": "Bihar Heritage Tour",
        "duration": {
          "days": 5,
          "nights": 4
        },
        "images": {
          "featured": "cloudinary_url"
        }
      },
      "numberOfTravelers": 4,
      "travelDate": "2024-06-15T00:00:00.000Z",
      "totalAmount": 60000,
      "status": "pending"
    }
  ]
}
```

### 6. Get Single Booking
- **Method**: `GET`
- **Endpoint**: `/api/bookings/:id`
- **Authentication**: Required
- **Output**: Single booking object with full details

### 7. Cancel Booking
- **Method**: `PATCH`
- **Endpoint**: `/api/bookings/:id/cancel`
- **Authentication**: Required
- **Input**:
```json
{
  "reason": "Change of plans"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "booking_id",
    "status": "cancelled",
    "cancellationReason": "Change of plans",
    "cancelledBy": "user_id",
    "cancelledByType": "user",
    "cancelledAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8. Submit Query
- **Method**: `POST`
- **Endpoint**: `/api/queries`
- **Authentication**: Required
- **Input**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "whatsapp": "1234567890",
  "subject": "Tour inquiry",
  "message": "I want to know about Bihar tour packages",
  "category": "tour-package"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Your query has been submitted successfully. You can track its status in your dashboard.",
  "query": {
    "_id": "query_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "subject": "Tour inquiry",
    "category": "tour-package",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 9. Get User Queries
- **Method**: `GET`
- **Endpoint**: `/api/queries/my-queries`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "queries": [
    {
      "_id": "query_id",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Tour inquiry",
      "message": "I want to know about Bihar tour packages",
      "category": "tour-package",
      "status": "resolved",
      "response": "Thank you for your inquiry...",
      "respondedBy": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "respondedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 10. Rate Query Response
- **Method**: `PATCH`
- **Endpoint**: `/api/queries/:id/rate`
- **Authentication**: Required
- **Input**:
```json
{
  "rating": "satisfied",
  "feedback": "Great response, very helpful"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Thank you for your feedback! Your query has been closed.",
  "query": {
    "_id": "query_id",
    "rating": "satisfied",
    "feedback": "Great response, very helpful",
    "ratedAt": "2024-01-01T00:00:00.000Z",
    "status": "closed"
  }
}
```

---

## 🔔 Notification Routes (`/api/notifications`)

### 1. Get User Notifications
- **Method**: `GET`
- **Endpoint**: `/api/notifications`
- **Authentication**: Required
- **Query Parameters**:
  - `limit`: `number` (default: 20)
  - `page`: `number` (default: 1)
- **Output**:
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notification_id",
      "type": "booking_confirmation",
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed",
      "isRead": false,
      "priority": "high",
      "sender": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com",
        "avatar": "cloudinary_url"
      },
      "relatedBooking": {
        "bookingId": "BK-2024-001"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 2. Get Unread Count
- **Method**: `GET`
- **Endpoint**: `/api/notifications/unread-count`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "count": 5
}
```

### 3. Mark Notification as Read
- **Method**: `PATCH`
- **Endpoint**: `/api/notifications/:id/read`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "_id": "notification_id",
    "isRead": true,
    "readAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Mark All as Read
- **Method**: `PATCH`
- **Endpoint**: `/api/notifications/mark-all-read`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 5. Delete Notification
- **Method**: `DELETE`
- **Endpoint**: `/api/notifications/:id`
- **Authentication**: Required
- **Output**:
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## 👑 Admin Routes (`/admin`)
**Note**: All admin routes require admin authentication

### 1. Get Dashboard Statistics
- **Method**: `GET`
- **Endpoint**: `/admin/stats`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalQueries": 45,
    "totalTourBookings": 89,
    "totalCarBookings": 23,
    "totalTourPackages": 12
  }
}
```

### 2. Get All Queries
- **Method**: `GET`
- **Endpoint**: `/admin/queries`
- **Authentication**: Admin required
- **Query Parameters**:
  - `status`: `pending|resolved|closed`
  - `category`: `tour-package|car-booking|others`
  - `filter`: `active|closed`
- **Output**:
```json
{
  "success": true,
  "queries": [
    {
      "_id": "query_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "subject": "Tour inquiry",
      "message": "I want to know about Bihar tour packages",
      "category": "tour-package",
      "status": "pending",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "pending": 15,
    "resolved": 20,
    "closed": 10,
    "carBooking": 8,
    "tourPackage": 25,
    "others": 12,
    "total": 45,
    "active": 35
  }
}
```

### 3. Respond to Query
- **Method**: `PATCH`
- **Endpoint**: `/admin/queries/:id/respond`
- **Authentication**: Admin required
- **Input**:
```json
{
  "response": "Thank you for your inquiry. Here are the available tour packages...",
  "status": "resolved"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Query response sent successfully",
  "query": {
    "_id": "query_id",
    "response": "Thank you for your inquiry...",
    "status": "resolved",
    "respondedAt": "2024-01-01T00:00:00.000Z",
    "respondedBy": {
      "_id": "admin_id",
      "name": "Admin Name",
      "email": "admin@example.com"
    }
  }
}
```

### 4. Get All Tour Bookings
- **Method**: `GET`
- **Endpoint**: `/admin/tour-bookings`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id",
      "bookingReference": "BK-2024-001",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "tourPackage": {
        "_id": "package_id",
        "title": "Bihar Heritage Tour"
      },
      "numberOfTravelers": 4,
      "travelDate": "2024-06-15T00:00:00.000Z",
      "totalAmount": 60000,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5. Get All Car Bookings
- **Method**: `GET`
- **Endpoint**: `/admin/car-bookings`
- **Authentication**: Admin required
- **Output**: Similar to tour bookings but for car rentals

### 6. Get All Tour Packages
- **Method**: `GET`
- **Endpoint**: `/admin/tour-packages`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "packages": [
    {
      "_id": "package_id",
      "title": "Bihar Heritage Tour",
      "slug": "bihar-heritage-tour",
      "description": "Explore the rich heritage of Bihar",
      "status": "Published",
      "featured": true,
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "bookingStats": {
        "totalBookings": 15,
        "totalTravelers": 45,
        "totalRevenue": 675000
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7. Create Tour Package
- **Method**: `POST`
- **Endpoint**: `/admin/tour-packages`
- **Authentication**: Admin required
- **Content-Type**: `multipart/form-data`
- **Input**:
```json
{
  "name": "Bihar Heritage Tour",
  "duration": "5 Days / 4 Nights",
  "summary": "Explore the rich heritage of Bihar",
  "highlights": "Visit Nalanda\nExplore Rajgir\nSee Mahabodhi Temple",
  "price": "15000",
  "discount": "3000",
  "inclusions": "Transportation\nAccommodation\nMeals",
  "exclusions": "Personal expenses\nTravel insurance",
  "pickupLocations": "Patna Railway Station\nPatna Airport",
  "dropLocations": "Patna Railway Station\nPatna Airport",
  "images": ["file_upload1", "file_upload2"]
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Tour package created successfully",
  "package": {
    "_id": "package_id",
    "title": "Bihar Heritage Tour",
    "slug": "bihar-heritage-tour",
    "description": "Explore the rich heritage of Bihar",
    "duration": {
      "days": 5,
      "nights": 4
    },
    "pricing": {
      "basePrice": 15000,
      "originalPrice": 18000,
      "currency": "INR"
    },
    "images": {
      "featured": "cloudinary_url",
      "gallery": [
        {
          "url": "cloudinary_url",
          "publicId": "cloudinary_public_id",
          "caption": "",
          "alt": "Bihar Heritage Tour"
        }
      ]
    },
    "status": "Published",
    "createdBy": "admin_id"
  }
}
```

### 8. Update Tour Package
- **Method**: `PUT`
- **Endpoint**: `/admin/tour-packages/:id`
- **Authentication**: Admin required
- **Content-Type**: `multipart/form-data`
- **Input**: Similar to create but all fields optional
- **Output**: Updated package object

### 9. Delete Tour Package
- **Method**: `DELETE`
- **Endpoint**: `/admin/tour-packages/:id`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "message": "Tour package deleted successfully"
}
```

### 10. Confirm Booking
- **Method**: `PATCH`
- **Endpoint**: `/admin/bookings/:id/confirm`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "_id": "booking_id",
    "status": "confirmed"
  }
}
```

### 11. Cancel Booking
- **Method**: `PATCH`
- **Endpoint**: `/admin/bookings/:id/cancel`
- **Authentication**: Admin required
- **Input**:
```json
{
  "reason": "Tour cancelled due to weather conditions"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "booking_id",
    "status": "cancelled",
    "cancellationReason": "Tour cancelled due to weather conditions",
    "cancelledBy": "admin_id",
    "cancelledByType": "admin",
    "cancelledAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 12. Complete Booking
- **Method**: `PATCH`
- **Endpoint**: `/admin/bookings/:id/complete`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "message": "Booking marked as completed successfully",
  "booking": {
    "_id": "booking_id",
    "status": "completed"
  }
}
```

### 13. Get All Users
- **Method**: `GET`
- **Endpoint**: `/admin/users`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "authProvider": "local",
      "avatar": "cloudinary_url",
      "isVerified": true,
      "bookingStats": {
        "tourBookings": 5,
        "carBookings": 2,
        "totalBookings": 7
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 14. Delete User
- **Method**: `DELETE`
- **Endpoint**: `/admin/users/:id`
- **Authentication**: Admin required
- **Output**:
```json
{
  "success": true,
  "message": "User account and all associated data deleted successfully",
  "deletedData": {
    "user": "John Doe",
    "tourBookings": 5,
    "carBookings": 2,
    "queries": 3,
    "notifications": 10,
    "avatar": "Yes"
  }
}
```

### 15. Create Admin User
- **Method**: `POST`
- **Endpoint**: `/admin/create-admin`
- **Authentication**: Not required (REMOVE IN PRODUCTION)
- **Input**:
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Admin created successfully",
  "user": {
    "_id": "admin_id",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 16. Create Notification (Admin)
- **Method**: `POST`
- **Endpoint**: `/api/notifications`
- **Authentication**: Admin required
- **Input**:
```json
{
  "recipientEmail": "user@example.com",
  "type": "general",
  "title": "Important Update",
  "message": "We have updated our terms of service",
  "priority": "medium",
  "actionUrl": "/terms"
}
```
- **Output**:
```json
{
  "success": true,
  "message": "Notification created successfully",
  "notification": {
    "_id": "notification_id",
    "recipient": "user_id",
    "sender": {
      "_id": "admin_id",
      "name": "Admin Name",
      "email": "admin@example.com",
      "avatar": "cloudinary_url"
    },
    "type": "general",
    "title": "Important Update",
    "message": "We have updated our terms of service",
    "priority": "medium",
    "actionUrl": "/terms",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server issues)

---

## 📝 Notes

1. **Session Cookies**: The API uses session cookies for authentication. Make sure to include `withCredentials: true` in your frontend requests.

2. **File Uploads**: Profile photos and tour package images are uploaded to Cloudinary. Use `multipart/form-data` content type for file uploads.

3. **Pagination**: Some endpoints support pagination with `limit` and `page` query parameters.

4. **Filtering**: Many GET endpoints support filtering via query parameters.

5. **Validation**: All endpoints include proper input validation and return descriptive error messages.

6. **Automatic Cleanup**: Images are automatically deleted from Cloudinary when users or tour packages are deleted.

7. **Notifications**: The system automatically creates notifications for important events like booking confirmations, query responses, etc.

8. **CORS**: The API is configured to accept requests from the frontend domains with proper CORS settings.