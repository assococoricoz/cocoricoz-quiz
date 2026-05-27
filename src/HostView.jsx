import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateCode, generateId, createSession, listenToSession,
  startQuestion, revealAnswer, showLeaderboard, nextQuestion, finishGame
} from './firebase.js';
import { QUESTION_TIME } from './questions.js';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#EF4444'];

// ─── Timer Ring ───────────────────────────────────────────────
function TimerRing({ timeLeft, total }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - timeLeft / total);
  const color = timeLeft > 10 ? '#22C55E' : timeLeft > 5 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', fontWeight: 900, color }}>{timeLeft}</div>
    </div>
  );
}

// ─── Leaderboard with rank changes ───────────────────────────
function Leaderboard({ players, prevRanks, questionIndex, isLast, onNext }) {
  const sorted = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score);

  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = ['#F59E0B', '#9CA3AF', '#B45309'];

  return (
    <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '2rem', marginBottom: 4 }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#F5A623', margin: 0 }}>
          Classement
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>
          Question {questionIndex + 1} / {QUESTIONS.length}
        </p>
      </div>

      {sorted.slice(0, 8).map((player, i) => {
        const prev = prevRanks[player.id];
        const rankChange = prev !== undefined ? prev - i : null;
        return (
          <div key={player.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            background: i === 0 ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
            border: i === 0 ? '1px solid rgba(245,166,35,0.3)' : '1px solid rgba(255,255,255,0.05)',
            marginBottom: 8,
            animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
          }}>
            {/* Rank */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.9rem',
              background: i < 3 ? podiumColors[i] : 'rgba(255,255,255,0.1)',
              color: 'white',
            }}>
              {i < 3 ? medals[i] : i + 1}
            </div>

            {/* Name */}
            <div style={{ flex: 1, fontWeight: 800, color: 'white', fontSize: '0.95rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </div>

            {/* Rank change badge */}
            {rankChange !== null && rankChange !== 0 && (
              <div style={{
                fontSize: '0.75rem', fontWeight: 900, padding: '2px 8px', borderRadius: 999,
                background: rankChange > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                color: rankChange > 0 ? '#22C55E' : '#EF4444',
                animation: 'pop 0.4s ease',
              }}>
                {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
              </div>
            )}
            {rankChange === null && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)' }}>
                NEW
              </div>
            )}
            {rankChange === 0 && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700,
                padding: '2px 8px' }}>
                =
              </div>
            )}

            {/* Score */}
            <div style={{ fontWeight: 900, color: '#F5A623', fontSize: '1rem', minWidth: 70, textAlign: 'right' }}>
              {player.score} pts
            </div>
          </div>
        );
      })}

      <button onClick={onNext} style={{
        marginTop: 20, width: '100%', background: '#ED2939', color: 'white',
        padding: '16px', borderRadius: 12, fontFamily: 'var(--font-body)',
        fontSize: '1rem', fontWeight: 800, border: 'none', cursor: 'pointer',
        transition: 'background 0.2s',
      }}>
        {isLast ? '🎊 Voir le podium final !' : `➡️ Question ${questionIndex + 2} / ${QUESTIONS.length}`}
      </button>
    </div>
  );
}

// ─── Final Podium ─────────────────────────────────────────────
function FinalPodium({ players, onBack }) {
  const sorted = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score);

  const [showRest, setShowRest] = useState(false);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ['#ED2939', '#002395', '#F5A623', '#22C55E', '#FFFFFF'][Math.floor(Math.random() * 5)],
      size: 6 + Math.random() * 8,
    }));
    setConfetti(particles);
    const t = setTimeout(() => setShowRest(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean); // 2nd, 1st, 3rd
  const podiumHeights = [140, 180, 110];
  const podiumColors = ['#9CA3AF', '#F5A623', '#B45309'];
  const podiumLabels = ['🥈', '🥇', '🥉'];
  const podiumPos = [1, 0, 2]; // index in sorted array

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0D1117 0%, #161B22 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px',
      overflowY: 'auto', position: 'relative', overflow: 'hidden' }}>

      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {confetti.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: -20,
            width: p.size, height: p.size, borderRadius: p.size > 10 ? '50%' : 2,
            background: p.color, opacity: 0.9,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes podiumRise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes playerDrop { from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { 0% { transform: scale(0.7); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: '2.5rem' }}>🎊</div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#F5A623', fontSize: '2rem', margin: '4px 0' }}>
            Quiz terminé !
          </h1>
        </div>

        {/* Podium */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 6, marginBottom: 32, marginTop: 16 }}>
          {[podiumOrder[0], podiumOrder[1], podiumOrder[2]].map((player, col) => {
            if (!player) return <div key={col} style={{ flex: 1, maxWidth: 150 }} />;
            const h = podiumHeights[col];
            const color = podiumColors[col];
            const label = podiumLabels[col];
            return (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 160, minWidth: 0 }}>
                {/* Player card above podium */}
                <div style={{
                  textAlign: 'center', marginBottom: 8, width: '100%',
                  animation: `playerDrop 0.6s ${0.5 + col * 0.2}s ease both`,
                }}>
                  <div style={{ fontSize: col === 1 ? '2rem' : '1.5rem' }}>{label}</div>
                  <div style={{
                    color: 'white', fontWeight: 900, fontSize: col === 1 ? '0.9rem' : '0.78rem',
                    background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 8px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {player.name}
                  </div>
                  <div style={{ color: color, fontWeight: 900, fontSize: '0.85rem', marginTop: 2 }}>
                    {player.score} pts
                  </div>
                </div>
                {/* Podium block */}
                <div style={{
                  width: '100%', height: h, borderRadius: '8px 8px 0 0',
                  background: `linear-gradient(180deg, ${color}cc, ${color}66)`,
                  border: `2px solid ${color}`,
                  transformOrigin: 'bottom',
                  animation: `podiumRise 0.8s ${col * 0.15}s cubic-bezier(0.34,1.56,0.64,1) both`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 900, color: 'white',
                }}>
                  {[2, 1, 3][col]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of ranking */}
        {showRest && sorted.length > 3 && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.85rem',
              fontWeight: 700, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classement complet
            </p>
            {sorted.slice(3).map((player, i) => (
              <div key={player.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 6,
                animation: `fadeIn 0.3s ease ${i * 0.06}s both`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 900, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  {i + 4}
                </div>
                <div style={{ flex: 1, color: 'white', fontWeight: 700, fontSize: '0.9rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.name}
                </div>
                <div style={{ color: '#F5A623', fontWeight: 900, fontSize: '0.9rem' }}>
                  {player.score} pts
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onBack} style={{
          marginTop: 24, width: '100%', background: 'rgba(255,255,255,0.1)',
          color: 'white', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
          fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
        }}>
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

// ─── Main HostView ─────────────────────────────────────────────
export default function HostView({ onBack, questions: QUESTIONS }) {
  const [phase, setPhase] = useState('creating');
  const [code, setCode] = useState('');
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef(null);
  const revealedRef = useRef(false);
  const hostId = useRef(generateId());
  const prevRanksRef = useRef({}); // { playerId: rankIndex }

  useEffect(() => {
    const c = generateCode();
    setCode(c);
    createSession(c, hostId.current).then(() => setPhase('lobby'));
  }, []);

  useEffect(() => {
    if (!code) return;
    return listenToSession(code, data => setSession(data));
  }, [code]);

  useEffect(() => {
    if (!session) return;
    const s = session.status;
    if (s === 'question') {
      revealedRef.current = false;
      const elapsed = Math.floor((Date.now() - session.questionStartTime) / 1000);
      setTimeLeft(Math.max(0, QUESTION_TIME - elapsed));
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

  useEffect(() => {
    if (phase !== 'question') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!revealedRef.current) { revealedRef.current = true; revealAnswer(code); }
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
  const answeredCount = question ? Object.values(players).filter(p => p.answers?.[currentQ] !== undefined).length : 0;
  const answerDist = question ? OPTION_LABELS.map((_, i) => Object.values(players).filter(p => p.answers?.[currentQ]?.answerIndex === i).length) : [];

  // Compute current ranks and update prevRanks when going to leaderboard
  const getSortedPlayers = () => Object.entries(players).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score);

  const handleShowLeaderboard = () => {
    // Save current ranks as "prev" for next leaderboard display
    const sorted = getSortedPlayers();
    const newPrev = {};
    sorted.forEach((p, i) => { newPrev[p.id] = i; });
    prevRanksRef.current = newPrev;
    showLeaderboard(code);
  };

  // When leaderboard is shown, the prevRanks should be BEFORE the last question
  // We update prevRanks AFTER displaying the leaderboard (for next time)
  const currentPrevRanks = prevRanksRef.current;

  const handleNext = () => {
    // Before advancing, save current ranks as prevRanks for next leaderboard
    const sorted = getSortedPlayers();
    const newPrev = {};
    sorted.forEach((p, i) => { newPrev[p.id] = i; });
    prevRanksRef.current = newPrev;
    const nextIdx = currentQ + 1;
    if (nextIdx >= QUESTIONS.length) { finishGame(code); } else { nextQuestion(code, nextIdx); }
  };

  // ── CREATING ──
  if (phase === 'creating') return (
    <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
        <p style={{ fontWeight: 700, opacity: 0.6 }}>Création de la session...</p>
      </div>
    </div>
  );

  // ── LOBBY ──
  if (phase === 'lobby') {
    const playerList = Object.values(players);
    return (
      <div style={{ minHeight: '100vh', background: '#0D1117', padding: '20px 16px', overflowY: 'auto' }}>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } @keyframes pop { 0%{transform:scale(0.7);} 70%{transform:scale(1.1);} 100%{transform:scale(1);} }`}</style>
        <div style={{ height: 4, background: 'linear-gradient(to right, #002395 33%, white 33% 66%, #ED2939 66%)', borderRadius: 4, marginBottom: 20 }} />
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={onBack} style={{ background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.3rem', border: 'none', cursor: 'pointer', padding: 4 }}>←</button>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '1.4rem', margin: 0 }}>Salle d'attente</h1>
          </div>

          <div style={{ background: '#161B22', borderRadius: 16, border: '1px solid #21262D', padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Code de la session</p>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900, color: '#F5A623', letterSpacing: '0.15em' }}>{code}</div>
            <div style={{ display: 'inline-block', background: 'white', borderRadius: 16, padding: 16, marginTop: 16, boxShadow: '0 0 0 4px rgba(245,166,35,0.3)' }}>
              <QRCodeSVG value={`${window.location.origin}/?code=${code}`} size={160} bgColor="#ffffff" fgColor="#0D1117" level="M" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 8 }}>📱 Scanne ou tape le code ci-dessus</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>{window.location.origin}</p>
          </div>

          <div style={{ background: '#161B22', borderRadius: 16, border: '1px solid #21262D', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: playerList.length > 0 ? 12 : 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Joueurs connectés</span>
              <span style={{ color: '#F5A623', fontWeight: 900, fontSize: '1.4rem' }}>{playerCount}</span>
            </div>
            {playerList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {playerList.map((p, i) => (
                  <div key={i} style={{ background: '#21262D', borderRadius: 999, padding: '6px 14px', color: 'white', fontWeight: 700, fontSize: '0.85rem', animation: 'fadeIn 0.3s ease' }}>
                    🎮 {p.name}
                  </div>
                ))}
              </div>
            )}
            {playerList.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', margin: 0 }}>En attente des joueurs...</p>}
          </div>

          <button onClick={() => startQuestion(code, 0)} disabled={playerCount === 0}
            style={{ width: '100%', background: playerCount === 0 ? '#333' : '#ED2939', color: 'white', padding: '18px', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 800, border: 'none', cursor: playerCount === 0 ? 'not-allowed' : 'pointer' }}>
            🚀 Lancer le quiz ! ({playerCount} joueur{playerCount !== 1 ? 's' : ''})
          </button>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', marginTop: 10 }}>
            {QUESTIONS.length} questions • {QUESTION_TIME}s par question • bonus vitesse
          </p>
        </div>
      </div>
    );
  }

  // ── QUESTION ──
  if (phase === 'question' && question) return (
    <div style={{ minHeight: '100vh', background: '#0D1117', padding: '16px', overflowY: 'auto' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
      <div style={{ height: 4, background: 'linear-gradient(to right, #002395 33%, white 33% 66%, #ED2939 66%)', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>{question.category}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>{currentQ + 1} / {QUESTIONS.length}</span>
        </div>
        <div style={{ height: 6, background: '#21262D', borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`, background: 'linear-gradient(to right, #002395, #ED2939)', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,3vw,1.7rem)', color: 'white', lineHeight: 1.3, flex: 1, margin: 0 }}>{question.question}</h2>
          <TimerRing timeLeft={timeLeft} total={QUESTION_TIME} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {question.options.map((opt, i) => (
            <div key={i} style={{ background: OPTION_COLORS[i], borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.85rem', flexShrink: 0 }}>{OPTION_LABELS[i]}</div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>{opt}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em' }}>ONT RÉPONDU</p>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F5A623', margin: 0 }}>{answeredCount}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)' }}> / {playerCount}</span></p>
          </div>
          <button onClick={() => { if (!revealedRef.current) { revealedRef.current = true; clearInterval(timerRef.current); revealAnswer(code); } }}
            style={{ background: '#ED2939', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Révéler ✓
          </button>
        </div>
      </div>
    </div>
  );

  // ── REVEAL ──
  if (phase === 'reveal' && question) {
    const correct = question.correct;
    const correctCount = answerDist[correct] || 0;
    const maxDist = Math.max(...answerDist, 1);
    return (
      <div style={{ minHeight: '100vh', background: '#0D1117', padding: '16px', overflowY: 'auto' }}>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={{ height: 4, background: 'linear-gradient(to right, #002395 33%, white 33% 66%, #ED2939 66%)', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,3vw,1.5rem)', color: 'white', marginBottom: 20, lineHeight: 1.3 }}>{question.question}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {question.options.map((opt, i) => {
              const isCorrect = i === correct;
              return (
                <div key={i} style={{
                  background: isCorrect ? '#22C55E' : OPTION_COLORS[i],
                  borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  opacity: isCorrect ? 1 : 0.35,
                  border: isCorrect ? '3px solid white' : '3px solid transparent',
                  transform: isCorrect ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.85rem', flexShrink: 0 }}>
                    {isCorrect ? '✓' : OPTION_LABELS[i]}
                  </div>
                  <span style={{ color: 'white', fontWeight: 800, flex: 1 }}>{opt}</span>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '3px 10px', color: 'white', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>
                    {answerDist[i] || 0}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[{ label: 'CORRECTS', value: correctCount, color: '#22C55E' },
              { label: 'INCORRECTS', value: answeredCount - correctCount, color: '#EF4444' },
              { label: 'PAS RÉPONDU', value: playerCount - answeredCount, color: 'rgba(255,255,255,0.3)' }
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: '#161B22', border: '1px solid #21262D', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={handleShowLeaderboard}
            style={{ width: '100%', background: '#F5A623', color: '#0D1117', padding: '16px', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
            🏆 Voir le classement
          </button>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD ──
  if (phase === 'leaderboard') return (
    <div style={{ minHeight: '100vh', background: '#0D1117', overflowY: 'auto' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } @keyframes pop { 0%{transform:scale(0.7);} 70%{transform:scale(1.1);} 100%{transform:scale(1);} }`}</style>
      <div style={{ height: 4, background: 'linear-gradient(to right, #002395 33%, white 33% 66%, #ED2939 66%)', borderRadius: 4, margin: '16px 16px 0' }} />
      <Leaderboard
        players={players}
        prevRanks={currentPrevRanks}
        questionIndex={currentQ}
        isLast={currentQ >= QUESTIONS.length - 1}
        onNext={handleNext}
      />
    </div>
  );

  // ── FINISHED ──
  if (phase === 'finished') return <FinalPodium players={players} onBack={onBack} />;

  return null;
}
