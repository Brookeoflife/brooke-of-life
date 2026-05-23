
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyCbKKRu8pmh-O6BR6dkeh2H3PsCXu0hkZw",
  authDomain: "brooke-of-life-church-finance.firebaseapp.com",
  projectId: "brooke-of-life-church-finance"
};

/* ================= INIT ================= */

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

auth.useDeviceLanguage?.();

/* ================= OFFLINE SUPPORT ================= */

enableIndexedDbPersistence(db).catch(() => {
  // silently ignore multi-tab / unsupported browsers
});
