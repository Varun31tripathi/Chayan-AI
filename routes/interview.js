const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Question cache for efficiency
const questionCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Fallback questions when OpenAI is not available
function getFallbackQuestion(type, role) {
  const questions = {
    "Frontend Developer": [
      "Tell me about yourself and your experience in frontend development.",
      "What's the difference between let, const, and var in JavaScript?",
      "How do you ensure your websites are responsive across different devices?",
      "Explain the concept of the DOM and how you manipulate it."
    ],
    "Backend Developer": [
      "Tell me about yourself and your backend development experience.",
      "How do you design RESTful APIs?",
      "Explain database normalization and when you'd use it.",
      "How do you handle authentication and authorization?"
    ],
    "Data Scientist": [
      "Tell me about yourself and your data science background.",
      "How do you approach a new data science project?",
      "Explain the difference between supervised and unsupervised learning.",
      "How do you handle missing data in your datasets?"
    ],
    "UI/UX Designer": [
      "Tell me about yourself and your design experience.",
      "How do you approach user research for a new project?",
      "What's your design process from concept to final product?",
      "How do you ensure accessibility in your designs?"
    ]
  };
  
  const roleQuestions = questions[role] || questions["Frontend Developer"];
  return roleQuestions[Math.floor(Math.random() * roleQuestions.length)];
}

// Generate AI question
router.post('/question', [
  body('type').isIn(['start', 'continue']),
  body('role').isLength({ min: 1, max: 50 }),
  body('previousResponse').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, role, previousResponse } = req.body;
    
    // If no OpenAI API key, use fallback questions
    if (!openai) {
      const question = getFallbackQuestion(type, role);
      return res.json({ question });
    }
    
    const cacheKey = `${type}-${role}-${previousResponse?.substring(0, 50)}`;
    
    // Check cache first
    const cached = questionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ question: cached.question });
    }

    let prompt;
    if (type === 'start') {
      prompt = `Generate a professional ${role} interview question. Make it engaging and role-specific. Keep it under 100 words.`;
    } else {
      prompt = `Based on this ${role} candidate response: "${previousResponse}", generate a relevant follow-up question. Keep it under 100 words.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    });

    const question = completion.choices[0]?.message?.content?.trim();
    
    if (!question) {
      throw new Error('No question generated');
    }

    // Cache the result
    questionCache.set(cacheKey, {
      question,
      timestamp: Date.now()
    });

    res.json({ question });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Generate AI feedback
router.post('/feedback', [
  body('role').isLength({ min: 1, max: 50 }),
  body('responses').isArray({ min: 1, max: 20 }),
  body('score').isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, responses, score } = req.body;
    
    // If no OpenAI API key, use fallback feedback
    if (!openai) {
      const feedback = `Based on your ${role} interview performance (${score}%), you demonstrated good communication skills. Continue practicing technical concepts and providing specific examples from your experience. Focus on explaining your thought process clearly and asking clarifying questions when needed.`;
      return res.json({ feedback });
    }
    
    const responseText = responses.join(' | ');
    
    const prompt = `Analyze this ${role} interview performance (Score: ${score}%):

Responses: ${responseText}

Provide concise feedback on:
1. Technical knowledge
2. Communication clarity  
3. Areas for improvement
4. Overall assessment

Keep response under 200 words.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.6
    });

    const feedback = completion.choices[0]?.message?.content?.trim();
    
    if (!feedback) {
      throw new Error('No feedback generated');
    }

    res.json({ feedback });
  } catch (error) {
    console.error('Feedback generation error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// Clear cache endpoint (for admin use)
router.post('/clear-cache', (req, res) => {
  questionCache.clear();
  res.json({ message: 'Cache cleared' });
});

module.exports = router;