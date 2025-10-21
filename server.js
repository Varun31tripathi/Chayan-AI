const express = require('express'),
      cors = require('cors'),
      helmet = require('helmet'),
      rateLimit = require('express-rate-limit'),
      compression = require('compression'),
      cookieParser = require('cookie-parser'),
      xss = require('xss'),
      path = require('path'),
      { initDatabase } = require('./database'),
      interviewRoutes = require('./routes/interview'),
      authRoutes = require('./routes/auth'),
      evaluationRoutes = require('./routes/evaluation'),
      userRoutes = require('./routes/users'),
      { authenticateUser, authenticateAdmin } = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Stricter rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: 'AI request limit exceeded'
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// XSS Protection Middleware
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Simple CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: 'demo-token' });
});

// Routes and middleware imported at top

// Use routes with authentication
app.use('/api/interview', aiLimiter, authenticateUser, interviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/evaluation', authenticateUser, evaluationRoutes);
app.use('/api/users', authenticateAdmin, userRoutes);



// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});