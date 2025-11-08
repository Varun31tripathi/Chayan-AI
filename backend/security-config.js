const rateLimit = require('express-rate-limit');

// Enhanced security configurations
const securityConfig = {
  // Rate limiting configurations
  rateLimits: {
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    }),
    
    auth: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: { error: 'Too many authentication attempts, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    }),
    
    api: rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 20,
      message: { error: 'API rate limit exceeded, please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    })
  },

  // Input validation patterns
  patterns: {
    sessionId: /^[a-zA-Z0-9]{10,50}$/,
    alphanumeric: /^[a-zA-Z0-9\s]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    safeText: /^[a-zA-Z0-9\s.,!?'-]+$/
  },

  // Content length limits
  limits: {
    userResponse: 5000,
    question: 1000,
    sessionId: 50,
    generalText: 500
  },

  // Helmet security headers configuration
  helmetConfig: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }
};

module.exports = securityConfig;