import jwt from "jsonwebtoken";

// ==================== MAIN AUTHENTICATION MIDDLEWARE ====================
// This verifies the token
export function authenticate(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }
    res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }
}

// ==================== ROLE-SPECIFIC MIDDLEWARE ====================

// Check if user is CUSTOMER only
export function isCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This route is for customers only.",
    });
  }
  next();
}

// Check if user is PROVIDER only
export function isProvider(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "provider") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This route is for providers only.",
    });
  }
  next();
}

// Check if user is RECYCLER only (NEW)
export function isRecycler(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "recycler") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This route is for recyclers only.",
    });
  }
  next();
}

// Check if user is ADMIN only (NEW)
export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
}

// ==================== COMBINATION MIDDLEWARE ====================

// Check if user is either CUSTOMER or PROVIDER
export function isCustomerOrProvider(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "customer" && req.user.role !== "provider") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This route is for customers and providers only.",
    });
  }
  next();
}

// Check if user is either PROVIDER or RECYCLER
export function isProviderOrRecycler(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "provider" && req.user.role !== "recycler") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This route is for providers and recyclers only.",
    });
  }
  next();
}

// Check if user is ADMIN or the OWNER of the resource (by userId param)
export function isAdminOrOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const resourceUserId = req.params.userId || req.params.id;

  if (req.user.role === "admin" || req.user.userId === resourceUserId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    });
  }
}

// ==================== PERMISSION-BASED MIDDLEWARE ====================

// Check for admin only
export function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  };
}

// ==================== OPTIONAL AUTH (doesn't require login) ==================
export function optionalAuth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded;
    } catch (error) {
      console.log("Optional auth: Invalid token");
    }
  }
  next();
}
