import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values should ideally come from environment variables for a real project
const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "tamaanina-therapy.firebaseapp.com",
  projectId: "tamaanina-therapy",
  storageBucket: "tamaanina-therapy.appspot.com",
  messagingSenderId: "placeholder-id",
  appId: "placeholder-app-id"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app };