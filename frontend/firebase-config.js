// Firebase configuration - using environment variables for security
// Note: For client-side apps, these values are public but should still be managed securely
const getConfigValue = (key, fallback) => {
    return window.ENV?.[key] || fallback;
};

export const firebaseConfig = {
    apiKey: getConfigValue('FIREBASE_API_KEY', 'AIzaSyBCNrh-JW6k-Xy_Fr4uEgC1av2b0bqT3ug'),
    authDomain: getConfigValue('FIREBASE_AUTH_DOMAIN', 'ai-interview-platform-da101.firebaseapp.com'),
    projectId: getConfigValue('FIREBASE_PROJECT_ID', 'ai-interview-platform-da101'),
    storageBucket: getConfigValue('FIREBASE_STORAGE_BUCKET', 'ai-interview-platform-da101.firebasestorage.app'),
    messagingSenderId: getConfigValue('FIREBASE_MESSAGING_SENDER_ID', '1000964103881'),
    appId: getConfigValue('FIREBASE_APP_ID', '1:1000964103881:web:d7b6b9f76c63081eebb718'),
    measurementId: getConfigValue('FIREBASE_MEASUREMENT_ID', 'G-PYTF9RLXV0')
};

// Alternative configuration for different environments
export const getFirebaseConfig = () => {
    // In a real production app, you might check window.location.hostname
    // or other environment indicators to return different configs
    return firebaseConfig;
};

// Validation function to ensure all required config values are present
export const validateFirebaseConfig = (config) => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
    }
    
    return true;
};