import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCEV6ZbJZN89sXyvQMO8BhPbUE5NRJwXKI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sports-fanatics.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sports-fanatics",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sports-fanatics.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "395597688864",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:395597688864:web:18fede5640a84ff271cc45",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CFYQVMLWBJ"
};

const app = initializeApp(firebaseConfig);

// Initialize analytics only on client side
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add scopes to ensure proper authentication
provider.addScope('email');
provider.addScope('profile');

// Set custom parameters to ensure proper authentication flow
provider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

const db = getFirestore(app);

export { auth, provider, db, analytics }; 