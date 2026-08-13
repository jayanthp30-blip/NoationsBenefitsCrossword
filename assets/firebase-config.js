// ---------------------------------------------------------------------------
// Firebase project configuration.
//
// Replace the placeholder values below with the config object from:
//   Firebase Console -> Project settings -> General -> Your apps -> SDK setup
//
// These values are NOT secret — they are meant to be public in client-side
// code. Access control is enforced by Firestore Security Rules, not by
// hiding this config.
// ---------------------------------------------------------------------------
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyADYkWsm6jSOpi02Iyt4eA7elAsGMmLJiM",
  authDomain: "nb-crossword.firebaseapp.com",
  projectId: "nb-crossword",
  storageBucket: "nb-crossword.firebasestorage.app",
  messagingSenderId: "1061232131764",
  appId: "1:1061232131764:web:09d9b5d2c61e1cb41061e1",
};

// Firestore collection name used for score submissions.
window.SCORES_COLLECTION = "crossword_scores";
