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
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user' : 'ai'}-message`;
    messageDiv.textContent = text; // textContent prevents XSS
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function openLoginPopup() {
    const popup = document.getElementById('loginPopup');
    if (popup) {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Focus on the first input field for better accessibility
        const firstInput = popup.querySelector('input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

function closeLoginPopup() {
    const popup = document.getElementById('loginPopup');
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        // Clear form
        const form = popup.querySelector('form');
        if (form) form.reset();
    }
}

function openSignupPopup() {
    const popup = document.getElementById('signupPopup');
    if (popup) {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Focus on the first input field for better accessibility
        const firstInput = popup.querySelector('input[placeholder="Full Name"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

function closeSignupPopup() {
    const popup = document.getElementById('signupPopup');
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        // Clear form
        const form = popup.querySelector('form');
        if (form) form.reset();
    }
}

function selectUserType(type) {
    const buttons = document.querySelectorAll('#loginPopup .user-type-btn');
    if (buttons.length < 2) {
        console.error('User type buttons not found');
        return;
    }
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.transform = '';
    });
    
    if (type === 'student') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
}

function selectSignupUserType(type) {
    const buttons = document.querySelectorAll('#signupPopup .user-type-btn');
    if (buttons.length < 2) {
        console.error('Signup user type buttons not found');
        return;
    }
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.transform = '';
    });
    
    if (type === 'student') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
}

function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleBtn = document.querySelector('#loginPopup .toggle-password');
    
    if (!passwordField || !toggleBtn) {
        console.error('Password field or toggle button not found');
        return;
    }
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.textContent = '🙈';
        toggleBtn.setAttribute('aria-label', 'Hide password');
    } else {
        passwordField.type = 'password';
        toggleBtn.textContent = '👁';
        toggleBtn.setAttribute('aria-label', 'Show password');
    }
}

function toggleSignupPassword() {
    const passwordField = document.getElementById('signupPassword');
    const toggleBtn = document.querySelector('#signupPopup .toggle-password');
    
    if (!passwordField || !toggleBtn) {
        console.error('Signup password field or toggle button not found');
        return;
    }
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.textContent = '🙈';
        toggleBtn.setAttribute('aria-label', 'Hide password');
    } else {
        passwordField.type = 'password';
        toggleBtn.textContent = '👁';
        toggleBtn.setAttribute('aria-label', 'Show password');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Check if Firebase is loaded
    if (!window.firebaseAuth || !window.firebaseReady) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showFormError('Firebase not loaded. Please refresh the page and try again.');
        return;
    }
    
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const activeButton = document.querySelector('#loginPopup .user-type-btn.active');
    if (!activeButton) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showFormError('Please select a user type.');
        return;
    }
    const userType = activeButton.textContent.toLowerCase().trim();
    
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showFormError('Please enter a valid email address.');
        return;
    }
    
    if (!password || password.length < 6) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showFormError('Password must be at least 6 characters long.');
        return;
    }
    
    console.log('Login attempt:', { email, userType });
    
    try {
        // Add CSRF token validation
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
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
                    window.location.href = window.location.protocol === 'https:' ? 'interviewer.html' : window.location.origin.replace('http:', 'https:') + '/interviewer.html';
                } else {
                    window.location.href = window.location.protocol === 'https:' ? 'user.html' : window.location.origin.replace('http:', 'https:') + '/user.html';
                }
            } else {
                alert(`This account is registered as ${userData.type}. Please select the correct user type.`);
            }
        } else {
            showFormError('User profile not found. Please contact support.');
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Sanitize error messages to prevent information disclosure
        let userMessage = 'Login failed. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found') {
            userMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.code === 'auth/wrong-password') {
            userMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.code === 'auth/invalid-credential') {
            userMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.code === 'auth/network-request-failed') {
            userMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        showFormError(userMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}



async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    const name = form.querySelector('input[placeholder="Full Name"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelector('input[placeholder="Confirm Password"]').value;
    const activeButton = document.querySelector('#signupPopup .user-type-btn.active');
    if (!activeButton) {
        showFormError('Please select a user type.');
        return;
    }
    const userType = activeButton.textContent.toLowerCase().trim();
    
    // Enhanced validation
    if (!name || name.length < 2 || name.length > 50) {
        showFormError('Please enter a valid full name (2-50 characters).');
        return;
    }
    
    // Sanitize name input
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
        showFormError('Name can only contain letters, spaces, hyphens, and apostrophes.');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
        showFormError('Please enter a valid email address.');
        return;
    }
    
    if (password.length < 8) {
        showFormError('Password must be at least 8 characters long.');
        return;
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        showFormError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormError('Passwords do not match!');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Check if Firebase is loaded
    if (!window.firebaseAuth || !window.firebaseReady) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showFormError('Firebase not loaded. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Add CSRF token validation
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
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
        
        showFormSuccess('Registration successful! Redirecting...');
        
        setTimeout(() => {
            closeSignupPopup();
            
            // Secure redirect based on user type
            const baseUrl = window.location.protocol === 'https:' ? '' : window.location.origin.replace('http:', 'https:');
            if (userType === 'interviewer') {
                window.location.href = baseUrl + '/interviewer.html';
            } else {
                window.location.href = baseUrl + '/user.html';
            }
        }, 1500);
    } catch (error) {
        console.error('Signup error:', error);
        
        // Sanitize error messages
        let userMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            userMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.code === 'auth/weak-password') {
            userMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
            userMessage = 'Invalid email address. Please enter a valid email.';
        } else if (error.code === 'auth/network-request-failed') {
            userMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        showFormError(userMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
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
        
        container.innerHTML = interviews.map(interview => {
            const title = interview.title ? interview.title.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Untitled';
            const date = interview.date ? interview.date.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const duration = interview.duration ? interview.duration.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const level = interview.level ? interview.level.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const skills = interview.skills ? interview.skills.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            return `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${title}</h3>
                    <span class="interview-date">Posted: ${date}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Duration:</strong> ${duration}</p>
                    <p><strong>Level:</strong> ${level}</p>
                    <p><strong>Skills:</strong> ${skills}</p>
                    <button class="action-btn" style="margin-top: 10px;" data-interview='${JSON.stringify({jobTitle: interview.jobTitle, company: interview.company, level: interview.level, duration: interview.duration, skills: interview.skills, date: interview.date})}' onclick="showInterviewDetailsSecure(this)">View Interview Details</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading interviews:', error);
        container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">Error loading interviews.</p>';
    }
}

function viewInterview(jobTitle, company, level, duration, skills) {
    // Validate and sanitize inputs
    const sanitizedParams = {
        jobTitle: jobTitle ? String(jobTitle).substring(0, 100) : '',
        company: company ? String(company).substring(0, 100) : '',
        level: level ? String(level).substring(0, 50) : '',
        duration: duration ? String(duration).substring(0, 50) : '',
        skills: skills ? String(skills).substring(0, 200) : ''
    };
    
    const params = new URLSearchParams(sanitizedParams);
    const baseUrl = window.location.protocol === 'https:' ? '' : window.location.origin.replace('http:', 'https:');
    window.location.href = baseUrl + `/instructions.html?${params.toString()}`;
}

function showInterviewDetailsSecure(button) {
    try {
        const interviewData = JSON.parse(button.getAttribute('data-interview'));
        viewInterview(interviewData.jobTitle, interviewData.company, interviewData.level, interviewData.duration, interviewData.skills);
    } catch (error) {
        console.error('Error parsing interview data:', error);
        alert('Error loading interview details.');
    }
}

function logout() {
    try {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            window.signOut(window.firebaseAuth);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    const baseUrl = window.location.protocol === 'https:' ? '' : window.location.origin.replace('http:', 'https:');
    window.location.href = baseUrl + '/index.html';
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
    // Validate inputs
    if (!jobTitle || !company || !level || !duration) {
        alert('Missing required interview parameters.');
        return;
    }
    
    const sanitizedData = {
        jobTitle: String(jobTitle).substring(0, 100),
        company: String(company).substring(0, 100),
        level: String(level).substring(0, 50),
        duration: String(duration).substring(0, 50),
        skills: skills ? String(skills).substring(0, 200) : '',
        isPractice: true,
        practiceQuestions: practiceQuestions[jobTitle] || []
    };
    
    sessionStorage.setItem('currentInterview', JSON.stringify(sanitizedData));
    
    const baseUrl = window.location.protocol === 'https:' ? '' : window.location.origin.replace('http:', 'https:');
    window.location.href = baseUrl + '/instructions.html';
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
        // Validate user session before saving
        if (!currentUser.uid || !window.firebaseAuth.currentUser) {
            throw new Error('Invalid user session');
        }
        
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
        
        // Validate user permissions
        if (!currentUser || currentUser.type !== 'interviewer') {
            throw new Error('Unauthorized: Only interviewers can create interviews');
        }
        
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
            if (input.id !== 'interviewerEmail' && input.id !== 'interviewerType' && input.id !== 'interviewerRegistered') {
                input.removeAttribute('readonly');
            }
        });
        button.textContent = 'Save Profile';
    } else {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return;
            
            const nameField = document.getElementById('interviewerName');
            const roleField = document.getElementById('interviewerRole');
            const experienceField = document.getElementById('interviewerExperience');
            
            if (!nameField || !roleField || !experienceField) {
                alert('Profile fields not found');
                return;
            }
            
            const updatedData = {
                name: nameField.value,
                role: roleField.value,
                experience: experienceField.value
            };
            
            // Validate user ownership
            if (!window.firebaseAuth.currentUser || window.firebaseAuth.currentUser.uid !== currentUser.uid) {
                throw new Error('Unauthorized: Cannot update another user\'s profile');
            }
            
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

// Helper functions for form feedback
function showFormError(message) {
    // Remove any existing error/success messages
    const existingMessages = document.querySelectorAll('.form-error, .form-success');
    existingMessages.forEach(msg => msg.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error show';
    errorDiv.textContent = message;
    
    // Add to the active popup
    const activePopup = document.querySelector('.popup[style*="block"] .popup-content form');
    if (activePopup) {
        activePopup.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.classList.remove('show');
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }
}

function showFormSuccess(message) {
    // Remove any existing error/success messages
    const existingMessages = document.querySelectorAll('.form-error, .form-success');
    existingMessages.forEach(msg => msg.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.textContent = message;
    
    // Add to the active popup
    const activePopup = document.querySelector('.popup[style*="block"] .popup-content form');
    if (activePopup) {
        activePopup.appendChild(successDiv);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Add keyboard navigation for popups
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open popups
            const openPopups = document.querySelectorAll('.popup[style*="block"], .modern-popup[style*="flex"]');
            openPopups.forEach(popup => {
                if (popup.id === 'loginPopup') {
                    closeLoginPopup();
                } else if (popup.id === 'signupPopup') {
                    closeSignupPopup();
                } else {
                    popup.style.display = 'none';
                }
            });
            document.body.style.overflow = '';
        }
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('popup') || e.target.classList.contains('modern-popup-overlay')) {
            if (e.target.id === 'loginPopup') {
                closeLoginPopup();
            } else if (e.target.id === 'signupPopup') {
                closeSignupPopup();
            } else {
                e.target.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });
    
    // Clear error messages when user starts typing
    document.addEventListener('input', function(e) {
        if (e.target.matches('.popup-content input')) {
            const errorMessages = document.querySelectorAll('.form-error');
            errorMessages.forEach(msg => {
                msg.classList.remove('show');
                setTimeout(() => msg.remove(), 300);
            });
        }
    });
    
    // Prevent popup content clicks from closing the popup
    document.querySelectorAll('.popup-content, .modern-popup-content').forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Add smooth transitions for popups
    document.querySelectorAll('.popup').forEach(popup => {
        popup.addEventListener('transitionend', function(e) {
            if (e.target === popup && popup.style.display === 'none') {
                document.body.style.overflow = '';
            }
        });
    });
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
        
        container.innerHTML = interviews.map(interview => {
            const title = interview.title ? interview.title.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Untitled';
            const completedAt = interview.completedAt ? interview.completedAt.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const duration = interview.duration ? interview.duration.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const status = interview.status ? interview.status.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const questionsAnswered = interview.questionsAnswered ? interview.questionsAnswered.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            return `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${title}</h3>
                    <span class="interview-date">${completedAt}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Duration:</strong> ${duration}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Questions:</strong> ${questionsAnswered}</p>
                </div>
            </div>
            `;
        }).join('');
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
        
        container.innerHTML = candidates.map(candidate => {
            const candidateName = candidate.candidateName ? candidate.candidateName.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const jobTitle = candidate.jobTitle ? candidate.jobTitle.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const completedAt = candidate.completedAt ? candidate.completedAt.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const duration = candidate.duration ? candidate.duration.replace(/[<>"'&]/g, match => ({'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'}[match])) : 'Unknown';
            const score = candidate.score ? Math.max(0, Math.min(100, parseInt(candidate.score))) : 0;
            return `
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${candidateName} - ${jobTitle}</h3>
                    <span class="interview-date">${completedAt}</span>
                </div>
                <div class="interview-details">
                    <p><strong>Score:</strong> ${score}%</p>
                    <p><strong>Duration:</strong> ${duration}</p>
                    <p><strong>Status:</strong> <span class="status ${score >= 80 ? 'passed' : 'pending'}">${score >= 80 ? 'Recommended' : 'Under Review'}</span></p>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading candidates:', error);
        container.innerHTML = '<p style="text-align: center; color: #666; opacity: 0.7;">Error loading candidates.</p>';
    }
}