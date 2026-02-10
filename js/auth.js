import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

const waitForAuth = () => new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    resolve(user);
  });
});

const requireAuth = async (redirectUrl = "login.html") => {
  const user = await waitForAuth();
  if (!user) {
    window.location.href = redirectUrl;
    return null;
  }
  return user;
};

const signUp = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
};

const signIn = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user.emailVerified) {
    await signOut(auth);
    const error = new Error("Email not verified");
    error.code = "auth/email-not-verified";
    throw error;
  }
  return credential.user;
};

const signOutUser = async () => signOut(auth);

const learncraftAuth = {
  auth,
  observeAuthState,
  requireAuth,
  signUp,
  signIn,
  signOutUser
};

window.learncraftAuth = learncraftAuth;
window.dispatchEvent(new Event("learncraft-auth-ready"));

export {
  auth,
  observeAuthState,
  requireAuth,
  signUp,
  signIn,
  signOutUser
};
