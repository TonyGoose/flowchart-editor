// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Сюда вставь свои данные из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDeKkyK3n0-vzJ9Ju9FZ3EHFt0mr3WzqNM",
  authDomain: "block-scheme-tester.firebaseapp.com",
  projectId: "block-scheme-tester",
  storageBucket: "block-scheme-tester.firebasestorage.app",
  messagingSenderId: "557568878723",
  appId: "1:557568878723:web:1d51af01acfd27d2a853b6"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем сервисы, которые будем использовать
export const db = getFirestore(app);
export const auth = getAuth(app);