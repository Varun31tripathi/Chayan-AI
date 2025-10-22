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
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('interviewsSection').style.display = 'none';
    document.getElementById('ongoingInterviewsSection').style.display = 'none';
    document.getElementById('practiceInterviewsSection').style.display = 'none';
}

function toggleProfile() {
    hideAllSections();
    const profileSection = document.getElementById('profileSection');
    profileSection.style.display = 'block';
}

function toggleInterviews() {
    hideAllSections();
    const interviewsSection = document.getElementById('interviewsSection');
    interviewsSection.style.display = 'block';
}

function toggleCandidates() {
    const candidatesSection = document.getElementById('candidatesSection');
    if (candidatesSection.style.display === 'none') {
        candidatesSection.style.display = 'block';
    } else {
        candidatesSection.style.display = 'none';
    }
}

function toggleCreateInterview() {
    const createSection = document.getElementById('createInterviewSection');
    if (createSection.style.display === 'none') {
        createSection.style.display = 'block';
    } else {
        createSection.style.display = 'none';
    }
}

function toggleOngoingInterviews() {
    hideAllSections();
    const ongoingSection = document.getElementById('ongoingInterviewsSection');
    loadAvailableInterviews();
    ongoingSection.style.display = 'block';
}

function loadAvailableInterviews() {
    const interviews = JSON.parse(localStorage.getItem('availableInterviews') || '[]');
    const container = document.getElementById('availableInterviewsList');
    
    if (interviews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: white; opacity: 0.7;">No interviews available. Check back later!</p>';
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
                <button class="action-btn" style="margin-top: 10px;" onclick="viewInterview('${interview.title.split(' - ')[0]}', '${interview.title.split(' - ')[1]}', '${interview.level}', '${interview.duration}', '${interview.skills}')">View Interview Details</button>
            </div>
        </div>
    `).join('');
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

function saveCompletedInterview(interviewData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;
    
    const userInterviews = JSON.parse(localStorage.getItem(`interviews_${currentUser.uid}`) || '[]');
    
    const completedInterview = {
        title: `${interviewData.jobTitle} - ${interviewData.company}`,
        duration: interviewData.duration,
        completedAt: new Date().toLocaleDateString(),
        status: 'completed',
        questionsAnswered: 'Multiple'
    };
    
    userInterviews.push(completedInterview);
    localStorage.setItem(`interviews_${currentUser.uid}`, JSON.stringify(userInterviews));
}

function handleCreateInterview(event) {
    event.preventDefault();
    const form = event.target;
    const jobTitle = form.querySelector('input[placeholder*="Software Engineer"]').value;
    const company = form.querySelector('input[placeholder*="Company Name"]').value;
    const level = form.querySelector('select').value;
    const duration = form.querySelectorAll('select')[1].value;
    const skills = form.querySelector('input[placeholder*="JavaScript"]').value;
    
    // Store interview data in localStorage for students to see
    const interviews = JSON.parse(localStorage.getItem('availableInterviews') || '[]');
    interviews.push({
        title: `${jobTitle} - ${company}`,
        duration: duration,
        level: level,
        skills: skills,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('availableInterviews', JSON.stringify(interviews));
    
    alert('Interview created successfully! It will be available for candidates.');
    document.getElementById('createInterviewSection').style.display = 'none';
    form.reset();
}

function editProfile() {
    const inputs = document.querySelectorAll('#profileSection input, #profileSection select');
    const button = document.querySelector('#profileSection button');
    
    if (button.textContent === 'Edit Profile') {
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
        });
        button.textContent = 'Save Profile';
    } else {
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.setAttribute('disabled', true);
        });
        button.textContent = 'Edit Profile';
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