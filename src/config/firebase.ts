// Firebase configuration
// Replace these values with your actual Firebase project credentials.
// Create a project at https://console.firebase.google.com, enable Firestore
// and Google Authentication, then paste the config object here.

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1qE6J4bk-1vOWBrsbljFVGD_L4Z14T8A",
  authDomain: "kaziranga-voice.firebaseapp.com",
  projectId: "kaziranga-voice",
  storageBucket: "kaziranga-voice.firebasestorage.app",
  messagingSenderId: "886924812961",
  appId: "1:886924812961:web:94870384fb981f84b986e0",
  measurementId: "G-X0KGHM820L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({ prompt: 'select_account' });
