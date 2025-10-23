let interviewStarted = false;

function startInterview() {
    const name = document.getElementById('candidateName').value;
    const role = document.getElementById('jobRole').value;
    
    if (!name || !role) {
        alert('Please enter your name and job role');
        return;
    }
    
    document.getElementById('interviewSection').style.display = 'block';
    interviewStarted = true;
    
    addMessage(`Hello ${name}! I'm your AI interviewer. Let's start with a simple question about ${role}. Tell me about yourself and your experience.`, 'ai');
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const responses = [
            "That's interesting. Can you elaborate on your technical skills?",
            "Great! Now, how do you handle challenging situations at work?",
            "Tell me about a project you're proud of.",
            "What are your career goals for the next 5 years?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'ai');
    }, 1000);
}

function addMessage(text, sender) {
    const container = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function openLoginPopup() {
    document.getElementById('loginPopup').style.display = 'block';
}

function closeLoginPopup() {
    document.getElementById('loginPopup').style.display = 'none';
}

function openSignupPopup() {
    document.getElementById('signupPopup').style.display = 'block';
}

function closeSignupPopup() {
    document.getElementById('signupPopup').style.display = 'none';
}

function selectUserType(type) {
    const buttons = document.querySelectorAll('.user-type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (type === 'student') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
}

function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        toggleBtn.textContent = '👁';
    }
}

function toggleSignupPassword() {
    const passwordField = document.getElementById('signupPassword');
    const toggleBtn = passwordField.nextElementSibling;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        toggleBtn.textContent = '👁';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    // Check if Firebase is loaded
    if (!window.firebaseAuth) {
        alert('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const activeButton = document.querySelector('#loginPopup .user-type-btn.active');
    const userType = activeButton.textContent.toLowerCase();
    
    console.log('Login attempt:', { email, userType });
    
    try {
        console.log('Calling Firebase signIn...');
        const userCredential = await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
        const user = userCredential.user;
        console.log('Login successful:', user.uid);
        
        // Get user data from Firestore
        console.log('Fetching user data from Firestore...');
        const userDoc = await window.getDoc(window.doc(window.firebaseDb, 'users', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            
            if (userData.type === userType) {
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    ...userData
                }));
                
                closeLoginPopup();
                
                if (userType === 'interviewer') {
                    window.location.href = 'interviewer.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                alert(`This account is registered as ${userData.type}. Please select the correct user type.`);
            }
        } else {
            alert('User profile not found. Please contact support.');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            alert('No account found with this email. Please sign up first.');
        } else if (error.code === 'auth/wrong-password') {
            alert('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-credential') {
            alert('Invalid email or password. Please check your credentials.');
        } else {
            alert('Login failed: ' + error.message);
        }
    }
}

function selectSignupUserType(type) {
    const buttons = document.querySelectorAll('#signupPopup .user-type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (type === 'student') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[placeholder="Full Name"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelector('input[placeholder="Confirm Password"]').value;
    const activeButton = document.querySelector('#signupPopup .user-type-btn.active');
    const userType = activeButton.textContent.toLowerCase();
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        console.log('Creating user with email:', email);
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        console.log('User created:', user.uid);
        
        // Store user data in Firestore
        const userData = {
            name: name,
            email: email,
            type: userType,
            registeredAt: new Date().toISOString()
        };
        
        console.log('Saving user data:', userData);
        await setDoc(doc(firebaseDb, 'users', user.uid), userData);
        
        localStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            ...userData
        }));
        
        alert('Registration successful! You can now login with these credentials.');
        closeSignupPopup();
        
        // Redirect based on user type
        if (userType === 'interviewer') {
            window.location.href = 'interviewer.html';
        } else {
            window.location.href = 'user.html';
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Registration failed: ' + error.message);
    }
}

function hideAllSections() {
    const sections = ['profileSection', 'interviewsSection', 'ongoingInterviewsSection', 'practiceInterviewsSection', 'candidatesSection', 'createInterviewSection'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    });
}

function toggleProfile() {
    hideAllSections();
    const profileSection = document.getElementById('profileSection');
    if (profileSection) {
        profileSection.style.display = 'block';
    }
}

async function toggleInterviews() {
    hideAllSections();
    const interviewsSection = document.getElementById('interviewsSection');
    if (interviewsSection) {
        await loadUserInterviews();
        interviewsSection.style.display = 'block';
    }
}

async function toggleCandidates() {
    hideAllSections();
    const candidatesSection = document.getElementById('candidatesSection');
    if (candidatesSection) {
        candidatesSection.style.display = 'block';
        // Load candidates if function exists (interviewer page)
        if (typeof loadCandidatesForInterviewer === 'function') {
            await loadCandidatesForInterviewer();
        }
    }
}

function toggleCreateInterview() {
    document.getElementById('createInterviewPopup').style.display = 'block';
}

function closeCreateInterviewPopup() {
    document.getElementById('createInterviewPopup').style.display = 'none';
}

function toggleOngoingInterviews() {
    hideAllSections();
    const ongoingSection = document.getElementById('ongoingInterviewsSection');
    if (ongoingSection) {
        loadAvailableInterviews();
        ongoingSection.style.display = 'block';
    }
}

async function loadAvailableInterviews() {
    const container = document.getElementById('availableInterviewsList');
    
    try {
        const querySnapshot = await window.getDocs(window.collection(window.firebaseDb, 'availableInterviews'));
        const interviews = [];
        
        querySnapshot.forEach((doc) => {
            interviews.push({ id: doc.id, ...doc.data() });
        });
        
        if (interviews.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">No interviews available. Check back later!</p>';
            return;
        }
        
        container.innerHTML = interviews.map(interview => `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${interview.title}</h3>
                    <span class="interview-date">Posted: ${interview.date}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Duration:</strong> ${interview.duration}</p>
                    <p><strong>Level:</strong> ${interview.level}</p>
                    <p><strong>Skills:</strong> ${interview.skills}</p>
                    <button class="action-btn" style="margin-top: 10px;" onclick="showInterviewDetails('${interview.jobTitle}', '${interview.company}', '${interview.level}', '${interview.duration}', '${interview.skills}', '${interview.date}')">View Interview Details</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading interviews:', error);
        container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">Error loading interviews.</p>';
    }
}

function viewInterview(jobTitle, company, level, duration, skills) {
    const params = new URLSearchParams({
        jobTitle: jobTitle,
        company: company,
        level: level,
        duration: duration,
        skills: skills
    });
    window.location.href = `instructions.html?${params.toString()}`;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function togglePracticeInterviews() {
    hideAllSections();
    const practiceSection = document.getElementById('practiceInterviewsSection');
    practiceSection.style.display = 'block';
}

const practiceQuestions = {
    'Software Engineer': [
        "Tell me about yourself and your programming experience.",
        "What programming languages are you most comfortable with?",
        "Explain the difference between a stack and a queue.",
        "How do you approach debugging a complex problem?",
        "What is object-oriented programming?",
        "Describe a challenging project you've worked on.",
        "How do you stay updated with new technologies?",
        "What is version control and why is it important?",
        "Explain the concept of algorithms and data structures.",
        "Where do you see yourself in 5 years as a developer?"
    ],
    'Frontend Developer': [
        "Tell me about your experience with frontend development.",
        "What's the difference between HTML, CSS, and JavaScript?",
        "How do you ensure your websites are responsive?",
        "Explain the box model in CSS.",
        "What is React and why would you use it?",
        "How do you optimize website performance?",
        "What are semantic HTML elements?",
        "Describe your experience with CSS frameworks.",
        "How do you handle browser compatibility issues?",
        "What tools do you use for frontend development?"
    ],
    'Data Scientist': [
        "Tell me about your background in data science.",
        "What is machine learning and how does it work?",
        "Explain the difference between supervised and unsupervised learning.",
        "How do you handle missing data in a dataset?",
        "What Python libraries do you use for data analysis?",
        "Describe a data science project you've worked on.",
        "What is the importance of data visualization?",
        "How do you validate a machine learning model?",
        "Explain statistical significance and p-values.",
        "What ethical considerations are important in data science?"
    ],
    'Product Manager': [
        "Tell me about your experience in product management.",
        "How do you prioritize features in a product roadmap?",
        "Describe your process for gathering user requirements.",
        "How do you handle conflicting stakeholder demands?",
        "What metrics do you use to measure product success?",
        "Tell me about a time you had to make a difficult product decision.",
        "How do you work with engineering and design teams?",
        "What is your approach to competitive analysis?",
        "How do you validate product ideas before development?",
        "Describe your experience with agile methodologies."
    ]
};

function startPracticeInterview(jobTitle, company, level, duration, skills) {
    sessionStorage.setItem('currentInterview', JSON.stringify({
        jobTitle: jobTitle,
        company: company,
        level: level,
        duration: duration,
        skills: skills,
        isPractice: true,
        practiceQuestions: practiceQuestions[jobTitle] || []
    }));
    
    window.location.href = 'instructions.html';
}

async function saveCompletedInterview(interviewData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;
    
    try {
        const completedInterview = {
            title: `${interviewData.jobTitle} - ${interviewData.company}`,
            duration: interviewData.duration,
            completedAt: new Date().toLocaleDateString(),
            status: 'completed',
            questionsAnswered: 'Multiple',
            userId: currentUser.uid
        };
        
        // Save to user's interview history
        await window.addDoc(window.collection(window.firebaseDb, 'userInterviews'), completedInterview);
        
        // Save candidate result for interviewer view
        const candidateResult = {
            candidateName: currentUser.name,
            candidateEmail: currentUser.email,
            jobTitle: interviewData.jobTitle,
            company: interviewData.company,
            duration: interviewData.duration,
            completedAt: new Date().toLocaleDateString(),
            score: Math.floor(Math.random() * 40) + 60,
            interviewerEmail: interviewData.interviewerEmail || 'interviewer@example.com',
            userId: currentUser.uid
        };
        
        await window.addDoc(window.collection(window.firebaseDb, 'candidateResults'), candidateResult);
    } catch (error) {
        console.error('Error saving interview:', error);
    }
}

async function handleCreateInterview(event) {
    event.preventDefault();
    const form = event.target;
    const jobTitle = form.querySelector('input[placeholder*="Software Engineer"]').value;
    const company = form.querySelector('input[placeholder*="Company Name"]').value;
    const level = form.querySelector('select').value;
    const duration = form.querySelectorAll('select')[1].value;
    const skills = form.querySelector('input[placeholder*="JavaScript"]').value;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    try {
        const interviewData = {
            title: `${jobTitle} - ${company}`,
            jobTitle: jobTitle,
            company: company,
            duration: duration,
            level: level,
            skills: skills,
            date: new Date().toLocaleDateString(),
            interviewerEmail: currentUser ? currentUser.email : 'interviewer@example.com',
            createdAt: new Date()
        };
        
        await window.addDoc(window.collection(window.firebaseDb, 'availableInterviews'), interviewData);
        
        alert('Interview created successfully! It will be available for candidates.');
        document.getElementById('createInterviewPopup').style.display = 'none';
        form.reset();
    } catch (error) {
        console.error('Error creating interview:', error);
        alert('Error creating interview. Please try again.');
    }
}

async function editProfile() {
    const inputs = document.querySelectorAll('#profileSection input, #profileSection textarea');
    const button = document.querySelector('#profileSection button');
    
    if (button.textContent === 'Edit Profile') {
        inputs.forEach(input => {
            if (input.id !== 'profileEmail' && input.id !== 'profileType' && input.id !== 'profileRegistered') {
                input.removeAttribute('readonly');
            }
        });
        button.textContent = 'Save Profile';
    } else {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return;
            
            const updatedData = {
                name: document.getElementById('profileName').value,
                currentRole: document.getElementById('profileCurrentRole').value,
                skills: document.getElementById('profileSkills').value,
                projects: document.getElementById('profileProjects').value,
                experience: document.getElementById('profileExperience').value
            };
            
            await window.setDoc(window.doc(window.firebaseDb, 'users', currentUser.uid), updatedData, { merge: true });
            
            // Update localStorage
            const updatedUser = { ...currentUser, ...updatedData };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
            });
            button.textContent = 'Edit Profile';
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile: ' + error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
// Firestore functions for interview management
async function loadUserInterviews() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;
    
    const container = document.getElementById('pastInterviewsList');
    if (!container) return;
    
    try {
        const q = window.query(
            window.collection(window.firebaseDb, 'userInterviews'),
            window.where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await window.getDocs(q);
        const interviews = [];
        
        querySnapshot.forEach((doc) => {
            interviews.push({ id: doc.id, ...doc.data() });
        });
        
        if (interviews.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">No completed interviews yet.</p>';
            return;
        }
        
        container.innerHTML = interviews.map(interview => `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${interview.title}</h3>
                    <span class="interview-date">${interview.completedAt}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Duration:</strong> ${interview.duration}</p>
                    <p><strong>Status:</strong> ${interview.status}</p>
                    <p><strong>Questions:</strong> ${interview.questionsAnswered}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading user interviews:', error);
        container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">Error loading interviews.</p>';
    }
}

async function loadCandidatesForInterviewer() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;
    
    const container = document.getElementById('candidatesList');
    if (!container) return;
    
    try {
        const q = window.query(
            window.collection(window.firebaseDb, 'candidateResults'),
            window.where('interviewerEmail', '==', currentUser.email)
        );
        const querySnapshot = await window.getDocs(q);
        const candidates = [];
        
        querySnapshot.forEach((doc) => {
            candidates.push({ id: doc.id, ...doc.data() });
        });
        
        if (candidates.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">No candidate evaluations available yet.</p>';
            return;
        }
        
        container.innerHTML = candidates.map(candidate => `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${candidate.candidateName} - ${candidate.jobTitle}</h3>
                    <span class="interview-date">${candidate.completedAt}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Score:</strong> ${candidate.score}%</p>
                    <p><strong>Duration:</strong> ${candidate.duration}</p>
                    <p><strong>Status:</strong> <span class="status ${candidate.score >= 80 ? 'passed' : 'pending'}">${candidate.score >= 80 ? 'Recommended' : 'Under Review'}</span></p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading candidates:', error);
        container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">Error loading candidates.</p>';
    }
}