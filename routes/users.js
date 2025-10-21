const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// Get user profile
router.get('/profile/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;
    
    // Get session to find user
    const sessions = require('./auth').sessions || new Map();
    const session = sessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const [users] = await pool.execute(`
      SELECT id, name, email, created_at,
        (SELECT COUNT(*) FROM interviews WHERE user_id = ?) as total_interviews,
        (SELECT AVG(percentage) FROM interviews WHERE user_id = ?) as avg_score
      FROM users WHERE id = ?
    `, [session.userId, session.userId, session.userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get all users (admin)
router.get('/all', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.created_at,
        COUNT(i.id) as total_interviews,
        AVG(i.percentage) as avg_score
      FROM users u
      LEFT JOIN interviews i ON u.id = i.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user's detailed interview data
router.get('/interviews/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [interviews] = await pool.execute(`
      SELECT * FROM interviews 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ interviews });
  } catch (error) {
    console.error('Get user interviews error:', error);
    res.status(500).json({ error: 'Failed to get interviews' });
  }
});

module.exports = router;