import React, { useState } from 'react';
import Landing from './Landing.jsx';
import HostView from './HostView.jsx';
import PlayerView from './PlayerView.jsx';
import { QUESTIONS, QUESTION_TIME } from './questions.js';
import { QUESTIONS_FR } from './questions_fr.js';

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

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: '50%',
              background: i < value.length ? (error ? '#EF4444' : '#F5A623') : 'rgba(255,255,255,0.2)',
              border: `2px solid ${i < value.length ? (error ? '#EF4444' : '#F5A623') : 'rgba(255,255,255,0.3)'}`,
              transition: 'all 0.15s',
              animation: error ? 'shake 0.4s ease' : 'none',
            }} />
          ))}
        </div>

        {/* Keypad */}
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
                transition: 'background 0.15s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { if (k !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (k !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              {k}
            </button>
          ))}
        </div>

        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
        }}>
          ← Retour
        </button>

        {error && (
          <p style={{ color: '#EF4444', fontWeight: 700, marginTop: 12, fontSize: '0.85rem', animation: 'fadeIn 0.2s' }}>
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

// ── Quiz Selection ────────────────────────────────────────────
function QuizSelect({ onSelect, onCancel }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #001a6e 0%, #002395 40%, #ED2939 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎙️</div>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 6 }}>
          Choisir le quiz
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 28, fontWeight: 600 }}>
          Sélectionne le quiz selon ton public
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quiz 1 */}
          <button onClick={() => onSelect('franco')} style={{
            background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 16, padding: '20px 24px', textAlign: 'left', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'var(--font-body)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = '#F5A623'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🌏</div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>
              Quiz Franco-Australien
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600 }}>
              25 questions • Bilingual • Niveau modéré
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 4 }}>
              Food, Geography, Pop Culture, History, France & Australia
            </div>
          </button>

          {/* Quiz 2 */}
          <button onClick={() => onSelect('expert')} style={{
            background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 16, padding: '20px 24px', textAlign: 'left', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'var(--font-body)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = '#ED2939'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🇫🇷</div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>
              Quiz Expert Français
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600 }}>
              24 questions • En français • Niveau difficile
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 4 }}>
              Histoire, Littérature, Grammaire, Cinéma, Musique, Politique
            </div>
          </button>
        </div>

        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, marginTop: 20,
        }}>
          ← Retour
        </button>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('landing'); // landing | pin | quiz-select | host | player
  const [selectedQuestions, setSelectedQuestions] = useState(QUESTIONS);

  const handlePinSuccess = () => setView('quiz-select');

  const handleQuizSelect = (type) => {
    setSelectedQuestions(type === 'expert' ? QUESTIONS_FR : QUESTIONS);
    setView('host');
  };

  if (view === 'pin') return (
    <PinScreen onSuccess={handlePinSuccess} onCancel={() => setView('landing')} />
  );

  if (view === 'quiz-select') return (
    <QuizSelect onSelect={handleQuizSelect} onCancel={() => setView('landing')} />
  );

  if (view === 'host') return (
    <HostView questions={selectedQuestions} onBack={() => setView('landing')} />
  );

  if (view === 'player') return (
    <PlayerView onBack={() => setView('landing')} />
  );

  return (
    <Landing
      onHost={() => setView('pin')}
      onPlay={() => setView('player')}
    />
  );
}
