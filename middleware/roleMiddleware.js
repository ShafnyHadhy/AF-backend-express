// Middleware to check if user has admin role
export const verifyAdmin = (req, res, next) => {
    // req.user is set by the JWT auth middleware in index.js
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
};
