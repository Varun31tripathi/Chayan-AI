const { pool } = require('../database');

// Session store (use Redis in production)
const sessions = new Map();

// Authentication middleware
async function authenticateUser(req, res, next) {
  try {
    const sessionToken = req.headers['x-session-token'] || req.body.sessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = sessions.get(sessionToken);
    if (!session || Date.now() > session.expiresAt) {
      sessions.delete(sessionToken);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = {
      id: session.userId,
      email: session.email,
      name: session.name
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const adminAccess = req.headers['x-admin-token'];
  
  if (adminAccess !== 'admin-authenticated') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Get session store for auth routes
function getSessionStore() {
  return sessions;
}

module.exports = { authenticateUser, authenticateAdmin, getSessionStore };