const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool, users, interviews } = require('../database');
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

    // Save evaluation to in-memory storage
    const interviewId = Date.now();
    interviews.set(interviewId, {
      id: interviewId,
      user_id: session.userId,
      role,
      score,
      percentage,
      grade,
      max_level: maxLevel,
      technical_terms: metrics.technicalTerms || 0,
      skills_demo: metrics.skillsDemo || 0,
      experience_shared: metrics.experienceShared || 0,
      detailed_responses: metrics.detailedResponses || 0,
      ai_feedback: aiFeedback || null,
      created_at: new Date()
    });

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

    const userInterviews = Array.from(interviews.values())
      .filter(interview => interview.user_id === session.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(({ role, score, percentage, grade, max_level, created_at }) => ({
        role, score, percentage, grade, max_level, created_at
      }));

    res.json({ interviews: userInterviews });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;