// Security utility functions

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate input length and content
 */
export function validateInput(input, maxLength = 5000, pattern = null) {
    if (!input || typeof input !== 'string') {
        return { valid: false, error: 'Input is required' };
    }
    
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { valid: false, error: 'Input cannot be empty' };
    }
    
    if (trimmed.length > maxLength) {
        return { valid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
    }
    
    if (pattern && !pattern.test(trimmed)) {
        return { valid: false, error: 'Input contains invalid characters' };
    }
    
    return { valid: true, sanitized: sanitizeInput(trimmed) };
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId) {
    const pattern = /^[a-zA-Z0-9]{10,50}$/;
    return validateInput(sessionId, 50, pattern);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken && storedToken === token;
}

/**
 * Enhanced API request validation
 */
export function validateApiRequest(data, endpoint) {
    const errors = [];
    
    switch (endpoint) {
        case 'interview-response':
            const sessionValidation = validateSessionId(data.sessionId);
            if (!sessionValidation.valid) {
                errors.push(`Session ID: ${sessionValidation.error}`);
            }
            
            const responseValidation = validateInput(data.userResponse, 5000);
            if (!responseValidation.valid) {
                errors.push(`Response: ${responseValidation.error}`);
            }
            
            const questionValidation = validateInput(data.question, 1000);
            if (!questionValidation.valid) {
                errors.push(`Question: ${questionValidation.error}`);
            }
            break;
            
        case 'start-interview':
            if (data.userId) {
                const userIdValidation = validateInput(data.userId, 100, /^[a-zA-Z0-9_-]+$/);
                if (!userIdValidation.valid) {
                    errors.push(`User ID: ${userIdValidation.error}`);
                }
            }
            break;
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        sanitizedData: sanitizeApiData(data)
    };
}

/**
 * Sanitize API request data
 */
function sanitizeApiData(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Rate limiting for API calls
 */
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    isAllowed(identifier) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }
        
        const userRequests = this.requests.get(identifier);
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => time > windowStart);
        this.requests.set(identifier, validRequests);
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        return true;
    }
}

export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes

/**
 * Secure session management
 */
export class SecureSession {
    static setItem(key, value, expirationMs = 3600000) { // 1 hour default
        const item = {
            value: value,
            expiry: Date.now() + expirationMs,
            timestamp: Date.now()
        };
        sessionStorage.setItem(key, JSON.stringify(item));
    }
    
    static getItem(key) {
        const itemStr = sessionStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                sessionStorage.removeItem(key);
                return null;
            }
            return item.value;
        } catch (e) {
            sessionStorage.removeItem(key);
            return null;
        }
    }
    
    static removeItem(key) {
        sessionStorage.removeItem(key);
    }
    
    static clear() {
        sessionStorage.clear();
    }
}