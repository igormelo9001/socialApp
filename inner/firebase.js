// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqizBB_giaJIJSQk3xPIn6WBY4_75xW2U",
  authDomain: "innerapp-fb307.firebaseapp.com",
  projectId: "innerapp-fb307",
  storageBucket: "innerapp-fb307.appspot.com",
  messagingSenderId: "883109548398",
  appId: "1:883109548398:web:28872b2ec9b87436ecb17f",
  measurementId: "G-J8LCBEF22W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
