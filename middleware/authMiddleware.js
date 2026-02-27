export const authenticate = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required! Please provide a valid token in the Authorization header."
        });
    }
    next();
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required! No valid token found in request headers." });
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden! You do not have permission to access this resource." });
        }
        next();
    };
};
