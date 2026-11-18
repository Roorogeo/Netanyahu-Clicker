// Cloud saves with Firebase Auth + Firestore.
// One document per player at saves/{uid} = { save, rev, updatedAt, summary, device, app }.
// Writes are optimistic: each write must bump `rev` by one (also enforced by firestore.rules),
// so if another device saved in the meantime the write fails with a "conflict" and the
// player chooses what to keep. Before anything in the cloud is replaced, a copy goes to
// saves/{uid}/backups.
import { CLOUD_CONFIG } from "./cloud-config.js";

const MAX_CLOUD_BACKUPS = 20;

// Local testing against the Firebase emulators: http://localhost:8765/?emulator=1
function emulatorMode() {
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  return local && new URLSearchParams(location.search).has("emulator");
}

export function cloudConfigured() {
  return !!CLOUD_CONFIG || emulatorMode();
}

const FRIENDLY = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Please enter a password.",
  "auth/weak-password": "Please choose a password with at least 6 characters.",
  "auth/email-already-in-use": "There's already an account with that email. Try signing in instead.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "There's no account with that email yet.",
  "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
  "auth/network-request-failed": "Couldn't reach the server. Check your connection and try again.",
  "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
  "auth/unauthorized-domain": "Google sign-in isn't enabled for this website yet.",
  "auth/operation-not-allowed": "This sign-in method isn't switched on yet.",
  "auth/requires-recent-login": "For safety, please sign out and sign in again, then try once more.",
  "permission-denied": "The server refused this save.",
  unavailable: "Couldn't reach the server. Your progress is safe on this device and will sync later.",
};
export function friendlyError(e) {
  const code = (e && e.code) || "";
  return FRIENDLY[code] || (e && e.message) || "Something went wrong.";
}

export async function initCloud({ onUser }) {
  if (!cloudConfigured()) return null;
  const fb = await import("../vendor/firebase/firebase.js");
  const emu = emulatorMode();
  const config = emu ? { apiKey: "demo-key", authDomain: "localhost", projectId: "demo-bibi", appId: "demo" } : CLOUD_CONFIG;
  const app = fb.initializeApp(config);
  const auth = fb.getAuth(app);
  const db = fb.getFirestore(app);
  if (emu) {
    fb.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    fb.connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  await fb.setPersistence(auth, fb.browserLocalPersistence).catch(() => {});

  const saveRef = (uid) => fb.doc(db, "saves", uid);
  const backupsRef = (uid) => fb.collection(db, "saves", uid, "backups");
  const device = (navigator.userAgent.match(/(iPhone|iPad|Android|Mac|Windows|Linux|CrOS)/) || ["device"])[0];

  const api = {
    get user() { return auth.currentUser; },

    signUp: (email, password) => fb.createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) => fb.signInWithEmailAndPassword(auth, email, password),
    signInGoogle: () => fb.signInWithPopup(auth, new fb.GoogleAuthProvider()),
    signOut: () => fb.signOut(auth),
    resetPassword: (email) => fb.sendPasswordResetEmail(auth, email),

    // -> null, or { save, rev, summary, updatedAt (ms) }
    async load() {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in");
      const snap = await fb.getDoc(saveRef(u.uid));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { save: d.save, rev: d.rev, summary: d.summary || {}, updatedAt: d.updatedAt ? d.updatedAt.toMillis() : 0 };
    },

    // Write only if the cloud is still at expectedRev (0 = no cloud save yet). Returns the new rev.
    // Throws { code: "conflict", remote } if another device saved first.
    async write(save, summary, expectedRev) {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in");
      const ref = saveRef(u.uid);
      return fb.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const currentRev = snap.exists() ? snap.data().rev : 0;
        if (currentRev !== expectedRev) {
          const d = snap.data();
          const err = new Error("conflict");
          err.code = "conflict";
          err.remote = d ? { save: d.save, rev: d.rev, summary: d.summary || {}, updatedAt: d.updatedAt ? d.updatedAt.toMillis() : 0 } : null;
          throw err;
        }
        const rev = currentRev + 1;
        // Progress going backwards (a wipe, an import or a restore)? Keep the old cloud save first.
        if (snap.exists() && ((snap.data().summary || {}).allTimeVotes || 0) > ((summary || {}).allTimeVotes || 0)) {
          tx.set(fb.doc(backupsRef(u.uid)), {
            save: snap.data().save, summary: snap.data().summary || {},
            reason: "Automatic backup before less progress was saved", createdAt: fb.serverTimestamp(),
          });
        }
        tx.set(ref, { save, rev, summary, updatedAt: fb.serverTimestamp(), device, app: "bibi-clicker" });
        return rev;
      });
    },

    // Keep a copy in the cloud before anything there is replaced
    async backup(save, summary, reason) {
      const u = auth.currentUser;
      if (!u || !save) return;
      await fb.addDoc(backupsRef(u.uid), { save, summary: summary || {}, reason, createdAt: fb.serverTimestamp() });
      // keep the newest MAX_CLOUD_BACKUPS
      const all = await fb.getDocs(fb.query(backupsRef(u.uid), fb.orderBy("createdAt", "desc")));
      const extra = all.docs.slice(MAX_CLOUD_BACKUPS);
      await Promise.all(extra.map((d) => fb.deleteDoc(d.ref)));
    },

    async listBackups() {
      const u = auth.currentUser;
      if (!u) return [];
      const all = await fb.getDocs(fb.query(backupsRef(u.uid), fb.orderBy("createdAt", "desc"), fb.limit(MAX_CLOUD_BACKUPS)));
      return all.docs.map((d) => {
        const x = d.data();
        return { id: d.id, save: x.save, summary: x.summary || {}, reason: x.reason, t: x.createdAt ? x.createdAt.toMillis() : Date.now() };
      });
    },

    // Deletes the cloud save, its backups and the account. Local progress is untouched.
    async deleteAccount() {
      const u = auth.currentUser;
      if (!u) return;
      const all = await fb.getDocs(backupsRef(u.uid));
      await Promise.all(all.docs.map((d) => fb.deleteDoc(d.ref)));
      await fb.deleteDoc(saveRef(u.uid));
      await fb.deleteUser(u);
    },
  };

  fb.onAuthStateChanged(auth, (u) => onUser(u));
  return api;
}
