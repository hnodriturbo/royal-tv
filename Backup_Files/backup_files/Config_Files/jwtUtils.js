/**
 * jwtUtils.js
 *
 * Utility functions for handling and validating JSON Web Tokens (JWTs).
 */

import jwt from 'jsonwebtoken';

// Secret key used for signing tokens (securely store this in environment variables)
const SECRET_KEY = process.env.JWT_SECRET || 'your-secure-secret';

/**
 * Sign a JWT with a payload.
 * @param {object} payload - Data to include in the JWT.
 * @returns {string} - Signed JWT.
 */
export function signToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Adjust expiry as needed
}

/**
 * validateToken
 *
 * Validates a JWT and checks if it matches the required role (if specified).
 *
 * @param {string} token - The JWT to validate.
 * @param {string|null} requiredRole - Optional. Role to validate (e.g., 'admin', 'user').
 * @returns {object|null} - Decoded token payload if valid, or null if invalid.
 * @throws {Error} - Throws an error for invalid or missing tokens.
 */
export function validateToken(token, requiredRole = null) {
  if (!token) {
    throw new Error('Unauthorized: Token is missing');
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Check if the required role matches
    if (requiredRole && decoded.role !== requiredRole) {
      throw new Error(
        `Unauthorized: Role mismatch. Required: ${requiredRole}, Found: ${decoded.role}`,
      );
    }

    return decoded; // Return the decoded payload if valid
  } catch (error) {
    console.error('Token validation error:', error.message);
    throw new Error('Invalid or expired token');
  }
}
