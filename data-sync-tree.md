# Data Sync Tree - AI Interview Platform

## Overview
This diagram shows the data flow and synchronization patterns between frontend, backend, and Firebase services.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI INTERVIEW PLATFORM                        │
│                      DATA SYNC TREE                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   FIREBASE      │
│   (Client)      │    │   (Server)      │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼

┌─────────────────────────────────────────────────────────────────┐
│                        DATA ENTITIES                            │
└─────────────────────────────────────────────────────────────────┘

1. USER AUTHENTICATION & PROFILE
   ├── Frontend (localStorage)
   │   ├── currentUser: {uid, email, name, type}
   │   └── sessionData: {loginTime, preferences}
   │
   ├── Firebase Auth
   │   ├── Authentication State
   │   └── User Credentials
   │
   └── Firestore Collections
       └── users/{uid}
           ├── name: string
           ├── email: string
           ├── type: "student" | "interviewer"
           ├── role: string (optional)
           ├── experience: string (optional)
           └── registeredAt: timestamp

2. INTERVIEW MANAGEMENT
   ├── Frontend (sessionStorage)
   │   └── currentInterview: {jobTitle, company, level, duration, skills}
   │
   └── Firestore Collections
       ├── availableInterviews/{id}
       │   ├── title: string
       │   ├── jobTitle: string
       │   ├── company: string
       │   ├── level: string
       │   ├── duration: string
       │   ├── skills: string
       │   ├── date: string
       │   ├── interviewerEmail: string
       │   └── createdAt: timestamp
       │
       ├── userInterviews/{id}
       │   ├── title: string
       │   ├── duration: string
       │   ├── completedAt: string
       │   ├── status: "completed"
       │   ├── questionsAnswered: string
       │   └── userId: string
       │
       └── candidateResults/{id}
           ├── candidateName: string
           ├── candidateEmail: string
           ├── jobTitle: string
           ├── company: string
           ├── duration: string
           ├── completedAt: string
           ├── score: number
           ├── interviewerEmail: string
           └── userId: string

┌─────────────────────────────────────────────────────────────────┐
│                      SYNC PATTERNS                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ AUTHENTICATION  │
└─────────────────┘
Frontend ←→ Firebase Auth ←→ Firestore
    │                           │
    ├── Login/Signup            ├── User Profile
    ├── Session Management      ├── User Type Validation
    └── Auto-logout             └── Profile Updates

┌─────────────────┐
│ INTERVIEW FLOW  │
└─────────────────┘
Frontend ←→ Firestore
    │           │
    ├── Create  ├── availableInterviews
    ├── Read    ├── userInterviews
    ├── Update  └── candidateResults
    └── Delete

┌─────────────────┐
│ REAL-TIME SYNC  │
└─────────────────┘
Frontend ←→ Firestore Listeners
    │           │
    ├── Live Updates
    ├── Auto-refresh
    └── Error Handling

┌─────────────────────────────────────────────────────────────────┐
│                    SYNC OPERATIONS                              │
└─────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   Frontend → Firebase Auth → Firestore
   ├── createUserWithEmailAndPassword()
   ├── Store user profile in users/{uid}
   └── Update localStorage with user data

2. USER LOGIN
   Frontend → Firebase Auth → Firestore
   ├── signInWithEmailAndPassword()
   ├── Fetch user profile from users/{uid}
   ├── Validate user type
   └── Store session in localStorage

3. CREATE INTERVIEW
   Frontend → Firestore
   ├── Validate interviewer permissions
   ├── Add to availableInterviews collection
   └── Real-time update to UI

4. TAKE INTERVIEW
   Frontend → Firestore
   ├── Read from availableInterviews
   ├── Store session in sessionStorage
   ├── Save results to userInterviews
   └── Save candidate results to candidateResults

5. LOAD USER DATA
   Frontend ← Firestore
   ├── Query userInterviews by userId
   ├── Query candidateResults by interviewerEmail
   └── Update UI with sanitized data

┌─────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

1. NETWORK ERRORS
   ├── Retry mechanisms
   ├── Offline detection
   └── User notifications

2. AUTHENTICATION ERRORS
   ├── Session validation
   ├── Auto-logout on invalid session
   └── Secure error messages

3. DATA VALIDATION
   ├── Client-side validation
   ├── Server-side validation
   └── Sanitization before storage

┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY MEASURES                              │
└─────────────────────────────────────────────────────────────────┘

1. DATA PROTECTION
   ├── HTTPS enforcement
   ├── Input sanitization
   ├── XSS prevention
   └── CSRF token validation

2. ACCESS CONTROL
   ├── User authentication
   ├── Role-based permissions
   ├── Session management
   └── Data ownership validation

3. SECURE STORAGE
   ├── Firebase Security Rules
   ├── Encrypted connections
   └── Minimal data exposure

┌─────────────────────────────────────────────────────────────────┐
│                    SYNC FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────┘

User Action → Frontend Validation → Firebase Operation → UI Update
     │              │                      │               │
     ├── Input      ├── Sanitize          ├── Auth        ├── Success
     ├── Click      ├── Validate          ├── Store       ├── Error
     └── Submit     └── Secure            └── Query       └── Loading

┌─────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE OPTIMIZATION                      │
└─────────────────────────────────────────────────────────────────┘

1. CACHING STRATEGY
   ├── localStorage for user sessions
   ├── sessionStorage for temporary data
   └── Firebase offline persistence

2. LAZY LOADING
   ├── Load data on demand
   ├── Pagination for large datasets
   └── Progressive enhancement

3. BATCH OPERATIONS
   ├── Batch writes to Firestore
   ├── Minimize network requests
   └── Efficient queries with indexes
```

## Key Sync Points

### 1. Authentication Sync
- **Frontend**: Manages UI state and user sessions
- **Firebase Auth**: Handles authentication
- **Firestore**: Stores user profiles and permissions

### 2. Interview Data Sync
- **Create**: Interviewer creates → Firestore → Available to students
- **Take**: Student takes → Results stored → Visible to interviewer
- **History**: Personal history synced per user

### 3. Real-time Updates
- **Live data**: Firestore listeners for real-time updates
- **Auto-refresh**: Periodic data synchronization
- **Error recovery**: Automatic retry and fallback mechanisms

### 4. Security Sync
- **Session validation**: Continuous auth state monitoring
- **Permission checks**: Role-based access control
- **Data sanitization**: Input/output filtering at all levels