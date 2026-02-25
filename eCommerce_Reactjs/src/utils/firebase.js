import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  // apiKey: "AIzaSyC6BDR8vZuUHiqt7VQkhLJ3pxYroNNjntA",
  // authDomain: "ecom-chat-1d35c.firebaseapp.com",
  // projectId: "ecom-chat-1d35c",
  // storageBucket: "ecom-chat-1d35c.appspot.com",
  // messagingSenderId: "517909678281",
  // appId: "1:517909678281:web:ee31dcdc6180e6a3cee518",
  // measurementId: "G-3X0P8VH3KR"
  apiKey: "AIzaSyD8jKMrbC-dKokIPnih4yrW1VK5dk3ETsg",
  authDomain: "ecom-login-a89c0.firebaseapp.com",
  projectId: "ecom-login-a89c0",
  storageBucket: "ecom-login-a89c0.firebasestorage.app",
  messagingSenderId: "296065512693",
  appId: "1:296065512693:web:cb502131c5a7b1567bc1bc",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase;
export const authentication = getAuth(initializeApp(firebaseConfig));
