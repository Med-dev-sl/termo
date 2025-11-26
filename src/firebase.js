// Firebase initialization and auth helpers
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBupD9-wSmpUMRJJ9A3mDGE9eZn28tjsqE',
  authDomain: 'termophysics-e9fc1.firebaseapp.com',
  projectId: 'termophysics-e9fc1',
  storageBucket: 'termophysics-e9fc1.firebasestorage.app',
  messagingSenderId: '606726165650',
  appId: '1:606726165650:web:c8300f3ba1d7ba5b5c424b',
  measurementId: 'G-J0X215PS3F',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics may fail during SSR or in test environments; ignore
  // console.warn('Analytics not available', e);
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

function signupWithEmail(name, email, password) {
  return createUserWithEmailAndPassword(auth, email, password).then(userCred => {
    // set display name
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, { displayName: name }).then(() => userCred);
    }
    return userCred;
  });
}

function logout() {
  return signOut(auth);
}

export {
  app,
  analytics,
  db,
  auth,
  provider,
  signInWithGoogle,
  loginWithEmail,
  signupWithEmail,
  logout,
};
