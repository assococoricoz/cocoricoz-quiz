import { initializeApp } from 'firebase/app';
import {
  getDatabase, ref, set, get, update, onValue, increment
} from 'firebase/database';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── Constants ─────────────────────────────────────────────────
const MAX_PLAYERS      = 50;
const MAX_NAME_LENGTH  = 20;
const CODE_REGEX       = /^[A-Z2-9]{5}$/;

// ── Helpers ───────────────────────────────────────────────────
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function sanitizeName(name) {
  return name.trim().slice(0, MAX_NAME_LENGTH).replace(/[<>'"&]/g, '');
}

// ── Session ───────────────────────────────────────────────────
export async function createSession(code, hostId) {
  await set(ref(db, `sessions/${code}`), {
    status: 'lobby', currentQuestion: -1, questionStartTime: 0,
    hostId, createdAt: Date.now(),
  });
}

export async function sessionExists(code) {
  if (!CODE_REGEX.test(code)) return false;
  const snap = await get(ref(db, `sessions/${code}`));
  return snap.exists() && snap.val()?.status !== 'finished';
}

export async function joinSession(code, playerId, name) {
  // Check session is still open and not full
  const snap = await get(ref(db, `sessions/${code}`));
  if (!snap.exists()) throw new Error('Session introuvable.');
  const session = snap.val();
  if (session.status !== 'lobby') throw new Error('La partie a déjà commencé.');
  const playerCount = session.players ? Object.keys(session.players).length : 0;
  if (playerCount >= MAX_PLAYERS) throw new Error(`Session complète (max ${MAX_PLAYERS} joueurs).`);

  const safeName = sanitizeName(name);
  if (!safeName) throw new Error('Prénom invalide.');

  await set(ref(db, `sessions/${code}/players/${playerId}`), {
    name: safeName, score: 0, joinedAt: Date.now(),
  });
}

// ── Host controls ─────────────────────────────────────────────
export async function startQuestion(code, questionIndex) {
  await update(ref(db, `sessions/${code}`), {
    status: 'question', currentQuestion: questionIndex, questionStartTime: Date.now(),
  });
}

export async function revealAnswer(code) {
  await update(ref(db, `sessions/${code}`), { status: 'reveal' });
}

export async function showLeaderboard(code) {
  await update(ref(db, `sessions/${code}`), { status: 'leaderboard' });
}

export async function nextQuestion(code, nextIndex) {
  await startQuestion(code, nextIndex);
}

export async function finishGame(code) {
  await update(ref(db, `sessions/${code}`), { status: 'finished' });
}

// ── Player answer ─────────────────────────────────────────────
export async function submitAnswer(code, playerId, questionIndex, answerIndex, correct, timeMs, points) {
  // Validate all values before sending to Firebase
  if (answerIndex < 0 || answerIndex > 3)   return;
  if (points < 0      || points > 1000)      return;
  if (timeMs < 0)                            return;

  const answerRef = ref(db, `sessions/${code}/players/${playerId}/answers/${questionIndex}`);

  // Prevent double submission (client-side guard + Firebase rules)
  const existing = await get(answerRef);
  if (existing.exists()) return;

  await set(answerRef, {
    answerIndex,
    correct:    !!correct,
    timeMs:     Math.round(timeMs),
    points:     Math.round(points),
  });

  if (points > 0) {
    await update(ref(db, `sessions/${code}/players/${playerId}`), { score: increment(Math.round(points)) });
  }
}

// ── Realtime listener ─────────────────────────────────────────
export function listenToSession(code, callback) {
  return onValue(ref(db, `sessions/${code}`), (snap) => { callback(snap.val()); });
}
