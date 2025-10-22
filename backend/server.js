const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.post('/api/start-interview', (req, res) => {
  const sessionId = Date.now().toString();
  res.json({ sessionId });
});

app.post('/api/interview-response', async (req, res) => {
  const { sessionId, userResponse, question } = req.body;
  
  // Simple AI evaluation (replace with actual AI service)
  const evaluation = {
    score: Math.floor(Math.random() * 40) + 60, // 60-100 score
    feedback: generateFeedback(userResponse),
    skills: evaluateSkills(userResponse, question)
  };
  
  res.json({ evaluation });
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