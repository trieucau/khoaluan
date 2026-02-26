//modular v9
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.APP_FIREBASE_APIKEY,
  authDomain: process.env.APP_FIREBASE_AUTHDOMAIN,
  projectId: process.env.APP_FIREBASE_PROJECTID,
  storageBucket: process.env.APP_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.APP_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.APP_FIREBASE_APPID,
};

const app = initializeApp(firebaseConfig);

export const authentication = getAuth(app);
