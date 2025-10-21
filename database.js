// In-memory storage for deployment (replace with proper DB in production)
const users = new Map();
const interviews = new Map();
let userIdCounter = 1;
let interviewIdCounter = 1;

// Mock pool for compatibility
const pool = {
  execute: async (query, params = []) => {
    // Simple mock implementation
    return [[], {}];
  }
};

// Initialize in-memory storage
async function initDatabase() {
  try {
    // Add demo user
    users.set('demo@test.com', {
      id: 1,
      email: 'demo@test.com',
      name: 'Demo User',
      password_hash: '$2b$10$demo.hash.for.demo123',
      created_at: new Date()
    });
    console.log('In-memory database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

module.exports = { pool, initDatabase, users, interviews };