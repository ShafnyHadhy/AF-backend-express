import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generates a signed JWT for testing purposes.
 * @param {string} userId - Mock user ID
 * @param {string} role - User role (customer, provider, admin, recycler)
 * @param {string} email - Mock email
 * @returns {string} Signed JWT
 */
export const generateTestToken = (userId = 'mock-user-id', role = 'customer', email = 'test@example.com') => {
    const payload = {
        userId,
        role,
        email
    };
    return jwt.sign(payload, process.env.JWT_SECRET_KEY || 'test_secret', { expiresIn: '1h' });
};
