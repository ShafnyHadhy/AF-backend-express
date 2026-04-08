// middleware/errorHandler.js

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  console.error("Error stack:", err.stack); // Debugging සඳහා

  // ✅ 1. AppError - මෙය පළමුව check කරන්න (වැදගත්!)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ✅ 2. MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists. Please use another ${field}.`,
    });
  }

  // ✅ 3. Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors,
    });
  }

  // ✅ 4. JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }

  // ✅ 5. Token expired error
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your token has expired. Please login again.",
    });
  }

  // ✅ 6. MongoDB Cast error (invalid ID format)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ✅ 7. Unknown errors - production vs development
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }

  // Development environment - full error details
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,
    name: err.name,
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
};
