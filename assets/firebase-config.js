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
  apiKey: "REPLACE_WITH_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID",
};

// Firestore collection name used for score submissions.
window.SCORES_COLLECTION = "crossword_scores";
