# AI Interview Platform

A modern AI-powered interview platform with Node.js backend and vanilla JavaScript frontend.

## Features

- **Secure Authentication**: Session-based auth with validation
- **AI-Powered Questions**: Dynamic question generation using OpenAI GPT-3.5
- **Voice Integration**: Speech recognition and text-to-speech
- **Performance Analytics**: Real-time scoring and detailed feedback
- **Rate Limiting**: API protection against abuse
- **Caching**: Efficient question caching for better performance

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

3. **Start Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Access Application**
   Open http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/validate` - Session validation

### Interview
- `POST /api/interview/question` - Generate AI questions
- `POST /api/interview/feedback` - Generate AI feedback
- `POST /api/interview/clear-cache` - Clear question cache

## Security Features

- Helmet.js for security headers
- Rate limiting (100 req/15min, 10 AI req/min)
- Input validation and sanitization
- CORS protection
- Session management

## Performance Optimizations

- Question caching (30min TTL)
- Compression middleware
- Efficient API design
- Minimal token usage

## Environment Variables

```
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```# Chayan-AI
# Chayan-AI
