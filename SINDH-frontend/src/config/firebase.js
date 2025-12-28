
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDiBlshtYxqX1EgC7w-4f0KHxZgpq4AAoU",
    authDomain: "foodles-c5afe.firebaseapp.com",
    projectId: "foodles-c5afe",
    storageBucket: "foodles-c5afe.firebasestorage.app",
    messagingSenderId: "310452872150",
    appId: "1:310452872150:web:a65deac53c6ce222ddfa77",
    measurementId: "G-F0BQ1635W2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const auth = getAuth(app);
