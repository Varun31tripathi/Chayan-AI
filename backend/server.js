const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sanitizeInput, validateStartInterview, validateInterviewResponse } = require('./validation');
const securityConfig = require('./security-config');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet(securityConfig.helmetConfig));

// Rate limiting
app.use(securityConfig.rateLimits.general);

// API-specific rate limiting
app.use('/api/', securityConfig.rateLimits.api);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply input sanitization to all routes
app.use(sanitizeInput);

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.post('/api/start-interview', securityConfig.rateLimits.auth, validateStartInterview, (req, res) => {
  try {
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/interview-response', validateInterviewResponse, async (req, res) => {
  try {
    const { sessionId, userResponse, question } = req.body;
    
    // Additional server-side validation
    if (!sessionId || !userResponse || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Simple AI evaluation (replace with actual AI service)
    const evaluation = {
      score: Math.floor(Math.random() * 40) + 60, // 60-100 score
      feedback: generateFeedback(userResponse),
      skills: evaluateSkills(userResponse, question)
    };
    
    res.json({ evaluation });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateFeedback(response) {
  const length = response.length;
  if (length < 50) return "Try to provide more detailed answers";
  if (length > 500) return "Good detailed response, well structured";
  return "Good response, consider adding more examples";
}

function evaluateSkills(response, question) {
  return {
    communication: Math.floor(Math.random() * 40) + 60,
    technical: Math.floor(Math.random() * 40) + 60,
    problemSolving: Math.floor(Math.random() * 40) + 60
  };
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});