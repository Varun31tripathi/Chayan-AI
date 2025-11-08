const { body, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value.trim());
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  next();
};

// Validation rules for interview endpoints
const validateStartInterview = [
  body('userId').optional().isString().isLength({ min: 1, max: 100 }),
  body('interviewType').optional().isIn(['technical', 'behavioral', 'mixed']),
  handleValidationErrors
];

const validateInterviewResponse = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Invalid session ID format'),
  
  body('userResponse')
    .notEmpty()
    .withMessage('User response is required')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Response must be between 1 and 5000 characters'),
  
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  
  handleValidationErrors
];

module.exports = {
  sanitizeInput,
  validateStartInterview,
  validateInterviewResponse,
  handleValidationErrors
};