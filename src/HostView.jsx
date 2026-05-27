import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateCode, generateId, createSession, listenToSession,
  startQuestion, revealAnswer, showLeaderboard, nextQuestion, finishGame
} from './firebase.js';
import { QUESTIONS, QUESTION_TIME } from './questions.js';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['var(--opt-a)', 'var(--opt-b)', 'var(--opt-c)', 'var(--opt-d)'];

function TimerRing({ timeLeft, total }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const dashOffset = circumference * (1 - progress);
  const color = timeLeft > 10 ? '#22C55E' : timeLeft > 5 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" className="timer-ring">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', fontWeight: 900, color
      }}>
        {timeLeft}
      </div>
    </div>
  );
}

function Leaderboard({ players, onNext, isLast, questionIndex }) {
  const sorted = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const medalClass = (i) => {
    if (i === 0) return 'medal-1';
    if (i === 1) return 'medal-2';
    if (i === 2) return 'medal-3';
    return 'medal-n';
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 4 }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--gold)', marginBottom: 4 }}>
          Classement
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
          Question {questionIndex + 1} / {QUESTIONS.length}
        </p>
      </div>

      {sorted.map((player, i) => (
        <div key={player.id} className="lb-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className={`lb-rank ${medalClass(i)}`}>
            {i < 3 ? medals[i] : i + 1}
          </div>
          <div style={{ flex: 1, fontWeight: 800, fontSize: '1rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.name}
          </div>
          <div style={{ fontWeight: 900, color: 'var(--gold)', fontSize: '1rem' }}>
            {player.score} pts
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 24 }}>
          Aucun joueur encore...
        </p>
      )}

      <button
        className="btn-primary"
        style={{ marginTop: 24 }}
        onClick={onNext}
      >
        {isLast ? '🎊 Voir les résultats finaux' : `➡️ Question ${questionIndex + 2}`}
      </button>
    </div>
  );
}

export default function HostView({ onBack }) {
  const [phase, setPhase] = useState('creating'); // creating | lobby | question | reveal | leaderboard | finished
  const [code, setCode] = useState('');
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef(null);
  const revealedRef = useRef(false);
  const hostId = useRef(generateId());

  // Create session on mount
  useEffect(() => {
    const c = generateCode();
    setCode(c);
    createSession(c, hostId.current).then(() => {
      setPhase('lobby');
    });
  }, []);

  // Listen to session
  useEffect(() => {
    if (!code) return;
    const unsub = listenToSession(code, (data) => {
      setSession(data);
    });
    return unsub;
  }, [code]);

  // Sync phase from Firebase
  useEffect(() => {
    if (!session) return;
    const s = session.status;
    if (s === 'question') {
      revealedRef.current = false;
      const elapsed = Math.floor((Date.now() - session.questionStartTime) / 1000);
      const remaining = Math.max(0, QUESTION_TIME - elapsed);
      setTimeLeft(remaining);
      setPhase('question');
    } else if (s === 'reveal') {
      clearInterval(timerRef.current);
      setPhase('reveal');
    } else if (s === 'leaderboard') {
      setPhase('leaderboard');
    } else if (s === 'finished') {
      setPhase('finished');
    }
  }, [session?.status, session?.currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!revealedRef.current) {
            revealedRef.current = true;
            revealAnswer(code);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, code]);

  const players = session?.players || {};
  const playerCount = Object.keys(players).length;
  const currentQ = session?.currentQuestion ?? -1;
  const question = currentQ >= 0 ? QUESTIONS[currentQ] : null;

  // Count answers for current question
  const answeredCount = question
    ? Object.values(players).filter(p => p.answers?.[currentQ] !== undefined).length
    : 0;

  const handleStartGame = () => startQuestion(code, 0);

  const handleReveal = () => {
    if (!revealedRef.current) {
      revealedRef.current = true;
      clearInterval(timerRef.current);
      revealAnswer(code);
    }
  };

  const handleShowLeaderboard = () => showLeaderboard(code);

  const handleNext = () => {
    const nextIdx = currentQ + 1;
    if (nextIdx >= QUESTIONS.length) {
      finishGame(code);
    } else {
      nextQuestion(code, nextIdx);
    }
  };

  // Answer distribution for reveal
  const answerDist = question
    ? OPTION_LABELS.map((_, i) =>
        Object.values(players).filter(p => p.answers?.[currentQ]?.answerIndex === i).length
      )
    : [];

  const maxDist = Math.max(...answerDist, 1);

  if (phase === 'creating') {
    return (
      <div className="host-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
          <p style={{ fontWeight: 700, opacity: 0.7 }}>Création de la session...</p>
        </div>
      </div>
    );
  }

  if (phase === 'lobby') {
    const playerList = Object.values(players);
    return (
      <div className="host-screen" style={{ padding: '20px 16px', overflowY: 'auto' }}>
        <div className="tricolor" style={{ marginBottom: 20, borderRadius: 4 }} />
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={onBack} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', padding: 4 }}>←</button>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '1.4rem' }}>Salle d'attente</h1>
          </div>

          {/* Code display */}
          <div className="host-card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Code de la session
            </p>
            <div className="session-code">{code}</div>

            {/* QR Code */}
            <div style={{
              display: 'inline-block',
              background: 'white',
              borderRadius: 16,
              padding: 16,
              marginTop: 16,
              marginBottom: 8,
              boxShadow: '0 0 0 4px rgba(245,166,35,0.3)',
            }}>
              <QRCodeSVG
                value={`${window.location.origin}/?code=${code}`}
                size={160}
                bgColor="#ffffff"
                fgColor="#0D1117"
                level="M"
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: 4 }}>
              📱 Scanne ou tape le code ci-dessus
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginTop: 4, wordBreak: 'break-all' }}>
              {window.location.origin}
            </p>
          </div>

          {/* Player count */}
          <div className="host-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Joueurs connectés</span>
              <span style={{ color: 'var(--gold)', fontWeight: 900, fontSize: '1.3rem' }}>{playerCount}</span>
            </div>
            {playerList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {playerList.map((p, i) => (
                  <div key={i} style={{
                    background: 'var(--dark3)', borderRadius: 999, padding: '6px 14px',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    animation: 'fadeIn 0.3s ease forwards'
                  }}>
                    🎮 {p.name}
                  </div>
                ))}
              </div>
            )}
            {playerList.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center' }}>
                En attente des joueurs...
              </p>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleStartGame}
            disabled={playerCount === 0}
            style={{ fontSize: '1.1rem', padding: '18px' }}
          >
            🚀 Lancer le quiz ! ({playerCount} joueur{playerCount !== 1 ? 's' : ''})
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: 12 }}>
            {QUESTIONS.length} questions • {QUESTION_TIME}s par question
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'question' && question) {
    return (
      <div className="host-screen" style={{ padding: '16px', overflowY: 'auto' }}>
        <div className="tricolor" style={{ marginBottom: 16, borderRadius: 4 }} />
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>
              {question.category}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 20 }}>
            <div className="progress-fill" style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }} />
          </div>

          {/* Question + Timer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
                color: 'white',
                lineHeight: 1.3,
              }}>
                {question.question}
              </h2>
            </div>
            <TimerRing timeLeft={timeLeft} total={QUESTION_TIME} />
          </div>

          {/* Options display */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {question.options.map((opt, i) => (
              <div key={i} style={{
                background: OPTION_COLORS[i],
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: i === question.correct ? 1 : 0.85,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, color: 'white', fontSize: '0.85rem', flexShrink: 0
                }}>
                  {OPTION_LABELS[i]}
                </div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>{opt}</span>
              </div>
            ))}
          </div>

          {/* Answer count */}
          <div className="host-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 700 }}>ONT RÉPONDU</p>
              <p className="answer-count">{answeredCount}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}> / {playerCount}</span></p>
            </div>
            <button
              onClick={handleReveal}
              style={{
                background: 'var(--red)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              Révéler ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && question) {
    return (
      <div className="host-screen" style={{ padding: '16px', overflowY: 'auto' }}>
        <div className="tricolor" style={{ marginBottom: 16, borderRadius: 4 }} />
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            color: 'white',
            marginBottom: 20,
            lineHeight: 1.3,
          }}>
            {question.question}
          </h2>

          {/* Options with reveal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correct;
              const count = answerDist[i] || 0;
              const barWidth = maxDist > 0 ? (count / maxDist) * 100 : 0;
              return (
                <div key={i} style={{
                  background: isCorrect ? 'var(--green)' : OPTION_COLORS[i],
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: isCorrect ? 1 : 0.45,
                  position: 'relative',
                  overflow: 'hidden',
                  border: isCorrect ? '3px solid white' : '3px solid transparent',
                  transform: isCorrect ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: 'white', fontSize: '0.85rem', flexShrink: 0
                  }}>
                    {isCorrect ? '✓' : OPTION_LABELS[i]}
                  </div>
                  <span style={{ color: 'white', fontWeight: 800, flex: 1 }}>{opt}</span>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 999,
                    padding: '3px 10px',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="host-card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--green)' }}>
                {answerDist[question.correct] || 0}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700 }}>CORRECTS</div>
            </div>
            <div className="host-card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--red)' }}>
                {answeredCount - (answerDist[question.correct] || 0)}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700 }}>INCORRECTS</div>
            </div>
            <div className="host-card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
                {playerCount - answeredCount}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700 }}>PAS RÉPONDU</div>
            </div>
          </div>

          <button className="btn-primary" onClick={handleShowLeaderboard}>
            🏆 Voir le classement
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'leaderboard') {
    return (
      <div className="host-screen" style={{ overflowY: 'auto' }}>
        <div className="tricolor" style={{ margin: '16px 16px 0', borderRadius: 4 }} />
        <Leaderboard
          players={players}
          questionIndex={currentQ}
          isLast={currentQ >= QUESTIONS.length - 1}
          onNext={handleNext}
        />
      </div>
    );
  }

  if (phase === 'finished') {
    const sorted = Object.values(players).sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <div className="host-screen" style={{ padding: '20px 16px', overflowY: 'auto' }}>
        <div className="tricolor" style={{ marginBottom: 20, borderRadius: 4 }} />
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎊</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--gold)',
            marginBottom: 4
          }}>
            Quiz terminé !
          </h1>
          {winner && (
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontWeight: 700 }}>
              Félicitations à <span style={{ color: 'var(--gold)' }}>{winner.name}</span> ! 🎉
            </p>
          )}

          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            {sorted.slice(0, 10).map((p, i) => (
              <div key={i} className="lb-row" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`lb-rank ${i < 3 ? ['medal-1','medal-2','medal-3'][i] : 'medal-n'}`}>
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div style={{ flex: 1, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                <div style={{ fontWeight: 900, color: 'var(--gold)' }}>{p.score} pts</div>
              </div>
            ))}
          </div>

          <button className="btn-secondary" onClick={onBack}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return null;
}
