// src/config/firebase/firebase-config.js
import { initializeApp } from "firebase/app";
import { addDoc, collection, deleteDoc, updateDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, query, where, getFirestore, increment } from "firebase/firestore";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword, fetchSignInMethodsForEmail,
    sendPasswordResetEmail, signInWithEmailAndPassword, sendEmailVerification, signOut
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Carregar as variáveis de ambiente
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export {
    auth, db,
    addDoc, collection, deleteDoc, updateDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, getFirestore, increment, query, where,
    onAuthStateChanged, createUserWithEmailAndPassword, fetchSignInMethodsForEmail,
    sendPasswordResetEmail, signInWithEmailAndPassword, sendEmailVerification, signOut,
};