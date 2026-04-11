# Service Provider Management System – Backend API

## Overview

This repository contains the backend RESTful API for the Service Provider Management System developed for SE3040 – Application Frameworks.

The system is built using **Node.js (Express.js)** and **MongoDB (Mongoose)** and follows a structured REST architecture.

The backend currently supports:

- User authentication using JWT
- Role-based access control (Admin / Provider / Customer)
- User profile management (CRUD)
- Product management (CRUD)
- Provider profile management (CRUD)
- Request repairer/ recycler management (CRUD)
- Admin approval & rejection workflow
- Soft delete (deactivation & reactivation)
- Location-based provider discovery using geospatial queries

Backend development is approximately **80% complete** for Evaluation 01.

---

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (Authentication)
- bcrypt (Password Hashing)
- Postman (API Testing)

---

## Architecture

The backend follows a structured architecture:

Router → Controller → Model → MongoDB

Authentication middleware verifies JWT tokens and attaches decoded user data to `req.user`.

Protected routes enforce role-based access control.

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone https://github.com/ShafnyHadhy/AF-backend-express.git
cd AF-backend-express
```

## 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

## 3. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_email@example.com
```

## 4. Run the Application

Start the server using nodemon for development:

```bash
npm start
```

The server should now be running on `http://localhost:5001`.

---

# API Endpoint Documentation

The API includes endpoints for User management, Product lifecycle tracking, and Admin operations.

### User & Authentication
- `POST /api/users/register/step1` - User registration (Phase 1)
- `POST /api/users/verify-otp` - Verify registration OTP
- `POST /api/users/login` - User authentication
- `GET /api/users/profile` - Retrieve user profile (Protected)

### Product Management
- `GET /api/products` - List all products (Protected)
- `POST /api/products` - Add a new product (Protected)
- `GET /api/products/marketplace` - Explore products for sale

### Service Provider & Requests
- `GET /api/providers` - Get all service providers
- `POST /api/repairs` - Submit a repair request (Protected)
- `POST /api/recycling` - Submit a recycling request (Protected)

### Admin Operations
- `GET /api/admin/stats` - Access dashboard analytics (Admin Only)
- `GET /api/admin/users` - Manage system users (Admin Only)

---

# Deployment & Testing

For detailed deployment steps, see the **[Deployment Report](../../DEPLOYMENT_REPORT.md)**.
For testing instructions, see the **[Testing Instruction Report](../../TESTING_REPORT.md)**.