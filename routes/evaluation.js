const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database');
const { getSessionStore } = require('../middleware/auth');
const router = express.Router();

const sessions = getSessionStore();

// Save interview evaluation
router.post('/save', [ // amazonq-ignore-line
  body('sessionToken').isLength({ min: 32, max: 64 }),
  body('role').isLength({ min: 1, max: 100 }),
  body('score').isInt({ min: 0, max: 1000 }),
  body('percentage').isInt({ min: 0, max: 100 }),
  body('grade').isLength({ min: 1, max: 50 }),
  body('maxLevel').isLength({ min: 1, max: 50 }),
  body('metrics').isObject()
], async (req, res) => {
  // CSRF protection is handled by server middleware
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionToken, role, score, percentage, grade, maxLevel, metrics, aiFeedback } = req.body;
    
    // Get session to find user
    const session = sessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Save evaluation to database
    await pool.execute(`
      INSERT INTO interviews (
        user_id, role, score, percentage, grade, max_level,
        technical_terms, skills_demo, experience_shared, detailed_responses, ai_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      session.userId,
      role,
      score,
      percentage,
      grade,
      maxLevel,
      metrics.technicalTerms || 0,
      metrics.skillsDemo || 0,
      metrics.experienceShared || 0,
      metrics.detailedResponses || 0,
      aiFeedback || null
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Save evaluation error:', error);
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
});

// Get user's interview history
router.get('/history/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;
    
    // Get session to find user
    const session = sessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const [interviews] = await pool.execute(`
      SELECT role, score, percentage, grade, max_level, created_at
      FROM interviews 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [session.userId]);

    res.json({ interviews });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;