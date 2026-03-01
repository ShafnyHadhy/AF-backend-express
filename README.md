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
cd AF-backend