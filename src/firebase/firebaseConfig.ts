import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB223d5DENG8T5NXEFSYrdLe75cVJuhSf4",
  authDomain: "comics-6abee.firebaseapp.com",
  projectId: "comics-6abee",
  storageBucket: "comics-6abee.firebasestorage.app",
  messagingSenderId: "1040379249935",
  appId: "1:1040379249935:web:e7ec59dc2d5e3844972a7a",
  measurementId: "G-C3GL7FWLEK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };