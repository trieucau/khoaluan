//modular v9
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdtfOTuT5t5_fv6VroGLE6-AFd_EuHElc",
  authDomain: "khoaluan-login.firebaseapp.com",
  projectId: "khoaluan-login",
  storageBucket: "khoaluan-login.firebasestorage.app",
  messagingSenderId: "550151094735",
  appId: "1:550151094735:web:f3ce209f20109c805812ba",
};

const app = initializeApp(firebaseConfig);

export const authentication = getAuth(app);
