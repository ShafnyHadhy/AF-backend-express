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

---

# Setup Instructions (Step-by-Step)

## 1. Environment Requirements
- **Node.js**: Version 18.0.0 or higher.
- **MongoDB**: A local instance or a MongoDB Atlas connection string.
- **SendGrid**: An API key for automated email delivery (OTP).

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
   PORT=5001
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET_KEY=your_secured_jwt_secret
   SENDGRID_API_KEY=your_sendgrid_key
   EMAIL_FROM=verified_sender@example.com
   ```

4. **Database Seeding (Optional)**:
   To populate the system with initial seed data:
   ```bash
   npm run seed
   ```

5. **Start the Server**:
   ```bash
   # Development mode with nodemon
   npm start
   ```
   The API will be live at `http://localhost:5001`.

---

# API Endpoint Documentation

## 1. Authentication

### **User Login**
- **Method**: `POST`
- **Endpoint**: `/api/users/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": { "id": "60d...", "role": "customer", "email": "user@example.com" }
  }
  ```

---

## 2. Product Management

### **Add New Product**
- **Method**: `POST`
- **Endpoint**: `/api/products`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "Sony PlayStation 5",
    "category": "Gaming",
    "description": "Used PS5 in good condition",
    "purchaseDate": "2023-01-15"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "data": { "_id": "70d...", "name": "Sony PlayStation 5", "status": "Active" }
  }
  ```

---

## 3. Repairs & Recycling (Member 4)

### **Create Repair Request**
- **Method**: `POST`
- **Endpoint**: `/api/repairs`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "productName": "iPhone 13",
    "category": "Mobiles",
    "description": "Screen replacement needed",
    "provider": "60d...provider_id",
    "location": "Colombo"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "_id": "80d...",
    "status": "Pending",
    "lifecycle": [{ "status": "Pending", "note": "Request created" }]
  }
  ```

### **Admin Dashboard Stats**
- **Method**: `GET`
- **Endpoint**: `/api/admin/stats`
- **Auth Required**: Yes (Admin Only)
- **Success Response (200)**:
  ```json
  {
    "kpis": { "totalRepairs": 45, "totalRecycling": 12 },
    "trendData": [{ "name": "Jan", "repairs": 5, "recycling": 2 }]
  }
  ```

---

## 4. Reports (Member 4)

### **Generate Full Report**
- **Method**: `GET`
- **Endpoint**: `/api/admin/report`
- **Parameters**: `startDate`, `endDate`, `category`
- **Success Response (200)**:
  ```json
  {
    "list": [...],
    "charts": {
        "barChart": [{ "name": "Repairs", "count": 10 }],
        "pieChartRepairs": [{ "name": "Pending", "value": 4 }]
    }
  }
  ```

---

# Testing & Deployment

- **Full Testing Guide**: See [TESTING_REPORT.md](../../TESTING_REPORT.md)
- **Deployment Instructions**: See [DEPLOYMENT_REPORT.md](../../DEPLOYMENT_REPORT.md)