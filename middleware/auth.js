import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Optional: Role-based middleware
export function isCustomer(req, res, next) {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Customer only.",
    });
  }
  next();
}

export function isProvider(req, res, next) {
  if (req.user.role !== "provider") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Provider only.",
    });
  }
  next();
}
