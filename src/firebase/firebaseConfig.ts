// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBK_09knHr3rmjiTE5VwUaK9fL0Rb4FUMU",
  authDomain: "dirbiyaber-80b1d.firebaseapp.com",
  projectId: "dirbiyaber-80b1d",
  storageBucket: "dirbiyaber-80b1d.firebasestorage.app",
  messagingSenderId: "76791122642",
  appId: "1:76791122642:web:a1a43082cabd8e6791fb0b",
  measurementId: "G-NVLWYL56TT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { firebaseConfig };
export { app };