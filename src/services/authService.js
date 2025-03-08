import { authConfig } from '../config/auth.config';
import { storeUser, generateToken, verifyToken } from './userService';

// Initialize Google OAuth client directly with credentials
const googleOAuth2Client = {
  generateAuthUrl: () => {
    const params = new URLSearchParams({
      client_id: authConfig.google.clientId,
      redirect_uri: authConfig.google.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ')
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  getToken: async (code) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: authConfig.google.clientId,
          client_secret: authConfig.google.clientSecret,
          redirect_uri: authConfig.google.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      return { tokens: await tokenResponse.json() };
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        throw new Error('Authentication request timed out. Please try again.');
      }
      throw error;
    }
  },
};

// Get Google OAuth URL
export const getGoogleAuthUrl = () => {
  return googleOAuth2Client.generateAuthUrl();
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (code) => {
  try {
    // Exchange authorization code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);

    // Get user info from Google
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const userData = await userInfoResponse.json();

    // Store user data and generate JWT
    storeUser({
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      accessToken: tokens.access_token
    });

    // Generate and return JWT token
    const jwtToken = await generateToken(userData.email);
    return { success: true, token: jwtToken };

  } catch (error) {
    console.error('Google authentication error:', error);
    return { success: false, error: error.message };
  }
};

// Middleware to protect routes
export const requireAuth = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const user = await verifyToken(token);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};