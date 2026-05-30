import React, { useState, useEffect } from 'react';
import Landing from './Landing.jsx';
import HostView from './HostView.jsx';
import PlayerView from './PlayerView.jsx';
import AdminView from './AdminView.jsx';
import { QUESTIONS } from './questions.js';
import { QUESTIONS_FR } from './questions_fr.js';
import { loadQuizQuestions, initializeQuestions } from './firebase.js';

const PIN = '1996';

// ── PIN Screen ────────────────────────────────────────────────
function PinScreen({ onSuccess, onCancel }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (digit) => {
    if (value.length >= 4) return;
    const next = value + digit;
    setValue(next);
    if (next.length === 4) {
      if (next === PIN) {
        setTimeout(() => onSuccess(), 200);
      } else {
        setError(true);
        setTimeout(() => { setValue(''); setError(false); }, 800);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #001a6e 0%, #002395 40%, #ED2939 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 340, width: '100%' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>
          Code animateur
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 28, fontWeight: 600 }}>
          Entrez le code PIN à 4 chiffres
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: '50%',
              background: i < value.length ? (error ? '#EF4444' : '#F5A623') : 'rgba(255,255,255,0.2)',
              border: `2px solid ${i < value.length ? (error ? '#EF4444' : '#F5A623') : 'rgba(255,255,255,0.3)'}`,
              transition: 'all 0.15s', animation: error ? 'shake 0.4s ease' : 'none',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button key={i} onClick={() => {
              if (k === '⌫') { setValue(v => v.slice(0, -1)); setError(false); }
              else if (k !== '') handleKey(String(k));
            }}
              disabled={k === ''}
              style={{
                height: 64, borderRadius: 14,
                background: k === '' ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: k === '' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: k === '⌫' ? '1.2rem' : '1.4rem',
                fontWeight: 700, cursor: k === '' ? 'default' : 'pointer',
                transition: 'background 0.15s', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { if (k !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (k !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >{k}</button>
          ))}
        </div>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
        }}>← Retour</button>
        {error && (
          <p style={{ color: '#EF4444', fontWeight: 700, marginTop: 12, fontSize: '0.85rem' }}>
            Code incorrect
          </p>
        )}
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}

// ── Host Menu (Quiz Select + Admin) ───────────────────────────
function HostMenu({ onSelectQuiz, onAdmin, onCancel }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #001a6e 0%, #002395 40%, #ED2939 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎙️</div>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 6 }}>
          Espace animateur
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 28, fontWeight: 600 }}>
          Lance un quiz ou gère les questions
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
          <button onClick={() => onSelectQuiz('franco')} style={quizBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5A623'; e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🌏</div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>Quiz Franco-Australien</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600 }}>Bilingual • Niveau modéré</div>
          </button>

          <button onClick={() => onSelectQuiz('expert')} style={quizBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ED2939'; e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🇫🇷</div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>Quiz Expert Français</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600 }}>En français • Niveau difficile</div>
          </button>

          {/* Admin button */}
          <button onClick={onAdmin} style={{
            ...quizBtnStyle,
            background: 'rgba(245,158,11,0.08)',
            border: '2px solid rgba(245,158,11,0.3)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5A623'; e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚙️</div>
            <div style={{ color: '#F5A623', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>Gérer les questions</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600 }}>Ajouter · Modifier · Supprimer</div>
          </button>
        </div>

        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
        }}>← Retour</button>
      </div>
    </div>
  );
}

const quizBtnStyle = {
  background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: 16, padding: '20px 24px', textAlign: 'left', cursor: 'pointer',
  transition: 'all 0.2s', fontFamily: 'var(--font-body)', width: '100%',
};

// ── App Root ──────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('landing');
  const [selectedType, setSelectedType] = useState('franco');
  const [questions, setQuestions] = useState({ franco: null, expert: null });

  // Load questions from Firebase on startup; initialize if empty
  useEffect(() => {
    const init = async (type, staticQs) => {
      const qs = await loadQuizQuestions(type);
      if (qs && qs.length > 0) {
        setQuestions(prev => ({ ...prev, [type]: qs }));
      } else {
        await initializeQuestions(type, staticQs);
        const initialized = await loadQuizQuestions(type);
        setQuestions(prev => ({ ...prev, [type]: initialized ?? staticQs }));
      }
    };
    init('franco', QUESTIONS);
    init('expert', QUESTIONS_FR);
  }, []);

  const handleQuizSelect = (type) => {
    setSelectedType(type);
    setView('host');
  };

  const activeQuestions = questions[selectedType] ?? (selectedType === 'expert' ? QUESTIONS_FR : QUESTIONS);

  if (view === 'pin')        return <PinScreen onSuccess={() => setView('host-menu')} onCancel={() => setView('landing')} />;
  if (view === 'host-menu')  return <HostMenu onSelectQuiz={handleQuizSelect} onAdmin={() => setView('admin')} onCancel={() => setView('landing')} />;
  if (view === 'host')       return <HostView questions={activeQuestions} quizType={selectedType} onBack={() => setView('landing')} />;
  if (view === 'admin')      return <AdminView onBack={() => setView('host-menu')} />;
  if (view === 'player')     return <PlayerView onBack={() => setView('landing')} />;

  return <Landing onHost={() => setView('pin')} onPlay={() => setView('player')} />;
}
