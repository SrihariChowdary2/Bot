import { authConfig } from '../config/auth.config';
import * as jose from 'jose';

// In-memory storage for development. In production, use a secure database.
const users = new Map();

// Store user data securely
export const storeUser = (userData) => {
  const { email, name, picture, accessToken } = userData;
  users.set(email, {
    email,
    name,
    picture,
    accessToken,
    createdAt: new Date().toISOString()
  });
};

// Get user by email
export const getUserByEmail = (email) => {
  return users.get(email) || null;
};

// Get all users (admin only)
export const getAllUsers = () => {
  return Array.from(users.values());
};

// Remove user
export const removeUser = (email) => {
  users.delete(email);
};

// Verify JWT token
export const verifyToken = async (token) => {
  try {
    const secret = new TextEncoder().encode(authConfig.jwt.secret);
    const { payload } = await jose.jwtVerify(token, secret);
    return getUserByEmail(payload.email);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Generate JWT token
export const generateToken = async (email) => {
  const secret = new TextEncoder().encode(authConfig.jwt.secret);
  const jwt = await new jose.SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(authConfig.jwt.expiresIn)
    .sign(secret);
  return jwt;
};