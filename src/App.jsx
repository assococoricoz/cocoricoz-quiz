import { useState, useEffect } from 'react'
import { db } from './firebase'
import { ref, set, get, onValue, update } from 'firebase/database'
import { QUESTIONS } from './questions'

const LETTERS = ['A', 'B', 'C', 'D']

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
const generateId = () => Math.random().toString(36).substring(2, 10)

// ──────────────────────────────────────────────────────────────
// HOME
// ──────────────────────────────────────────────────────────────
function Home({ onAnimateur, onJoueur }) {
  return (
    <div className="screen">
      <div className="home-logo">🐓</div>
      <h1 className="home-title">CocoricOz</h1>
      <p className="home-subtitle">Quiz Franco-Australien</p>
      <div className="tricolor">
        <span className="fr-blue" /><span className="fr-white" /><span className="fr-red" />
      </div>
      <div className="home-buttons">
        <button className="btn btn-primary" onClick={onAnimateur}>🎙️ Je suis l'animateur</button>
        <button className="btn btn-secondary" onClick={onJoueur}>📱 Je suis un joueur</button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// ANIMATEUR LOBBY
// ──────────────────────────────────────────────────────────────
function AnimateurLobby({ code, session, onLaunch }) {
  const players = session?.players ? Object.values(session.players) : []

  return (
    <div className="screen wide">
      <p className="section-title">Session en cours</p>
      <div className="code-display-box">
        <p className="code-label">Code à partager</p>
        <div className="code-big">{code}</div>
        <p className="code-url">Rejoignez la partie sur votre téléphone</p>
      </div>

      <div className="player-count-row">
        <div className="count-bubble">{players.length}</div>
        <div className="count-text">
          <strong>{players.length} joueur{players.length !== 1 ? 's' : ''}</strong>
          connecté{players.length !== 1 ? 's' : ''}
        </div>
      </div>

      {players.length > 0 && (
        <div className="player-chips">
          {players.map((p, i) => <div key={i} className="player-chip">👤 {p.name}</div>)}
        </div>
      )}

      <button className="btn btn-primary" onClick={onLaunch} disabled={players.length === 0}>
        🚀 Lancer le quiz ({QUESTIONS.length} questions)
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// ANIMATEUR GAME
// ──────────────────────────────────────────────────────────────
function AnimateurGame({ code, session }) {
  const qIndex = session?.currentQuestion ?? 0
  const status = session?.status
  const players = session?.players ? Object.entries(session.players) : []
  const currentQ = QUESTIONS[qIndex]
  const answeredCount = players.filter(([, p]) => p.currentAnswer !== null && p.currentAnswer !== undefined).length
  const progress = players.length > 0 ? (answeredCount / players.length) * 100 : 0

  const reveal = async () => {
    const correct = currentQ.answer
    const updates = {}
    players.forEach(([pid, player]) => {
      if (player.currentAnswer === correct) {
        updates[`sessions/${code}/players/${pid}/score`] = (player.score || 0) + 100
      }
    })
    updates[`sessions/${code}/status`] = 'reveal'
    updates[`sessions/${code}/correctAnswer`] = correct
    await update(ref(db), updates)
  }

  const showLeaderboard = async () => {
    await update(ref(db, `sessions/${code}`), { status: 'leaderboard' })
  }

  const nextQuestion = async () => {
    const next = qIndex + 1
    if (next >= QUESTIONS.length) {
      await update(ref(db, `sessions/${code}`), { status: 'finished' })
      return
    }
    const updates = {
      [`sessions/${code}/status`]: 'question',
      [`sessions/${code}/currentQuestion`]: next,
      [`sessions/${code}/correctAnswer`]: null,
    }
    players.forEach(([pid]) => { updates[`sessions/${code}/players/${pid}/currentAnswer`] = null })
    await update(ref(db), updates)
  }

  const sortedPlayers = [...players.map(([, p]) => p)].sort((a, b) => (b.score || 0) - (a.score || 0))

  if (status === 'leaderboard' || status === 'finished') {
    return (
      <div className="screen">
        <div className="lb-title">{status === 'finished' ? '🏆 Résultats finaux' : '📊 Leaderboard'}</div>
        <div className="lb-list">
          {sortedPlayers.slice(0, 10).map((p, i) => (
            <div key={i} className="lb-row" style={{ animationDelay: `${i * 0.06}s` }}>
              <span className="lb-rank-icon">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <span className="lb-name">{p.name}</span>
              <span className="lb-score">{p.score || 0} pts</span>
            </div>
          ))}
        </div>
        {status !== 'finished' && (
          <button className="btn btn-primary" onClick={nextQuestion}>
            ▶️ Question {qIndex + 2} / {QUESTIONS.length}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="screen wide">
      <div className="q-progress-bar">
        <span className="q-num-badge">Q{qIndex + 1}/{QUESTIONS.length}</span>
        <div className="q-bar-track">
          <div className="q-bar-fill" style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      <div className="category-badge">{currentQ.category}</div>
      <h2 className="q-text-anim">{currentQ.q}</h2>

      <div className="choices-grid-anim">
        {currentQ.choices.map((choice, i) => (
          <div
            key={i}
            className={`choice-box ${status === 'reveal' ? (i === currentQ.answer ? 'correct' : 'wrong') : ''}`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="choice-letter">{LETTERS[i]}</span>
            {choice}
          </div>
        ))}
      </div>

      <div className="answer-progress-box">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-text">
          <strong>{answeredCount}</strong> / {players.length} joueurs ont répondu
        </p>
      </div>

      {status === 'question' && (
        <button className="btn-reveal" onClick={reveal}>🔍 Révéler la réponse</button>
      )}
      {status === 'reveal' && (
        <button className="btn btn-primary" onClick={showLeaderboard}>📊 Voir le leaderboard</button>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// JOUEUR JOIN
// ──────────────────────────────────────────────────────────────
function JoueurJoin({ onJoin }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const join = async () => {
    if (!name.trim() || !code.trim()) { setError('Remplis tous les champs !'); return }
    setLoading(true); setError('')
    const upper = code.toUpperCase()
    const snap = await get(ref(db, `sessions/${upper}`))
    if (!snap.exists()) { setError('Code invalide — vérifie avec l\'animateur.'); setLoading(false); return }
    const sess = snap.val()
    if (sess.status !== 'lobby') { setError('La partie a déjà commencé !'); setLoading(false); return }
    const pid = generateId()
    await set(ref(db, `sessions/${upper}/players/${pid}`), { name: name.trim(), score: 0, currentAnswer: null })
    sessionStorage.setItem('coz-pid', pid)
    onJoin(upper, pid, name.trim())
    setLoading(false)
  }

  return (
    <div className="screen">
      <div className="join-logo">🐓</div>
      <h2 className="screen-title">Rejoindre la partie</h2>
      <div className="form-group">
        <label>Ton prénom</label>
        <input type="text" placeholder="Ex : Sophie" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
      </div>
      <div className="form-group">
        <label>Code de session</label>
        <input type="text" placeholder="XXXX" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={4} className="code-input" />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button className="btn btn-primary" onClick={join} disabled={loading}>
        {loading ? 'Connexion...' : '🎮 Rejoindre !'}
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// JOUEUR GAME
// ──────────────────────────────────────────────────────────────
function JoueurGame({ code, playerId, playerName, session }) {
  const qIndex = session?.currentQuestion ?? 0
  const status = session?.status
  const currentQ = QUESTIONS[qIndex]
  const me = session?.players?.[playerId]
  const myAnswer = me?.currentAnswer
  const myScore = me?.score || 0
  const correctAnswer = session?.correctAnswer

  const players = session?.players ? Object.values(session.players) : []
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const myRank = sorted.findIndex(p => p.name === playerName) + 1

  const answer = async (i) => {
    if (myAnswer !== null && myAnswer !== undefined) return
    if (status !== 'question') return
    await update(ref(db, `sessions/${code}/players/${playerId}`), { currentAnswer: i })
  }

  if (status === 'lobby') {
    return (
      <div className="screen">
        <div className="join-logo">🐓</div>
        <h2 className="screen-title">Bienvenue, {playerName} !</h2>
        <div className="waiting-anim">⏳</div>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>L'animateur va bientôt démarrer...</p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Code : <strong style={{ color: 'var(--gold)', letterSpacing: 4 }}>{code}</strong></p>
      </div>
    )
  }

  if (status === 'leaderboard' || status === 'finished') {
    return (
      <div className="screen">
        <div className="lb-title">{status === 'finished' ? '🏆 Final !' : '📊 Scores'}</div>
        <div className="my-score-card">
          <div className="score-big">{myScore}</div>
          <div className="score-label">points</div>
          <div className="score-rank">#{myRank} sur {players.length} joueurs</div>
        </div>
        <p className="section-title">Top 5</p>
        <div className="lb-mini">
          {sorted.slice(0, 5).map((p, i) => (
            <div key={i} className={`lb-mini-row ${p.name === playerName ? 'me' : ''}`}>
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <span className="lb-mini-name">{p.name} {p.name === playerName ? '👈' : ''}</span>
              <span className="lb-mini-score">{p.score || 0} pts</span>
            </div>
          ))}
        </div>
        {status !== 'finished' && <p className="waiting-next">⏳ Prochaine question bientôt...</p>}
      </div>
    )
  }

  const hasAnswered = myAnswer !== null && myAnswer !== undefined

  return (
    <div className="screen">
      <div className="q-header-joueur">
        <span className="q-num-joueur">Q{qIndex + 1}/{QUESTIONS.length}</span>
        <span className="q-score-joueur">{myScore} pts</span>
      </div>

      <div className="category-badge">{currentQ.category}</div>
      <h2 className="q-text-joueur">{currentQ.q}</h2>

      <div className="choices-joueur">
        {currentQ.choices.map((choice, i) => {
          let cls = 'choice-btn'
          if (hasAnswered) {
            if (status === 'reveal') {
              if (i === correctAnswer) cls += ' correct'
              else if (i === myAnswer) cls += ' wrong'
              else cls += ' dim'
            } else {
              cls += i === myAnswer ? ' selected' : ' dim'
            }
          }
          return (
            <button key={i} className={cls} onClick={() => answer(i)} style={{ animationDelay: `${i * 0.07}s` }}>
              <span className="choice-letter-btn">{LETTERS[i]}</span>
              {choice}
            </button>
          )
        })}
      </div>

      {hasAnswered && status === 'question' && (
        <div className="feedback-msg waiting">✅ Réponse enregistrée — en attente...</div>
      )}
      {status === 'reveal' && hasAnswered && (
        <div className={`feedback-msg ${myAnswer === correctAnswer ? 'correct' : 'wrong'}`}>
          {myAnswer === correctAnswer ? '🎉 Bravo ! +100 points' : '❌ Dommage, c\'était ' + currentQ.choices[correctAnswer]}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// APP ROOT
// ──────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null) // null | 'animateur' | 'joueur'
  const [code, setCode] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [session, setSession] = useState(null)
  const [creating, setCreating] = useState(false)

  // Subscribe to session
  useEffect(() => {
    if (!code) return
    const r = ref(db, `sessions/${code}`)
    const unsub = onValue(r, snap => setSession(snap.val()))
    return () => unsub()
  }, [code])

  const startAnimateur = async () => {
    setCreating(true)
    const c = generateCode()
    await set(ref(db, `sessions/${c}`), { status: 'lobby', currentQuestion: 0, createdAt: Date.now() })
    setCode(c)
    setRole('animateur')
    setCreating(false)
  }

  const launchGame = async () => {
    await update(ref(db, `sessions/${code}`), { status: 'question', currentQuestion: 0 })
  }

  const joinAsJoueur = (sessionCode, pid, name) => {
    setCode(sessionCode); setPlayerId(pid); setPlayerName(name); setRole('joueur')
  }

  // HOME
  if (!role) {
    return (
      <Home
        onAnimateur={() => startAnimateur()}
        onJoueur={() => setRole('joueur-join')}
      />
    )
  }

  // JOUEUR JOIN SCREEN
  if (role === 'joueur-join') {
    return <JoueurJoin onJoin={joinAsJoueur} />
  }

  // ANIMATEUR FLOW
  if (role === 'animateur') {
    if (creating || !session) return <div className="screen"><div className="waiting-anim">🐓</div><p style={{color:'var(--muted)'}}>Création de la session...</p></div>
    if (session.status === 'lobby') return <AnimateurLobby code={code} session={session} onLaunch={launchGame} />
    return <AnimateurGame code={code} session={session} />
  }

  // JOUEUR FLOW
  if (role === 'joueur') {
    return <JoueurGame code={code} playerId={playerId} playerName={playerName} session={session} />
  }

  return null
}
