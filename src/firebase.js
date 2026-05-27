import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBTP72sOTh-CO3eFtvFcaRTOgF-mXAuEg8",
  authDomain: "cocoricoz.firebaseapp.com",
  databaseURL: "https://cocoricoz-default-rtdb.firebaseio.com",
  projectId: "cocoricoz",
  storageBucket: "cocoricoz.firebasestorage.app",
  messagingSenderId: "734691002225",
  appId: "1:734691002225:web:d863ad52ae77fa897fd8d0"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
