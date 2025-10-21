document.addEventListener("DOMContentLoaded", () => {
try {
  const landing = document.getElementById("landing");
  const loginModal = document.getElementById("loginModal");
  const closeModal = document.getElementById("closeModal");
  const home = document.getElementById("home");
  const roleSelection = document.getElementById("roleSelection");
  const preparation = document.getElementById("preparation");
  const interview = document.getElementById("interview");
  const summary = document.getElementById("summary");

  const getStartedBtn = document.getElementById("getStartedBtn");
  const loginNavBtn = document.getElementById("loginNavBtn");
  const signupNavBtn = document.getElementById("signupNavBtn");
  const adminNavBtn = document.getElementById("adminNavBtn");
  const loginBtn = document.getElementById("loginBtn");
  const adminModal = document.getElementById("adminModal");
  const closeAdminModal = document.getElementById("closeAdminModal");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const selectRoleBtn = document.getElementById("selectRoleBtn");
  const backToHomeBtn = document.getElementById("backToHomeBtn");
  const startInterviewBtn = document.getElementById("startInterviewBtn");
  const backToRoleBtn = document.getElementById("backToRoleBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const homeBtn = document.getElementById("homeBtn");

  const chatBox = document.getElementById("chatBox");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const progress = document.getElementById("progress");
} catch (error) {
  console.error('DOM initialization error:', error);
}

let voiceEnabled = true;

let recognition = null;
let isRecording = false;
let speechSynthesis = window.speechSynthesis;
let aiVoice = null;

// Camera recording variables
let mediaRecorder = null;
let videoStream = null;
let isVideoRecording = false;
let recordedChunks = [];

// Initialize AI voice - prefer Sage-like voices
if (speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();
    // Look for professional, clear voices similar to OpenAI Sage
    aiVoice = voices.find(voice => 
      voice.name.includes('Daniel') || 
      voice.name.includes('Alex') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Google US English') ||
      voice.name.includes('Microsoft David')
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
  };
}

// API Configuration
const API_BASE_URL = window.location.origin + '/api';
let csrfToken = null;

// Get CSRF token on page load
async function getCSRFToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`);
    const data = await response.json();
    csrfToken = data.csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }
}

// Initialize CSRF token
getCSRFToken();

// Create demo account for testing
const demoAccounts = JSON.parse(localStorage.getItem('demoAccounts') || '{}');
if (!demoAccounts['demo@test.com']) {
  demoAccounts['demo@test.com'] = {
    name: 'Demo User',
    password: 'demo123',
    created: Date.now()
  };
  localStorage.setItem('demoAccounts', JSON.stringify(demoAccounts));
}

let progressValue = 10;
let currentRole = "";
let questionIndex = 0;
let userResponses = [];
let interviewScore = 0;
let currentDifficulty = "basic";
let difficultyScores = { basic: 0, intermediate: 0, advanced: 0 };
let qualityMetrics = {
  totalWords: 0,
  technicalTerms: 0,
  detailedResponses: 0,
  skillsDemo: 0,
  experienceShared: 0
};

// Timer variables
let interviewStartTime = null;
let timerInterval = null;

// Questions are now fetched from API only

// Role-specific evaluation criteria
const evaluationCriteria = {
  "Frontend Developer": {
    technical: ["html", "css", "javascript", "react", "vue", "angular", "performance", "responsive"],
    skills: ["problem-solving", "debugging", "optimization", "user experience"],
    experience: ["project", "team", "collaboration", "git", "testing"]
  },
  "Backend Developer": {
    technical: ["api", "database", "server", "security", "scalability", "microservices"],
    skills: ["architecture", "performance", "monitoring", "debugging"],
    experience: ["deployment", "cloud", "devops", "team", "project"]
  },
  "Data Scientist": {
    technical: ["python", "r", "machine learning", "statistics", "model", "algorithm"],
    skills: ["analysis", "visualization", "experimentation", "validation"],
    experience: ["project", "business", "stakeholder", "deployment", "monitoring"]
  },
  "UI/UX Designer": {
    technical: ["figma", "sketch", "prototype", "wireframe", "design system"],
    skills: ["user research", "usability", "accessibility", "testing"],
    experience: ["project", "stakeholder", "iteration", "feedback", "collaboration"]
  }
};

// Security and encryption utilities
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function simpleEncrypt(text) {
  return btoa(encodeURIComponent(text + '|' + Date.now()));
}
function simpleDecrypt(encrypted) {
  try {
    // Decode base64 and URI components
    const decoded = decodeURIComponent(atob(encrypted));
    const [text, timestamp] = decoded.split('|');
    
    // Check if session has expired
    const currentTime = Date.now();
    const sessionAge = currentTime - parseInt(timestamp);
    if (sessionAge > SESSION_TIMEOUT) {
      throw new Error('Session expired');}
    return text;
  } catch (error) {
    return null;
  }
}

function generateSessionToken() {
  return btoa(Math.random().toString(36).substr(2) + Date.now().toString(36));
}

function isValidSession() {
  try {
    const session = getSecureItem('userSession');
    if (!session) return false;
    return (Date.now() - session.loginTime) < SESSION_TIMEOUT;
  } catch (error) {
    return false;
  }
}

function setSecureItem(key, value) {
  try {
    const encrypted = simpleEncrypt(JSON.stringify(value));
    sessionStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to store secure data:', error);
  }
}

function getSecureItem(key) {
  try {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    const decrypted = simpleDecrypt(encrypted);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    return null;
  }
}

function clearSecureSession() {
  sessionStorage.removeItem('userSession');
  sessionStorage.removeItem('interviewData');
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Input validation functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return password.length >= 8 && /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function createSafeElement(tag, textContent, className = '') {
  const element = document.createElement(tag);
  if (textContent) element.textContent = textContent;
  if (className) element.className = className;
  return element;
}

// Navigation functions
function showSection(targetId) {
  const sections = ['landing', 'home', 'roleSelection', 'preparation', 'interview', 'summary', 'dashboard'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.classList.toggle('active', id === targetId);
    }
  });
}

// Focus management
function manageFocus(targetSection) {
  setTimeout(() => {
    const element = document.getElementById(targetSection);
    if (element && element.classList.contains('active')) {
      const heading = element.querySelector('h1, h2');
      if (heading) {
        heading.focus();
        heading.setAttribute('tabindex', '-1');
      }
    }
  }, 100);
}

// --- LANDING PAGE NAVIGATION ---
getStartedBtn.addEventListener("click", () => {
  const session = getSecureItem('userSession');
  if (!session || !session.accountCreated) {
    showError('❌ Create Account Required: Sign up to start your AI interview practice!');
    setTimeout(() => {
      loginModal.style.display = 'block';
      showSignupForm();
    }, 1500);
  } else {
    showSection('home');
  }
});

loginNavBtn.addEventListener("click", () => {
  loginModal.style.display = 'block';
  showLoginForm();
});

if (signupNavBtn) {
  signupNavBtn.addEventListener("click", () => {
    loginModal.style.display = 'block';
    showSignupForm();
  });
}

if (adminNavBtn) {
  adminNavBtn.addEventListener("click", () => {
    adminModal.style.display = 'block';
  });
}

if (closeAdminModal) {
  closeAdminModal.addEventListener('click', () => {
    adminModal.style.display = 'none';
  });
}

if (adminLoginBtn) {
  adminLoginBtn.addEventListener('click', () => {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    if (!username || !password) {
      showModalError('Please enter both username and password');
      return;
    }
    
    if (username === 'admin' && password === 'admin12345') {
      sessionStorage.setItem('adminAccess', 'admin-authenticated');
      adminModal.style.display = 'none';
      // Set admin token for subsequent requests
      window.adminToken = 'admin-authenticated';
      window.location.href = '/admin.html';
    } else {
      showModalError('Invalid admin credentials');
    }
  });
}

window.addEventListener('click', (e) => {
  if (e.target === adminModal) {
    adminModal.style.display = 'none';
  }
});

// Cache form elements for performance
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Form switching
function showLoginForm() {
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
}

function showSignupForm() {
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
}

// Handle form switching links
document.addEventListener('click', (e) => {
  const targetId = e.target.id;
  if (targetId === 'showSignup' || targetId === 'showLogin') {
    e.preventDefault();
    targetId === 'showSignup' ? showSignupForm() : showLoginForm();
  }
});

// Close modal events
closeModal.addEventListener('click', () => {
  loginModal.style.display = 'none';
  showLoginForm();
});

window.addEventListener('click', (e) => {
  if (e.target === loginModal) {
    loginModal.style.display = 'none';
    showLoginForm();
  }
});

// Signup form validation helper
function validateSignupForm(name, email, password, confirmPassword) {
  if (!name || !email || !password || !confirmPassword) {
    return 'Please fill in all fields!';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address!';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters!';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match!';
  }
  return null;
}

// --- SIGNUP ---
document.getElementById('signupBtn').addEventListener('click', async () => {
  try {
    const formData = {
      name: document.getElementById('signupName').value.trim(),
      email: document.getElementById('signupEmail').value.trim(),
      password: document.getElementById('signupPassword').value.trim(),
      confirmPassword: document.getElementById('confirmPassword').value.trim()
    };

    const validationError = validateSignupForm(formData.name, formData.email, formData.password, formData.confirmPassword);
    if (validationError) {
      showModalError(validationError);
      return;
    }

    // Create account (demo mode)
    const sessionData = {
      email: formData.email,
      name: formData.name,
      sessionToken: generateSessionToken(),
      loginTime: Date.now(),
      accountCreated: true
    };
    
    setSecureItem('userSession', sessionData);
    
    // Store account in localStorage for persistence
    const accounts = JSON.parse(localStorage.getItem('demoAccounts') || '{}');
    accounts[formData.email] = {
      name: formData.name,
      password: formData.password,
      created: Date.now()
    };
    localStorage.setItem('demoAccounts', JSON.stringify(accounts));
    loginModal.style.display = 'none';
    showSection('home');
    manageFocus('home');
  } catch (error) {
    showModalError('Registration failed. Please try again.');
    console.error('Signup error:', error);
  }
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });
  
  // Close menu when clicking on nav links
  document.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });
}

// Cache progress bar element
const progressBar = document.querySelector('.progress-bar');

// Update progress bar accessibility
function updateProgressBar(value) {
  const progressBarElement = document.querySelector('.progress-bar');
  if (progressBarElement) {
    progressBarElement.setAttribute('aria-valuenow', Math.round(value));
  }
}

// Login form validation helper
function validateLoginForm(username, password) {
  if (!username || !password) {
    return "Please fill in all fields!";
  }
  if (!isValidEmail(username)) {
    return "Please enter a valid email address!";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters!";
  }
  return null;
}

// --- LOGIN ---
loginBtn.addEventListener("click", async () => {
  try {
    const credentials = {
      username: document.getElementById("username").value.trim(),
      password: document.getElementById("password").value.trim()
    };

    const validationError = validateLoginForm(credentials.username, credentials.password);
    if (validationError) {
      showModalError(validationError);
      return;
    }

    try {
      // Check demo accounts first
      const accounts = JSON.parse(localStorage.getItem('demoAccounts') || '{}');
      console.log('Available accounts:', Object.keys(accounts));
      const account = accounts[credentials.username];
      console.log('Login attempt for:', credentials.username, 'Account found:', !!account);
      
      if (account && account.password === credentials.password) {
        const sessionData = {
          email: credentials.username,
          name: account.name,
          sessionToken: generateSessionToken(),
          loginTime: Date.now(),
          accountCreated: true
        };
        setSecureItem('userSession', sessionData);
        loginModal.style.display = 'none';
        showSection('home');
        manageFocus('home');
      } else {
        showModalError('Invalid credentials or account not found. Please create an account first.');
      }
    } catch (error) {
      showModalError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  } catch (error) {
    showModalError("Login failed. Please try again.");
    console.error("Login error:", error);
  }
});

// --- LOGOUT ---
logoutBtn.addEventListener("click", async () => {
  try {
    const session = getSecureItem('userSession');
    if (session?.sessionToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Session-Token': session.sessionToken
        },
        body: JSON.stringify({ sessionToken: session.sessionToken })
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearSecureSession();
    resetInterview();
    showSection('landing');
    manageFocus('landing');
  }
});

// --- PAGE NAVIGATION ---
selectRoleBtn.addEventListener("click", () => {
  const session = getSecureItem('userSession');
  if (!session || !session.accountCreated) {
    showError('❌ Account Required: Please create an account first to access interviews.');
    setTimeout(() => {
      loginModal.style.display = 'block';
      showSignupForm();
    }, 1000);
    return;
  }
  if (!isValidSession()) {
    showError('Session expired. Please log in again.');
    loginModal.style.display = 'block';
    return;
  }
  showSection('roleSelection');
});

backToHomeBtn.addEventListener("click", () => {
  showSection('home');
});

backToRoleBtn.addEventListener("click", () => {
  showSection('roleSelection');
});

// Dashboard navigation
const dashboardBtn = document.getElementById("dashboardBtn");
const backFromDashboardBtn = document.getElementById("backFromDashboardBtn");

dashboardBtn.addEventListener("click", () => {
  showSection('dashboard');
  loadUserDashboard();
});

backFromDashboardBtn.addEventListener("click", () => {
  showSection('home');
});

// Role selection
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    currentRole = card.dataset.role;
    document.querySelector('#selectedRoleText strong').textContent = currentRole;
    showSection('preparation');
  });
});

// --- START INTERVIEW ---
startInterviewBtn.addEventListener("click", () => {
  if (!currentRole) {
    showError('Please select a role first.');
    return;
  }
  
  questionIndex = 0;
  userResponses = [];
  currentDifficulty = "basic";
  
  const interviewData = {
    role: currentRole,
    startTime: Date.now(),
    sessionToken: getSecureItem('userSession')?.sessionToken
  };
  setSecureItem('interviewData', interviewData);
  
  chatBox.innerHTML = '';
  
  // Start timer
  startTimer();
  
  // Start camera recording automatically
  startCameraRecording();
  
  // Generate first question with backend API
  generateAIQuestion('start').then(question => {
    appendMessage('ai', question);
  }).catch(() => {
    const fallbackQuestion = getFallbackQuestion('start', currentRole);
    appendMessage('ai', fallbackQuestion);
  });
  
  showSection('interview');
  manageFocus('interview');
});

// --- BACK TO HOME ---
homeBtn.addEventListener("click", () => {
  summary.classList.remove("active");
  home.classList.add("active");
  resetInterview();
});

// --- CHAT FUNCTIONALITY ---
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    stopRecording();
  };
  
  recognition.onerror = () => {
    showError('Voice recognition failed. Please try again.');
    stopRecording();
  };
  
  recognition.onend = () => {
    stopRecording();
  };
}

micBtn.addEventListener('click', toggleRecording);
if (voiceBtn) {
  voiceBtn.addEventListener('click', toggleVoice);
}
if (cameraBtn) {
  cameraBtn.addEventListener('click', toggleCamera);
}

function toggleVoice() {
  if (!voiceBtn) return;
  
  voiceEnabled = !voiceEnabled;
  voiceBtn.classList.toggle('muted', !voiceEnabled);
  voiceBtn.textContent = voiceEnabled ? '🔊' : '🔇';
  voiceBtn.title = voiceEnabled ? 'Mute AI voice' : 'Enable AI voice';
  
  if (!voiceEnabled) {
    speechSynthesis.cancel();
  }
}

// Helper function to end interview and show summary
function endInterview() {
  appendMessage("ai", "Thank you for your responses! Let me prepare your interview summary.");
  setTimeout(() => {
    interview.classList.remove("active");
    summary.classList.add("active");
    generateSummary();
  }, 2000);
}

// Helper function to process next question after user response
async function processNextQuestion(sanitizedText) {
  try {
    hideAIThinking();
    
    if (questionIndex >= 8) {
      endInterview();
      return;
    }
    
    // Generate next question with backend API
    try {
      const nextQuestion = await generateAIQuestion('continue', sanitizedText);
      appendMessage("ai", nextQuestion);
    } catch (apiError) {
      const fallbackQuestion = getFallbackQuestion('continue', currentRole, questionIndex);
      appendMessage("ai", fallbackQuestion);
    }
  } catch (error) {
    endInterview();
  } finally {
    setLoadingState(false);
  }
}

function sendMessage() {
  try {
    if (!isValidSession()) {
      showError('Session expired. Please log in again.');
      interview.classList.remove('active');
      login.classList.add('active');
      manageFocus('login');
      return;
    }
    
    const text = userInput.value.trim();
    if (!text) return;

    if (text.length > 500) {
      showError("Message too long! Please keep it under 500 characters.");
      return;
    }

    // Disable input during processing
    setLoadingState(true);
    
    const sanitizedText = sanitizeInput(text);
    appendMessage("user", sanitizedText);
    userResponses.push({
      text: sanitizedText,
      timestamp: Date.now(),
      encrypted: simpleEncrypt(sanitizedText)
    });
    userInput.value = "";

    // Assess response quality with error handling
    const responseQuality = assessResponseQuality(sanitizedText);
    interviewScore += responseQuality.score;
    updateQualityMetrics(sanitizedText, responseQuality);

    questionIndex++;
    
    // Quality-based progress calculation
    const totalQuestions = getTotalQuestions();
    const baseProgress = (questionIndex / totalQuestions) * 60;
    const qualityBonus = Math.min(30, (interviewScore / questionIndex) * 6);
    progressValue = Math.min(90, baseProgress + qualityBonus);
    progress.style.width = `${progressValue}%`;
    updateProgressBar(progressValue);

    // Show AI thinking indicator
    showAIThinking();

    setTimeout(() => processNextQuestion(sanitizedText), 1000);
  } catch (error) {
    showError("Failed to send message. Please try again.");
    console.error("Send message error:", error);
    setLoadingState(false);
  }
}

function appendMessage(sender, text) {
  const sanitizedText = sanitizeInput(text);
  const div = createSafeElement('div', '', `message ${sender}`);
  
  if (sender === 'ai') {
    const avatar = createSafeElement('div', '🤖', 'ai-avatar');
    const messageText = createSafeElement('div', sanitizedText);
    
    div.appendChild(avatar);
    div.appendChild(messageText);
  } else {
    div.textContent = sanitizedText;
  }
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  // Speak AI messages with voice (use original text for speech)
  if (sender === 'ai' && speechSynthesis && aiVoice && voiceEnabled) {
    speakText(text);
  }
}

function speakText(text) {
  try {
    // Stop any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = aiVoice;
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 0.9; // Lower pitch for professional tone
    utterance.volume = 0.9;
    
    utterance.onerror = () => {
      console.warn('Speech synthesis failed');
    };
    
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
}

function resetInterview() {
  try {
    progressValue = 10;
    if (progress) progress.style.width = "10%";
    questionIndex = 0;
    userResponses = [];
    currentRole = "";
    interviewScore = 0;
    currentDifficulty = "basic";
    difficultyScores = { basic: 0, intermediate: 0, advanced: 0 };
    qualityMetrics = {
      totalWords: 0,
      technicalTerms: 0,
      detailedResponses: 0,
      skillsDemo: 0,
      experienceShared: 0
    };
    
    // Stop timer
    stopTimer();
    
    // Stop camera recording
    stopCameraRecording();
    
    if (chatBox) {
      chatBox.innerHTML = '';
      const welcomeDiv = document.createElement('div');
      welcomeDiv.className = 'message ai';
      welcomeDiv.textContent = 'Hi there! Let\'s begin. Tell me about yourself.';
      chatBox.appendChild(welcomeDiv);
    }
  } catch (error) {
    console.error('Reset interview error:', error);
  }
}

// Timer functions
function startTimer() {
  interviewStartTime = Date.now();
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (!interviewStartTime) return;
  
  const elapsed = Date.now() - interviewStartTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  const timerDisplay = document.getElementById('timerDisplay');
  if (timerDisplay) {
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Questions are now generated by API only

// Helper function to calculate grade based on percentage
function calculateGrade(percentage) {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 65) return "Good";
  if (percentage >= 50) return "Fair";
  return "Needs Improvement";
}

function generateSummary() {
  try {
    if (!isValidSession()) {
      showError('Session expired. Please log in again.');
      summary.classList.remove('active');
      login.classList.add('active');
      manageFocus('login');
      return;
    }
    
    // Cache summary content element
    const summaryContent = document.querySelector(".summary-content");
    if (!summaryContent) {
      showError("Failed to load summary. Please try again.");
      return;
    }
    
    const responseCount = userResponses.length || 1;
    const sessionData = getSecureItem('userSession');
    const interviewData = getSecureItem('interviewData');
    const avgScore = Math.round(interviewScore / responseCount);
    const maxLevel = currentDifficulty === "advanced" ? "Advanced" : currentDifficulty === "intermediate" ? "Intermediate" : "Basic";
    
    const percentage = Math.round((interviewScore / (responseCount * 10)) * 100);
    const grade = calculateGrade(percentage);
    
    const candidateName = sanitizeInput(sessionData?.email?.split('@')[0] || 'Anonymous');
    const roleName = sanitizeInput(currentRole || 'Not specified');
    const sessionId = sanitizeInput(sessionData?.sessionToken?.substr(-8) || 'N/A');
    
    // Create summary elements safely
    const summaryContainer = document.createElement('div');
    
    // Score card
    const scoreCard = createSafeElement('div', '', 'score-card');
    const scoreCircle = createSafeElement('div', '', 'score-circle');
    const scoreNumber = createSafeElement('span', `${percentage}%`, 'score-number');
    const scoreLabel = createSafeElement('span', grade, 'score-label');
    scoreCircle.appendChild(scoreNumber);
    scoreCircle.appendChild(scoreLabel);
    
    const scoreDetails = createSafeElement('div', '', 'score-details');
    const roleTitle = createSafeElement('h3', `${roleName} Interview`);
    const levelInfo = createSafeElement('p', `Level: ${maxLevel} • Score: ${interviewScore} pts`);
    scoreDetails.appendChild(roleTitle);
    scoreDetails.appendChild(levelInfo);
    
    scoreCard.appendChild(scoreCircle);
    scoreCard.appendChild(scoreDetails);
    summaryContainer.appendChild(scoreCard);
    
    // Metrics grid
    const metricsGrid = createSafeElement('div', '', 'metrics-grid');
    const metrics = [
      { value: qualityMetrics.technicalTerms || 0, label: 'Technical Terms' },
      { value: qualityMetrics.skillsDemo || 0, label: 'Skills Shown' },
      { value: qualityMetrics.experienceShared || 0, label: 'Examples' },
      { value: qualityMetrics.detailedResponses || 0, label: 'Detailed Answers' }
    ];
    
    metrics.forEach(metric => {
      const metricDiv = createSafeElement('div', '', 'metric');
      const metricNumber = createSafeElement('span', metric.value.toString(), 'metric-number');
      const metricLabel = createSafeElement('span', metric.label, 'metric-label');
      metricDiv.appendChild(metricNumber);
      metricDiv.appendChild(metricLabel);
      metricsGrid.appendChild(metricDiv);
    });
    
    summaryContainer.appendChild(metricsGrid);
    
    // Add feedback text
    const feedbackP = createSafeElement('p');
    const feedbackStrong = createSafeElement('strong', 'Feedback: ');
    feedbackP.appendChild(feedbackStrong);
    
    let feedbackText = '';
    if (percentage >= 80) {
      feedbackText = 'Exceptional performance! You demonstrated mastery across multiple difficulty levels with strong technical knowledge and practical experience.';
    } else if (percentage >= 65) {
      feedbackText = `Strong performance with good technical foundation. Consider deepening knowledge in advanced topics for ${roleName}.`;
    } else if (percentage >= 50) {
      feedbackText = 'Solid foundation but room for improvement. Focus on technical depth and sharing more specific examples.';
    } else {
      feedbackText = `Consider strengthening technical knowledge and practicing with real-world examples for ${roleName} interviews.`;
    }
    
    feedbackP.appendChild(document.createTextNode(feedbackText));
    summaryContainer.appendChild(feedbackP);
    
    // Add home button
    const homeButton = createSafeElement('button', 'Go Home');
    homeButton.id = 'homeBtn';
    summaryContainer.appendChild(homeButton);
    
    // Generate AI-powered feedback and save to database
    generateAIFeedback().then(async (aiFeedback) => {
      if (aiFeedback) {
        const aiFeedbackDiv = createSafeElement('div', '', 'ai-feedback');
        const aiTitle = createSafeElement('h4', '🤖 AI Analysis');
        const aiText = createSafeElement('p', sanitizeInput(aiFeedback));
        aiFeedbackDiv.appendChild(aiTitle);
        aiFeedbackDiv.appendChild(aiText);
        summaryContainer.appendChild(aiFeedbackDiv);
      }
      
      // Save evaluation to database
      try {
        const session = getSecureItem('userSession');
        if (session?.sessionToken) {
          await fetch(`${API_BASE_URL}/evaluation/save`, { // amazonq-ignore-line
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
              'X-Session-Token': session.sessionToken
            },
            body: JSON.stringify({
              sessionToken: session.sessionToken,
              role: currentRole,
              score: interviewScore,
              percentage,
              grade,
              maxLevel,
              metrics: qualityMetrics,
              aiFeedback: sanitizeInput(aiFeedback || '')
            })
          });
        }
      } catch (error) {
        console.error('Failed to save evaluation:', error);
      }
      
      summaryContent.innerHTML = '';
      summaryContent.appendChild(summaryContainer);
      
      // Save result to localStorage
      const session = getSecureItem('userSession');
      if (session && session.email) {
        const userResults = JSON.parse(localStorage.getItem('userResults_' + session.email) || '[]');
        userResults.push({
          role: currentRole,
          percentage,
          grade,
          maxLevel,
          date: Date.now()
        });
        localStorage.setItem('userResults_' + session.email, JSON.stringify(userResults));
      }
      
      attachHomeButtonListener();
    }).catch(() => {
      summaryContent.innerHTML = '';
      summaryContent.appendChild(summaryContainer);
      attachHomeButtonListener();
    });
    
  } catch (error) {
    showError("Failed to generate summary. Please try again.");
    console.error("Summary generation error:", error);
  }
}

function attachHomeButtonListener() {
  const newHomeBtn = document.getElementById("homeBtn");
    if (newHomeBtn) {
      newHomeBtn.addEventListener("click", () => {
        try {
          summary.classList.remove("active");
          home.classList.add("active");
          resetInterview();
        } catch (error) {
          showError("Failed to return home. Please refresh the page.");
          console.error("Navigation error:", error);
        }
      });
    }
}

async function generateAIFeedback() {
  try {
    const responses = userResponses.map(r => r.text);
    const percentage = Math.round((interviewScore / (responses.length * 10)) * 100);
    
    const session = getSecureItem('userSession');
    const response = await fetch(`${API_BASE_URL}/interview/feedback`, { // amazonq-ignore-line
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Session-Token': session?.sessionToken
      },
      body: JSON.stringify({
        role: currentRole,
        responses,
        score: percentage
      })
    });
    
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data.feedback;
    
  } catch (error) {
    console.error('AI Feedback Error:', error);
    return null;
  }
}

// Error handling and utility functions
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ff4444;color:white;padding:10px;border-radius:5px;z-index:1000';
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Helper to find active modal and target button
function findModalElements() {
  const activeModal = document.querySelector('.modal[style*="block"] .modal-content') || document.querySelector('.modal-content');
  const targetBtn = activeModal?.querySelector('#loginBtn') || activeModal?.querySelector('#adminLoginBtn');
  return { activeModal, targetBtn };
}

function showModalError(message) {
  const existingError = document.querySelector('.modal-error');
  if (existingError) existingError.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'modal-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'background:#ff4444;color:white;padding:10px;border-radius:5px;margin:10px 0;text-align:center';
  
  const { activeModal, targetBtn } = findModalElements();
  if (activeModal && targetBtn) {
    activeModal.insertBefore(errorDiv, targetBtn);
  }
  
  setTimeout(() => errorDiv.remove(), 5000);
}

function setLoadingState(loading) {
  sendBtn.disabled = loading;
  userInput.disabled = loading;
  sendBtn.textContent = loading ? 'Sending...' : 'Send';
}

function showAIThinking() {
  const thinkingDiv = createSafeElement('div', 'AI is thinking', 'message ai thinking');
  const dotsSpan = createSafeElement('span', '...', 'dots');
  thinkingDiv.appendChild(dotsSpan);
  thinkingDiv.id = 'ai-thinking';
  chatBox.appendChild(thinkingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideAIThinking() {
  const thinkingDiv = document.getElementById('ai-thinking');
  if (thinkingDiv) thinkingDiv.remove();
}

function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function getTotalQuestions() {
  return 8; // Fixed number for API-generated questions
}

function assessResponseQuality(response) {
  try {
    const words = response.split(/\s+/).length;
    const criteria = evaluationCriteria[currentRole];
    
    if (!criteria) {
      console.warn(`No evaluation criteria found for role: ${currentRole}`);
      return { score: 1, words, technicalTerms: 0, skillsDemo: 0, experienceShared: 0, hasExamples: false };
    }
    
    const technicalTerms = countTermsInText(response, criteria.technical);
    const skillsDemo = countTermsInText(response, criteria.skills);
    const experienceShared = countTermsInText(response, criteria.experience);
    const hasExamples = /example|experience|project|used|worked|implemented/i.test(response);
    
    let score = 0;
    
    // Base score for length
    score += words >= 30 ? 4 : words >= 20 ? 3 : words >= 10 ? 2 : 1;
    
    // Technical knowledge bonus
    score += Math.min(3, technicalTerms);
    
    // Skills demonstration bonus
    score += Math.min(2, skillsDemo);
    
    // Experience sharing bonus
    if (experienceShared > 0) score += 2;
    if (hasExamples) score += 1;
    
    // Difficulty multiplier
    const multiplier = currentDifficulty === "advanced" ? 1.5 : currentDifficulty === "intermediate" ? 1.2 : 1;
    score = Math.round(score * multiplier);
    
    // Update difficulty scores
    difficultyScores[currentDifficulty] += score >= 5 ? 1 : 0;
    
    return { score, words, technicalTerms, skillsDemo, experienceShared, hasExamples };
  } catch (error) {
    console.error("Error assessing response quality:", error);
    return { score: 1, words: 0, technicalTerms: 0, skillsDemo: 0, experienceShared: 0, hasExamples: false };
  }
}

function countTermsInText(text, terms) {
  try {
    if (!Array.isArray(terms)) return 0;
    const lowerText = text.toLowerCase();
    const termSet = new Set(terms.map(term => term.toLowerCase()));
    return [...termSet].filter(term => lowerText.includes(term)).length;
  } catch (error) {
    console.error("Error counting terms:", error);
    return 0;
  }
}

// Load user dashboard with past results
function loadUserDashboard() {
  const dashboardContent = document.getElementById('dashboardContent');
  const session = getSecureItem('userSession');
  
  if (!session || !session.email) {
    dashboardContent.innerHTML = '<p>Please log in to view your results.</p>';
    return;
  }
  
  // Get results from localStorage (demo mode)
  const userResults = JSON.parse(localStorage.getItem('userResults_' + session.email) || '[]');
  
  if (userResults.length === 0) {
    dashboardContent.innerHTML = '<p>No interview results yet. Complete an interview to see your progress!</p>';
    return;
  }
  
  // Display results
  let html = '<div class="results-grid">';
  userResults.forEach((result, index) => {
    html += `
      <div class="result-card">
        <h3>${result.role}</h3>
        <div class="score">${result.percentage}%</div>
        <div class="grade">${result.grade}</div>
        <div class="date">${new Date(result.date).toLocaleDateString()}</div>
      </div>
    `;
  });
  html += '</div>';
  
  dashboardContent.innerHTML = html;
}

function updateQualityMetrics(response, quality) {
  try {
    qualityMetrics.totalWords += quality.words || 0;
    qualityMetrics.technicalTerms += quality.technicalTerms || 0;
    qualityMetrics.skillsDemo += quality.skillsDemo || 0;
    qualityMetrics.experienceShared += quality.experienceShared || 0;
    if ((quality.words || 0) >= 20) qualityMetrics.detailedResponses++;
  } catch (error) {
    console.error("Error updating quality metrics:", error);
  }
}

function toggleRecording() {
  if (!recognition) {
    showError('Voice recognition not supported in this browser.');
    return;
  }
  
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  try {
    recognition.start();
    isRecording = true;
    micBtn.classList.add('recording');
    micBtn.textContent = '⏹️';
    micBtn.title = 'Stop recording';
  } catch (error) {
    showError('Failed to start recording.');
  }
}

function stopRecording() {
  if (recognition && isRecording) {
    recognition.stop();
  }
  isRecording = false;
  micBtn.classList.remove('recording');
  micBtn.textContent = '🎤';
  micBtn.title = 'Record voice answer';
}

// Camera recording functions
async function startCameraRecording() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 }, 
      audio: true 
    });
    
    const preview = document.getElementById('cameraPreview');
    if (preview) {
      preview.srcObject = videoStream;
      preview.style.display = 'block';
    }
    
    mediaRecorder = new MediaRecorder(videoStream);
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      console.log('Recording saved:', url);
    };
    
    mediaRecorder.start();
    isVideoRecording = true;
    
    if (cameraBtn) {
      cameraBtn.textContent = '📹';
      cameraBtn.classList.add('recording');
      cameraBtn.title = 'Recording in progress';
    }
    
  } catch (error) {
    console.error('Camera access failed:', error);
    showError('Camera access denied. Interview will continue without video.');
  }
}

function stopCameraRecording() {
  if (mediaRecorder && isVideoRecording) {
    mediaRecorder.stop();
    isVideoRecording = false;
  }
  
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  const preview = document.getElementById('cameraPreview');
  if (preview) {
    preview.style.display = 'none';
    preview.srcObject = null;
  }
  
  if (cameraBtn) {
    cameraBtn.textContent = '📷';
    cameraBtn.classList.remove('recording');
    cameraBtn.title = 'Start camera recording';
  }
}

function toggleCamera() {
  if (isVideoRecording) {
    stopCameraRecording();
  } else {
    startCameraRecording();
  }
}

// Fallback questions when API fails
function getFallbackQuestion(type, role, index = 0) {
  const fallbackQuestions = {
    "Frontend Developer": [
      "Tell me about yourself and your experience in frontend development.",
      "What's the difference between let, const, and var in JavaScript?",
      "How do you ensure your websites are responsive across different devices?",
      "Explain the concept of the DOM and how you manipulate it.",
      "What are some performance optimization techniques you use?",
      "How do you handle state management in React applications?",
      "Describe your experience with CSS frameworks and preprocessors.",
      "What testing strategies do you use for frontend applications?"
    ],
    "Backend Developer": [
      "Tell me about yourself and your backend development experience.",
      "How do you design RESTful APIs?",
      "Explain database normalization and when you'd use it.",
      "How do you handle authentication and authorization?",
      "What's your approach to error handling in backend services?",
      "How do you ensure API security?",
      "Describe your experience with microservices architecture.",
      "How do you optimize database queries for performance?"
    ],
    "Data Scientist": [
      "Tell me about yourself and your data science background.",
      "How do you approach a new data science project?",
      "Explain the difference between supervised and unsupervised learning.",
      "How do you handle missing data in your datasets?",
      "What's your process for feature selection and engineering?",
      "How do you validate and evaluate your machine learning models?",
      "Describe your experience with data visualization tools.",
      "How do you communicate technical findings to non-technical stakeholders?"
    ],
    "UI/UX Designer": [
      "Tell me about yourself and your design experience.",
      "How do you approach user research for a new project?",
      "What's your design process from concept to final product?",
      "How do you ensure accessibility in your designs?",
      "Describe your experience with design systems.",
      "How do you handle feedback and iterate on your designs?",
      "What tools do you use for prototyping and why?",
      "How do you measure the success of your design solutions?"
    ]
  };
  
  const questions = fallbackQuestions[role] || fallbackQuestions["Frontend Developer"];
  return questions[Math.min(index, questions.length - 1)];
}

// Backend API Integration
async function generateAIQuestion(type, userResponse = '') {
  try {
    const session = getSecureItem('userSession');
    const response = await fetch(`${API_BASE_URL}/interview/question`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Session-Token': session?.sessionToken
      },
      body: JSON.stringify({
        type,
        role: currentRole,
        previousResponse: userResponse
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.question;
    
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}
});