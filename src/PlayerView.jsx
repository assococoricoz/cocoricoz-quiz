import React, { useState, useEffect, useRef } from 'react';
import {
  generateId, sessionExists, joinSession, listenToSession, submitAnswer, loadQuizQuestions
} from './firebase.js';
import { QUESTIONS, QUESTION_TIME } from './questions.js';
import { QUESTIONS_FR } from './questions_fr.js';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['var(--opt-a)', 'var(--opt-b)', 'var(--opt-c)', 'var(--opt-d)'];

function calcPoints(timeMs) {
  const ratio = Math.max(0, 1 - timeMs / (QUESTION_TIME * 1000));
  return Math.round(500 + 500 * ratio);
}

export default function PlayerView({ onBack }) {
  const [phase, setPhase] = useState('joining');
  const [activeQuestions, setActiveQuestions] = useState(QUESTIONS);
  const [name, setName] = useState('');
  const [codeInput, setCodeInput] = useState(() => {
    // Pre-fill code from URL if present (?code=XXXXX)
    const params = new URLSearchParams(window.location.search);
    return params.get('code')?.toUpperCase() || '';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [lastResult, setLastResult] = useState(null); // { correct, points, totalScore }
  const [myScore, setMyScore] = useState(0);
  const timerRef = useRef(null);
  const playerId = useRef(null);
  const sessionCode = useRef(null);
  const answeredRef = useRef(new Set());

  // Listen to session once joined
  useEffect(() => {
    if (!sessionCode.current) return;
    const unsub = listenToSession(sessionCode.current, (data) => {
      setSession(data);
    });
    return unsub;
  }, [phase === 'lobby' || phase === 'question' || phase === 'answered' || phase === 'reveal' || phase === 'leaderboard' || phase === 'finished']);

  // React to session status changes
  useEffect(() => {
    if (!session || !playerId.current) return;
    const status = session.status;
    const currentQ = session.currentQuestion;

    if (status === 'question') {
      // Only transition if this is a new question
      if (!answeredRef.current.has(currentQ)) {
        setSelectedAnswer(null);
        const elapsed = Math.floor((Date.now() - session.questionStartTime) / 1000);
        const remaining = Math.max(0, QUESTION_TIME - elapsed);
        setTimeLeft(remaining);
        setPhase('question');
      }
    } else if (status === 'reveal') {
      clearInterval(timerRef.current);
      // Compute result for this question
      const myPlayerData = session.players?.[playerId.current];
      const myAnswer = myPlayerData?.answers?.[currentQ];
      const question = activeQuestions[currentQ];
      if (myAnswer !== undefined) {
        setLastResult({
          correct: myAnswer.correct,
          points: myAnswer.points,
          totalScore: myPlayerData?.score || 0,
          correctAnswer: question?.correct,
          selectedAnswer: myAnswer.answerIndex,
        });
      } else {
        // No answer submitted - timed out
        setLastResult({
          correct: false,
          points: 0,
          totalScore: myPlayerData?.score || 0,
          correctAnswer: question?.correct,
          selectedAnswer: null,
        });
      }
      setMyScore(myPlayerData?.score || 0);
      setPhase('reveal');
    } else if (status === 'leaderboard') {
      setPhase('leaderboard');
    } else if (status === 'finished') {
      setPhase('finished');
    } else if (status === 'lobby') {
      setPhase('lobby');
    }
  }, [session?.status, session?.currentQuestion]);

  // Timer countdown for player
  useEffect(() => {
    if (phase !== 'question') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, session?.currentQuestion]);

  const handleJoin = async () => {
    if (!name.trim() || !codeInput.trim()) {
      setError('Remplis tous les champs !');
      return;
    }
    if (name.trim().length > 20) {
      setError('Pseudo trop long (max 20 caractères)');
      return;
    }
    setLoading(true);
    setError('');
    const c = codeInput.trim().toUpperCase();
    try {
      const exists = await sessionExists(c);
      if (!exists) {
        setError('Code invalide ou partie terminée.');
        setLoading(false);
        return;
      }
      playerId.current = generateId();
      sessionCode.current = c;
      const sessionData = await joinSession(c, playerId.current, name.trim());

      // Load questions from Firebase based on session's quizType
      const quizType = sessionData?.quizType || 'franco';
      const qs = await loadQuizQuestions(quizType);
      if (qs && qs.length > 0) setActiveQuestions(qs);

      setLoading(false);
      setPhase('lobby');
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Réessaie.');
      setLoading(false);
      return;
    }

    // Start listening
    const unsub = listenToSession(c, (data) => {
      setSession(data);
    });
    // Store unsub in ref if needed
  };

  const handleAnswer = async (answerIndex) => {
    if (selectedAnswer !== null) return; // already answered
    const currentQ = session.currentQuestion;
    if (answeredRef.current.has(currentQ)) return;

    clearInterval(timerRef.current);
    setSelectedAnswer(answerIndex);
    answeredRef.current.add(currentQ);

    const question = activeQuestions[currentQ];
    const correct = answerIndex === question.correct;
    const timeMs = (QUESTION_TIME - timeLeft) * 1000;
    const points = correct ? calcPoints(timeMs) : 0;

    await submitAnswer(sessionCode.current, playerId.current, currentQ, answerIndex, correct, timeMs, points);
    setPhase('answered');
  };

  // --- JOINING SCREEN ---
  if (phase === 'joining') {
    return (
      <div className="screen" style={{
        background: 'var(--cream)',
        padding: '24px 20px',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--text)',
            opacity: 0.5, fontSize: '1.5rem', marginBottom: 20, cursor: 'pointer'
          }}>←</button>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🐓</div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: 'var(--blue)',
              marginBottom: 4
            }}>Rejoindre le quiz</h1>
            <div className="tricolor" style={{ maxWidth: 120, margin: '0 auto', borderRadius: 999 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', opacity: 0.6, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Ton prénom
              </label>
              <input
                className="join-input"
                type="text"
                placeholder="Marie, Jean, Sophie..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={20}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', opacity: 0.6, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Code de la session
              </label>
              <input
                className="join-input code"
                type="text"
                placeholder="EX: PARIS"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
              />
              {codeInput && new URLSearchParams(window.location.search).get('code') && (
                <p style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700, marginTop: 6 }}>
                  ✅ Code pré-rempli via QR code
                </p>
              )}
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FECACA',
                borderRadius: 10, padding: '10px 14px',
                color: '#DC2626', fontWeight: 700, fontSize: '0.9rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleJoin}
              disabled={loading || !name.trim() || !codeInput.trim()}
              style={{ marginTop: 4 }}
            >
              {loading ? 'Connexion...' : 'Rejoindre 🚀'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOBBY ---
  if (phase === 'lobby') {
    const playerCount = Object.keys(session?.players || {}).length;
    return (
      <div className="screen" style={{
        background: 'linear-gradient(160deg, var(--blue) 0%, #001a6e 100%)',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🐓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>
            Salut {name} !
          </h2>
          <p style={{ opacity: 0.6, marginBottom: 32, fontWeight: 600 }}>
            Tu es bien connecté·e
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '24px',
            backdropFilter: 'blur(10px)',
            marginBottom: 24,
          }}>
            <p style={{ fontWeight: 700, opacity: 0.7, marginBottom: 8, fontSize: '0.85rem' }}>
              EN ATTENTE DE L'ANIMATEUR
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>
              {playerCount} joueur{playerCount > 1 ? 's' : ''} connecté{playerCount > 1 ? 's' : ''}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <p style={{ opacity: 0.4, fontSize: '0.8rem', fontWeight: 700 }}>
              Code • {sessionCode.current}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION ---
  if ((phase === 'question' || phase === 'answered') && session?.currentQuestion >= 0) {
    const currentQ = session.currentQuestion;
    const question = activeQuestions[currentQ];
    const isAnswered = phase === 'answered';
    const timerColor = timeLeft > 10 ? 'var(--green)' : timeLeft > 5 ? 'var(--gold)' : 'var(--red)';

    return (
      <div className="screen" style={{
        background: 'var(--cream)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--blue)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em' }}>
              {question.category}
            </p>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
              Q{currentQ + 1}/{activeQuestions.length}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="score-chip">⭐ {myScore}</div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: isAnswered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 900, color: isAnswered ? 'rgba(255,255,255,0.4)' : timerColor,
            }}>
              {isAnswered ? '✓' : timeLeft}
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{
          padding: '20px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1rem, 4vw, 1.3rem)',
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.4,
            }}>
              {question.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {question.options.map((opt, i) => {
              let className = `opt-btn ${['a','b','c','d'][i]}`;
              if (isAnswered) className += ' disabled';
              if (isAnswered && i === selectedAnswer) className += ' correct'; // visually selected
              return (
                <button
                  key={i}
                  className={className}
                  onClick={() => handleAnswer(i)}
                  style={{
                    opacity: isAnswered && i !== selectedAnswer ? 0.5 : 1,
                  }}
                >
                  <span className="opt-letter">{OPTION_LABELS[i]}</span>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div style={{
              marginTop: 16,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
              color: 'var(--green)',
              fontWeight: 800,
              animation: 'fadeIn 0.3s ease',
            }}>
              ✅ Réponse envoyée ! En attente de la révélation...
            </div>
          )}

          {!isAnswered && timeLeft === 0 && (
            <div style={{
              marginTop: 16,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
              color: 'var(--red)',
              fontWeight: 800,
            }}>
              ⏱️ Temps écoulé !
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- REVEAL ---
  if (phase === 'reveal' && lastResult) {
    const currentQ = session?.currentQuestion ?? 0;
    const question = activeQuestions[currentQ];
    const { correct, points, totalScore, correctAnswer } = lastResult;

    // Compute speed tier for display
    const speedRatio = points > 900 ? 'ÉCLAIR' : points > 700 ? 'RAPIDE' : points > 500 ? 'OK' : correct ? 'LENT' : null;
    const speedEmoji = points > 900 ? '⚡' : points > 700 ? '🚀' : points > 500 ? '👍' : correct ? '🐢' : null;
    const speedBar = correct ? Math.round(((points - 500) / 500) * 100) : 0; // 0-100

    return (
      <div className="screen" style={{
        background: correct ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
        minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px',
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 380, width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: 8, animation: 'pop 0.4s ease' }}>
            {correct ? '🎉' : '😬'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12 }}>
            {correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </h2>

          {correct ? (
            <div style={{ marginBottom: 12 }}>
              {/* Points earned */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>+{points}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 700 }}>points gagnés</div>
              </div>

              {/* Speed bar */}
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', fontWeight: 700, opacity: 0.85 }}>
                  <span>{speedEmoji} Vitesse : {speedRatio}</span>
                  <span>+{Math.round(points - 500)} bonus</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${speedBar}%`, borderRadius: 999,
                    background: 'rgba(255,255,255,0.9)',
                    animation: 'growBar 0.8s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', opacity: 0.6 }}>
                  <span>500 pts (lent)</span>
                  <span>1000 pts (instant)</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 12, fontSize: '0.9rem', fontWeight: 700 }}>
              La bonne réponse était :<br />
              <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>
                {['A','B','C','D'][correctAnswer]} — {question?.options[correctAnswer]}
              </span>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px' }}>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: 2 }}>Score total</p>
            <p style={{ fontWeight: 900, fontSize: '1.6rem', margin: 0 }}>⭐ {totalScore} pts</p>
          </div>

          <p style={{ marginTop: 16, opacity: 0.6, fontSize: '0.82rem', fontWeight: 600 }}>
            En attente du classement...
            <span style={{ display: 'inline-flex', gap: 4, marginLeft: 8 }}>
              <span className="dot" style={{ background: 'rgba(255,255,255,0.7)' }} />
              <span className="dot" style={{ background: 'rgba(255,255,255,0.7)' }} />
              <span className="dot" style={{ background: 'rgba(255,255,255,0.7)' }} />
            </span>
          </p>
        </div>

        <style>{`
          @keyframes growBar { from { width: 0; } to { width: ${speedBar}%; } }
        `}</style>
      </div>
    );
  }

  // --- LEADERBOARD ---
  if (phase === 'leaderboard') {
    const players = session?.players || {};
    const sorted = Object.entries(players)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === playerId.current) + 1;
    const medals = ['🥇', '🥈', '🥉'];
    const top5 = sorted.slice(0, 5);

    return (
      <div className="screen" style={{
        background: 'var(--dark)',
        minHeight: '100vh',
        padding: '20px 16px',
        overflowY: 'auto',
      }}>
        <div className="tricolor" style={{ marginBottom: 20, borderRadius: 4 }} />
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>🏆</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1.5rem' }}>
              Classement
            </h2>
            {myRank > 0 && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>
                Ton classement : <span style={{ color: 'var(--gold)' }}>#{myRank}</span> • {myScore} pts
              </p>
            )}
          </div>

          {top5.map((player, i) => (
            <div
              key={player.id}
              className="lb-row"
              style={{
                animationDelay: `${i * 0.1}s`,
                border: player.id === playerId.current ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <div className={`lb-rank ${i < 3 ? ['medal-1','medal-2','medal-3'][i] : 'medal-n'}`}>
                {i < 3 ? medals[i] : i + 1}
              </div>
              <div style={{
                flex: 1, fontWeight: 800, color: player.id === playerId.current ? 'var(--gold)' : 'white',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {player.name} {player.id === playerId.current ? '← toi' : ''}
              </div>
              <div style={{ fontWeight: 900, color: 'var(--gold)' }}>{player.score} pts</div>
            </div>
          ))}

          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.3)',
            fontSize: '0.8rem', marginTop: 20, fontWeight: 600,
          }}>
            En attente de la prochaine question...
          </p>
        </div>
      </div>
    );
  }

  // --- FINISHED ---
  if (phase === 'finished') {
    const players = session?.players || {};
    const sorted = Object.entries(players)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === playerId.current) + 1;

    return (
      <div className="screen" style={{
        background: 'linear-gradient(160deg, var(--blue) 0%, #002395 50%, var(--red) 100%)',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 360, width: '100%', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎊</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16 }}>
            Quiz terminé !
          </h1>

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16, padding: '24px',
            marginBottom: 20,
          }}>
            <p style={{ opacity: 0.7, fontWeight: 700, marginBottom: 4, fontSize: '0.85rem' }}>TON SCORE FINAL</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)' }}>
              ⭐ {myScore}
            </p>
            {myRank > 0 && (
              <p style={{ opacity: 0.8, fontWeight: 700, marginTop: 4 }}>
                Classement : #{myRank} sur {sorted.length} joueur{sorted.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <p style={{ opacity: 0.6, fontWeight: 600, marginBottom: 24, fontSize: '0.9rem' }}>
            Merci d'avoir joué avec CocoricOz ! 🐓🇫🇷🇦🇺
          </p>

          <button className="btn-secondary" onClick={onBack}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return null;
}
