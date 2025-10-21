const express = require('express'),
      { body, validationResult } = require('express-validator'),
      bcrypt = require('bcrypt'),
      crypto = require('crypto'),
      { pool } = require('../database'),
      { getSessionStore } = require('../middleware/auth'),
      router = express.Router();


const sessions = getSessionStore();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours


router.post('/register', [
  body('name').isLength({ min: 1, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    
    // Check if user exists
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = Date.now();
    users.set(email, {
      id: userId,
      name,
      email,
      password_hash: passwordHash,
      created_at: new Date()
    });

    // Generate session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId,
      email,
      name,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };

    sessions.set(sessionToken, sessionData);

    res.json({
      success: true,
      sessionToken,
      email,
      name,
      expiresAt: sessionData.expiresAt
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    

    const { users } = require('../database');
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };

    sessions.set(sessionToken, sessionData);

    res.json({
      success: true,
      sessionToken,
      email: user.email,
      name: user.name,
      expiresAt: sessionData.expiresAt
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Session validation endpoint
router.post('/validate', [
  body('sessionToken').isLength({ min: 32, max: 64 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionToken } = req.body;
    const session = sessions.get(sessionToken);

    if (!session || Date.now() > session.expiresAt) {
      sessions.delete(sessionToken);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.json({
      valid: true,
      email: session.email,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});


router.post('/logout', [
  body('sessionToken').isLength({ min: 32, max: 64 })
], (req, res) => {
  try {
    const { sessionToken } = req.body;
    sessions.delete(sessionToken);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

module.exports = router;