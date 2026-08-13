// Thin wrapper around Firebase Firestore (modular SDK, loaded via CDN in the
// HTML as type="module"). Exposes window.NBFirebase with a small API used by
// app.js and scoreboard.js so those files don't need to know SDK details.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const isConfigured =
  window.FIREBASE_CONFIG &&
  window.FIREBASE_CONFIG.apiKey &&
  !window.FIREBASE_CONFIG.apiKey.startsWith("REPLACE_WITH");

let db = null;
if (isConfigured) {
  try {
    const app = initializeApp(window.FIREBASE_CONFIG);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
}

async function submitScore(record) {
  if (!db) throw new Error("not_configured");
  const colRef = collection(db, window.SCORES_COLLECTION || "crossword_scores");
  await addDoc(colRef, { ...record, createdAt: serverTimestamp() });
}

async function fetchScores() {
  if (!db) throw new Error("not_configured");
  const colRef = collection(db, window.SCORES_COLLECTION || "crossword_scores");
  const q = query(colRef, orderBy("correctCount", "desc"), orderBy("timeSeconds", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

window.NBFirebase = {
  isConfigured,
  submitScore,
  fetchScores,
};

window.dispatchEvent(new Event("nb-firebase-ready"));
