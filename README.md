# Service Provider Management System – Backend API

## Project Overview

This repository contains the backend RESTful API for the Service Provider Management System developed for **SE3040 – Application Frameworks**. The system supports a circular economy for electronic products through repairs, recycling, and marketplace features.

---

## Technical Architecture

The backend follows the **Model-View-Controller (MVC)** architectural pattern:
- **Router**: Defines API routes and handles middleware (Auth, Validation).
- **Controller**: Contains business logic and processes requests.
- **Model**: Mongoose schemas for MongoDB data persistence.
- **Middleware**: Custom handlers for JWT verification and role-based access.

**Technology Stack**:
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: SendGrid
- **Testing**: Jest, Supertest, Artillery
- **Module System**: ESM (ES Modules)

---

# Setup Instructions (Step-by-Step)

## 1. Environment Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas connection string
- **SendGrid API Key**: For OTP and email notifications
- **Google Maps API Key**: For location services (optional, for frontend)

## 2. Local Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ShafnyHadhy/AF-backend-express.git
   cd AF-backend-express
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   
   # JWT Configuration
   JWT_SECRET_KEY=your_long_secured_jwt_secret_key_min_32_chars
   
   # Email Service (SendGrid)
   SENDGRID_API_KEY=SG.your_sendgrid_api_key
   EMAIL_FROM=noreply@circulareconomy.com
   
   # Optional: Google Maps API (for frontend location services)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Database Setup**:
   - Ensure MongoDB is running locally or you have a valid MongoDB Atlas connection string
   - The database will be automatically created on first connection

5. **Database Seeding (Optional)**:
   To populate the system with initial seed data:
   ```bash
   npm run seed
   ```

6. **Start the Server**:
   ```bash
   # Development mode with auto-reload (nodemon)
   npm start
   
   # Or run directly
   npm run dev
   ```
   The API will be live at `http://localhost:5000`.

## 3. Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/providerController.test.js

# Run with coverage
npm test -- --coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## 4. Performance Testing

```bash
# Run Artillery load test (backend must be running)
npm run performance
# or
npx artillery run artillery.yml
```

---

# API Endpoint Documentation

## Authentication & Authorization

All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

**User Roles**:
- `customer`: Regular users who create repair/recycle requests
- `provider`: Service providers managing repairs
- `recycler`: Recycling service providers
- `admin`: System administrators with full access

---

## 1. User Management Endpoints

### **Register New User**
- **Method**: `POST`
- **Endpoint**: `/api/users/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "phoneNumber": "0771234567",
    "role": "customer"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "userId": "507f1f77bcf86cd799439011"
  }
  ```

### **Login User**
- **Method**: `POST`
- **Endpoint**: `/api/users/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "role": "customer",
      "firstName": "John"
    }
  }
  ```

### **Send OTP**
- **Method**: `POST`
- **Endpoint**: `/api/users/send-otp`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to email"
  }
  ```

### **Verify OTP & Update Password**
- **Method**: `POST`
- **Endpoint**: `/api/users/verify-otp`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "otp": "123456",
    "newPassword": "NewPass456!"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```

### **Get User Profile**
- **Method**: `GET`
- **Endpoint**: `/api/users/profile`
- **Auth Required**: Yes
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "0771234567",
      "role": "customer"
    }
  }
  ```

### **Update User Profile**
- **Method**: `PUT`
- **Endpoint**: `/api/users/profile`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "firstName": "Johnny",
    "lastName": "Doe",
    "phoneNumber": "0771234568"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "user": {
      "firstName": "Johnny",
      "lastName": "Doe",
      "phoneNumber": "0771234568"
    }
  }
  ```

---

## 2. Provider Profile Management Endpoints

### **Create Provider Profile**
- **Method**: `POST`
- **Endpoint**: `/api/providers`
- **Auth Required**: Yes (User must have provider role)
- **Request Body**:
  ```json
  {
    "businessName": "Tech Repair Center",
    "providerType": "repair_center",
    "categories": ["Phone", "Laptop"],
    "phone": "0771234567",
    "email": "repair@techcenter.com",
    "addressLine": "123 Main Street, Colombo",
    "location": {
      "type": "Point",
      "coordinates": [80.2, 6.9]
    },
    "serviceRadiusKm": 15,
    "description": "Professional repair services"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439012",
    "businessName": "Tech Repair Center",
    "status": "Pending",
    "approvalStatus": "pending"
  }
  ```

### **Get My Provider Profiles**
- **Method**: `GET`
- **Endpoint**: `/api/providers/me`
- **Auth Required**: Yes
- **Query Parameters**: Optional pagination
  - `limit`: Items per page (default: 10)
  - `page`: Page number (default: 1)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "profiles": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "businessName": "Tech Repair Center",
        "providerType": "repair_center",
        "approvalStatus": "approved"
      }
    ]
  }
  ```

### **Update Provider Profile**
- **Method**: `PUT`
- **Endpoint**: `/api/providers/me`
- **Auth Required**: Yes
- **Request Body**: Same fields as Create
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully"
  }
  ```

### **Get Nearby Providers**
- **Method**: `GET`
- **Endpoint**: `/api/providers/nearby`
- **Auth Required**: No
- **Query Parameters**:
  - `lat`: Latitude (required)
  - `lng`: Longitude (required)
  - `radius`: Search radius in km (default: 10)
  - `type`: Provider type filter (optional)
  - `category`: Service category filter (optional)
- **Example**: `/api/providers/nearby?lat=6.9&lng=80.2&radius=10&type=repair_center`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "providers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "businessName": "Tech Repair Center",
        "providerType": "repair_center",
        "categories": ["Phone", "Laptop"],
        "distance": 2.5,
        "location": {
          "coordinates": [80.2, 6.9]
        }
      }
    ]
  }
  ```

### **Approve Provider Profile (Admin Only)**
- **Method**: `PATCH`
- **Endpoint**: `/api/providers/:id/approve`
- **Auth Required**: Yes (Admin only)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Provider approved",
    "approvalStatus": "approved"
  }
  ```

### **Reject Provider Profile (Admin Only)**
- **Method**: `PATCH`
- **Endpoint**: `/api/providers/:id/reject`
- **Auth Required**: Yes (Admin only)
- **Request Body**:
  ```json
  {
    "reason": "Documents not valid"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Provider rejected",
    "approvalStatus": "rejected"
  }
  ```

### **Deactivate Provider Profile**
- **Method**: `PATCH`
- **Endpoint**: `/api/providers/me/deactivate`
- **Auth Required**: Yes (Provider owner)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Profile deactivated",
    "active": false
  }
  ```

### **Restore Provider Profile**
- **Method**: `PATCH`
- **Endpoint**: `/api/providers/me/restore`
- **Auth Required**: Yes (Provider owner)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Profile restored",
    "active": true
  }
  ```

---

## 3. Repair Request Endpoints

### **Create Repair Request**
- **Method**: `POST`
- **Endpoint**: `/api/repairs`
- **Auth Required**: Yes (Customer)
- **Request Body**:
  ```json
  {
    "productName": "iPhone 13",
    "category": "Mobiles",
    "description": "Screen cracked, needs replacement",
    "quantity": 1,
    "image": "base64_encoded_image_or_url",
    "location": {
      "type": "Point",
      "coordinates": [80.2, 6.9]
    },
    "provider": "507f1f77bcf86cd799439012"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439013",
    "productName": "iPhone 13",
    "status": "Pending",
    "user": "507f1f77bcf86cd799439011",
    "provider": "507f1f77bcf86cd799439012",
    "lifecycle": [
      {
        "status": "Pending",
        "note": "Request created",
        "timestamp": "2026-04-11T10:00:00Z"
      }
    ]
  }
  ```

### **Get All Repair Requests (Role-based)**
- **Method**: `GET`
- **Endpoint**: `/api/repairs`
- **Auth Required**: Yes
- **Query Parameters**:
  - `status`: Filter by status (e.g., Pending, Accepted, Completed)
  - `category`: Filter by category
  - `provider`: Filter by provider ID
  - `search`: Search by product name or description
- **Response varies by role**:
  - Customer: sees only their own requests
  - Provider: sees requests assigned to them
  - Admin: sees all requests
- **Success Response (200)**:
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439013",
      "productName": "iPhone 13",
      "status": "Accepted",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "email": "john@example.com"
      },
      "provider": {
        "_id": "507f1f77bcf86cd799439012",
        "businessName": "Tech Repair"
      }
    }
  ]
  ```

### **Get Repair Request by ID**
- **Method**: `GET`
- **Endpoint**: `/api/repairs/:id`
- **Auth Required**: Yes
- **Success Response (200)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439013",
    "productName": "iPhone 13",
    "category": "Mobiles",
    "description": "Screen cracked",
    "status": "Accepted",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "email": "john@example.com"
    },
    "provider": {
      "_id": "507f1f77bcf86cd799439012",
      "businessName": "Tech Repair"
    },
    "lifecycle": [
      {
        "status": "Pending",
        "note": "Request created"
      },
      {
        "status": "Accepted",
        "note": "Provider accepted request"
      }
    ]
  }
  ```

### **Update Repair Status**
- **Method**: `PATCH`
- **Endpoint**: `/api/repairs/:id/status`
- **Auth Required**: Yes (Provider or Admin)
- **Request Body**:
  ```json
  {
    "status": "Completed",
    "note": "Repair completed successfully",
    "pickupDate": "2026-04-15T10:00:00Z"
  }
  ```
- **Allowed Status Transitions**: Pending → Accepted → In Progress → Completed
- **Success Response (200)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439013",
    "status": "Completed",
    "lifecycle": [
      {
        "status": "Pending",
        "note": "Request created"
      },
      {
        "status": "Completed",
        "note": "Repair completed successfully"
      }
    ]
  }
  ```

### **Delete Repair Request**
- **Method**: `DELETE`
- **Endpoint**: `/api/repairs/:id`
- **Auth Required**: Yes (Request owner or Admin)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Repair request deleted successfully"
  }
  ```

---

## 4. Recycling Request Endpoints

### **Create Recycle Request**
- **Method**: `POST`
- **Endpoint**: `/api/recycling`
- **Auth Required**: Yes (Customer)
- **Request Body**:
  ```json
  {
    "productName": "Old Laptop",
    "category": "Electronics",
    "description": "Non-functional laptop, wants to recycle",
    "quantity": 1,
    "image": "base64_encoded_image_or_url",
    "location": {
      "type": "Point",
      "coordinates": [80.2, 6.9]
    },
    "provider": "507f1f77bcf86cd799439012"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439014",
    "productName": "Old Laptop",
    "status": "Pending",
    "user": "507f1f77bcf86cd799439011",
    "provider": "507f1f77bcf86cd799439012",
    "lifecycle": [
      {
        "status": "Pending",
        "note": "Request created"
      }
    ]
  }
  ```

### **Get All Recycle Requests (Role-based)**
- **Method**: `GET`
- **Endpoint**: `/api/recycling`
- **Auth Required**: Yes
- **Query Parameters**: Same as Repair Requests
- **Success Response (200)**:
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439014",
      "productName": "Old Laptop",
      "status": "Accepted",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John"
      }
    }
  ]
  ```

### **Get Recycle Request by ID**
- **Method**: `GET`
- **Endpoint**: `/api/recycling/:id`
- **Auth Required**: Yes
- **Success Response (200)**: Similar structure to Repair Request

### **Update Recycle Status**
- **Method**: `PATCH`
- **Endpoint**: `/api/recycling/:id/status`
- **Auth Required**: Yes (Recycler or Admin)
- **Request Body**:
  ```json
  {
    "status": "Recycled",
    "note": "Item processed and recycled",
    "pickupDate": "2026-04-12T10:00:00Z"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "_id": "507f1f77bcf86cd799439014",
    "status": "Recycled",
    "lifecycle": [...]
  }
  ```

### **Delete Recycle Request**
- **Method**: `DELETE`
- **Endpoint**: `/api/recycling/:id`
- **Auth Required**: Yes (Request owner or Admin)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Recycling request deleted successfully"
  }
  ```

---

## 5. Admin & Reporting Endpoints

### **Get Dashboard Statistics**
- **Method**: `GET`
- **Endpoint**: `/api/admin/stats`
- **Auth Required**: Yes (Admin only)
- **Success Response (200)**:
  ```json
  {
    "kpis": {
      "totalRepairs": 45,
      "totalRecycling": 12,
      "completedRepairs": 30,
      "completedRecycling": 8
    },
    "trendData": [
      {
        "name": "Jan",
        "repairs": 5,
        "recycling": 2
      },
      {
        "name": "Feb",
        "repairs": 8,
        "recycling": 3
      }
    ]
  }
  ```

### **Generate Full Report**
- **Method**: `GET`
- **Endpoint**: `/api/admin/report`
- **Auth Required**: Yes (Admin only)
- **Query Parameters**:
  - `startDate`: Date in YYYY-MM-DD format (optional)
  - `endDate`: Date in YYYY-MM-DD format (optional)
  - `category`: Filter by category (optional)
  - `repairStatus`: Filter repair status (optional)
  - `recycleStatus`: Filter recycle status (optional)
  - `providerId`: Filter by provider (optional)
- **Example**: `/api/admin/report?startDate=2026-01-01&endDate=2026-12-31&category=Mobiles`
- **Success Response (200)**:
  ```json
  {
    "list": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "productName": "iPhone 13",
        "type": "Repair",
        "status": "Completed",
        "createdAt": "2026-04-01T10:00:00Z"
      }
    ],
    "charts": {
      "barChart": [
        {
          "name": "Repairs",
          "count": 30
        },
        {
          "name": "Recycling",
          "count": 8
        }
      ],
      "pieChartRepairs": [
        {
          "name": "Completed",
          "value": 30
        },
        {
          "name": "Pending",
          "value": 15
        }
      ],
      "pieChartRecycling": [
        {
          "name": "Recycled",
          "value": 8
        },
        {
          "name": "Pending",
          "value": 4
        }
      ],
      "lineChart": [
        {
          "name": "Jan 2026",
          "repairs": 5,
          "recycling": 2
        },
        {
          "name": "Feb 2026",
          "repairs": 8,
          "recycling": 3
        }
      ]
    }
  }
  ```

### **Get All Users (Admin Only)**
- **Method**: `GET`
- **Endpoint**: `/api/admin/users`
- **Auth Required**: Yes (Admin only)
- **Success Response (200)**:
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "email": "john@example.com",
      "role": "customer",
      "isBlocked": false
    }
  ]
  ```

### **Update User Role (Admin Only)**
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/:id/role`
- **Auth Required**: Yes (Admin only)
- **Request Body**:
  ```json
  {
    "role": "provider"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "User role updated",
    "user": {
      "role": "provider"
    }
  }
  ```

### **Block/Unblock User (Admin Only)**
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/:id/block`
- **Auth Required**: Yes (Admin only)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "User blocked status updated",
    "isBlocked": true
  }
  ```

---

## Error Responses

All endpoints may return error responses in the following format:

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid provider ID"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Request not found"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details here"
}
```

---

# API Endpoint Documentation