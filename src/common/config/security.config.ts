export const SecurityConfig = {
  // Password settings
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 10, // bcrypt salt rounds
  },

  // JWT settings
  jwt: {
    accessTokenExpiry: '1h',
    refreshTokenExpiry: '7d',
  },

  // Rate limiting
  rateLimit: {
    ttl: 60000, // 60 seconds
    limit: 100, // 100 requests per minute
  },

  // Login attempts
  loginAttempts: {
    maxAttempts: 5,
    lockoutDuration: 900000, // 15 minutes in milliseconds
  },

  // Session settings
  session: {
    maxActiveSessions: 3, // Maximum concurrent sessions per user
  },

  // CORS
  cors: {
    allowedOrigins: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
};
