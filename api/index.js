const express = require('express'),
      cors = require('cors'),
      helmet = require('helmet'),
      rateLimit = require('express-rate-limit'),
      compression = require('compression'),
      cookieParser = require('cookie-parser'),
      xss = require('xss'),
      path = require('path'),
      { initDatabase } = require('../database'),
      interviewRoutes = require('../routes/interview'),
      authRoutes = require('../routes/auth'),
      evaluationRoutes = require('../routes/evaluation'),
      userRoutes = require('../routes/users'),
      { authenticateUser, authenticateAdmin } = require('../middleware/auth');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

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

app.use(express.static(path.join(__dirname, '..')));

app.use('/api/interview', authenticateUser, interviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/evaluation', authenticateUser, evaluationRoutes);
app.use('/api/users', authenticateAdmin, userRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

initDatabase();

module.exports = app;