# Firebase Setup Instructions

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Enter project name: "ai-interview-platform"
4. Enable Google Analytics (optional)

## 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

## 3. Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location (closest to your users)

## 4. Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon to add web app
4. Register app with name "AI Interview Platform"
5. Copy the firebaseConfig object

## 5. Update Configuration
Replace the firebaseConfig in index.html with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## 6. Security Rules (Optional)
Update Firestore rules to secure user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```