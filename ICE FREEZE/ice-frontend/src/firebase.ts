import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "ice-console-b8d22.firebaseapp.com",
  projectId: "ice-console-b8d22",
  storageBucket: "ice-console-b8d22.firebasestorage.app",
  messagingSenderId: "224282019714",
  appId: "1:224282019714:web:37c40b192eb326c101f19b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutUser = () => signOut(auth);
