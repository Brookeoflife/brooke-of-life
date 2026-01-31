
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

/* ================= INITIALIZE ================= */

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ================= AUTH ================= */

auth.useDeviceLanguage();

/* ================= OFFLINE MODE ================= */

(async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log("✅ Offline support enabled");
  } catch (err) {
    if (err.code === "failed-precondition") {
      console.warn("⚠ Multiple tabs open – offline disabled");
    } else if (err.code === "unimplemented") {
      console.warn("⚠ Browser does not support offline mode");
    }
  }
})();
