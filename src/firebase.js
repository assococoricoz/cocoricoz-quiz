import { initializeApp } from 'firebase/app';
import {
  getDatabase, ref, set, get, update, onValue, increment
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBTP72sOTh-CO3eFtvFcaRTOgF-mXAuEg8",
  authDomain: "cocoricoz.firebaseapp.com",
  databaseURL: "https://cocoricoz-default-rtdb.firebaseio.com",
  projectId: "cocoricoz",
  storageBucket: "cocoricoz.firebasestorage.app",
  messagingSenderId: "734691002225",
  appId: "1:734691002225:web:d863ad52ae77fa897fd8d0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export async function createSession(code, hostId) {
  await set(ref(db, `sessions/${code}`), {
    status: 'lobby', currentQuestion: -1, questionStartTime: 0, hostId, createdAt: Date.now()
  });
}

export async function sessionExists(code) {
  const snap = await get(ref(db, `sessions/${code}`));
  return snap.exists() && snap.val()?.status !== 'finished';
}

export async function joinSession(code, playerId, name) {
  await set(ref(db, `sessions/${code}/players/${playerId}`), {
    name, score: 0, joinedAt: Date.now()
  });
}

export async function startQuestion(code, questionIndex) {
  await update(ref(db, `sessions/${code}`), {
    status: 'question', currentQuestion: questionIndex, questionStartTime: Date.now()
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

export async function submitAnswer(code, playerId, questionIndex, answerIndex, correct, timeMs, points) {
  const answerRef = ref(db, `sessions/${code}/players/${playerId}/answers/${questionIndex}`);
  await set(answerRef, { answerIndex, correct, timeMs, points });
  if (points > 0) {
    await update(ref(db, `sessions/${code}/players/${playerId}`), { score: increment(points) });
  }
}

export function listenToSession(code, callback) {
  return onValue(ref(db, `sessions/${code}`), (snap) => { callback(snap.val()); });
}
