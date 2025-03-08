export const authConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
  },
  jwt: {
    secret: import.meta.env.VITE_JWT_SECRET || 'MY-CHAT-Bot_service',
    expiresIn: '7d'
  }
};