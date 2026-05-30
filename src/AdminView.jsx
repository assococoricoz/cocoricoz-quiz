import React, { useState, useEffect } from 'react';
import { loadQuizQuestions, addQuestion, updateQuestion, deleteQuestion } from './firebase.js';

const QUIZ_TYPES = [
  { key: 'franco', label: '🌏 Franco-Australien', color: '#3B82F6' },
  { key: 'expert', label: '🇫🇷 Expert Français',  color: '#ED2939' },
];

const EMPTY_FORM = { question: '', options: ['', '', '', ''], correct: 0, category: '' };

// ── Question Form ─────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const setOption = (i, val) => setForm(f => {
    const opts = [...f.options]; opts[i] = val; return { ...f, options: opts };
  });

  const isValid = form.question.trim().length >= 5
    && form.options.every(o => o.trim().length >= 1)
    && form.category.trim().length >= 1;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const LETTER_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#EF4444'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto', zIndex: 100,
    }}>
      <div style={{
        background: '#111827', borderRadius: 20, padding: '24px',
        width: '100%', maxWidth: 520, border: '1px solid #1e293b',
        animation: 'fadeIn 0.2s ease', marginTop: 20,
      }}>
        <h3 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 20 }}>
          {initial ? '✏️ Modifier la question' : '➕ Nouvelle question'}
        </h3>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Catégorie</label>
          <input style={inputStyle} value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="🥐 Food, 🗺️ Geography..." />
        </div>

        {/* Question */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Question</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Écris ta question ici..." />
        </div>

        {/* Options */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Réponses</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: form.correct === i ? LETTER_COLORS[i] : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 900, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'background 0.2s',
                  border: form.correct === i ? `2px solid ${LETTER_COLORS[i]}` : '2px solid transparent',
                  boxShadow: form.correct === i ? `0 0 10px ${LETTER_COLORS[i]}66` : 'none',
                }} onClick={() => setForm(f => ({ ...f, correct: i }))}
                  title="Clique pour marquer comme bonne réponse">
                  {['A','B','C','D'][i]}
                </div>
                <input style={{
                  ...inputStyle, flex: 1, margin: 0,
                  borderColor: form.correct === i ? LETTER_COLORS[i] : '#1e293b',
                }}
                  value={opt}
                  onChange={e => setOption(i, e.target.value)}
                  placeholder={`Option ${['A','B','C','D'][i]}`} />
                {form.correct === i && (
                  <span style={{ color: LETTER_COLORS[i], fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>✓ correct</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 6 }}>
            💡 Clique sur une lettre pour marquer la bonne réponse
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #1e293b',
            background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700,
          }}>Annuler</button>
          <button onClick={handleSave} disabled={!isValid || saving} style={{
            flex: 2, padding: '14px', borderRadius: 12, border: 'none',
            background: isValid ? '#22C55E' : '#333', color: 'white', cursor: isValid ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '0.95rem',
            transition: 'background 0.2s',
          }}>
            {saving ? '⏳ Sauvegarde...' : '✅ Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Question Row ──────────────────────────────────────────────
function QuestionRow({ question, index, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const LETTER_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#EF4444'];

  return (
    <div style={{
      background: '#161B22', border: '1px solid #21262D', borderRadius: 12,
      padding: '14px 16px', marginBottom: 8, animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Number */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#21262D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0,
        }}>{index + 1}</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 999,
              padding: '2px 10px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700,
            }}>{question.category}</span>
          </div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, lineHeight: 1.4 }}>
            {question.question}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {question.options.map((opt, i) => (
              <span key={i} style={{
                background: i === question.correct ? `${LETTER_COLORS[i]}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${i === question.correct ? LETTER_COLORS[i] : '#21262D'}`,
                borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem',
                color: i === question.correct ? LETTER_COLORS[i] : 'rgba(255,255,255,0.4)',
                fontWeight: i === question.correct ? 800 : 600,
              }}>
                {['A','B','C','D'][i]} {opt}
                {i === question.correct && ' ✓'}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(question)} style={iconBtn('#3B82F6')}>✏️</button>
          {confirmDelete
            ? <button onClick={() => onDelete(question._id)} style={iconBtn('#EF4444')}>Supprimer ?</button>
            : <button onClick={() => setConfirmDelete(true)} style={iconBtn('#EF4444')}>🗑️</button>
          }
        </div>
      </div>
    </div>
  );
}

const iconBtn = (color) => ({
  background: `${color}15`, border: `1px solid ${color}40`,
  borderRadius: 8, padding: '6px 10px', color, cursor: 'pointer',
  fontSize: '0.85rem', fontWeight: 800, transition: 'background 0.2s',
});

// ── Main AdminView ────────────────────────────────────────────
export default function AdminView({ onBack }) {
  const [quizType, setQuizType]     = useState('franco');
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [toast, setToast]           = useState('');
  const [search, setSearch]         = useState('');

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await loadQuizQuestions(quizType);
    setQuestions(qs ?? []);
    setLoading(false);
  };

  useEffect(() => { loadQuestions(); }, [quizType]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAdd = async (formData) => {
    await addQuestion(quizType, formData);
    await loadQuestions();
    setShowForm(false);
    showToast('✅ Question ajoutée !');
  };

  const handleEdit = async (formData) => {
    await updateQuestion(quizType, editing._id, formData);
    await loadQuestions();
    setEditing(null);
    showToast('✅ Question modifiée !');
  };

  const handleDelete = async (id) => {
    await deleteQuestion(quizType, id);
    await loadQuestions();
    showToast('🗑️ Question supprimée');
  };

  const filtered = search.trim()
    ? questions.filter(q =>
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.category.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  const currentType = QUIZ_TYPES.find(t => t.key === quizType);

  return (
    <div style={{
      minHeight: '100vh', background: '#0D1117', overflowY: 'auto',
      fontFamily: 'var(--font-body)',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#22C55E', color: 'white', padding: '10px 20px',
          borderRadius: 999, fontWeight: 800, zIndex: 200, fontSize: '0.9rem',
          animation: 'slideDown 0.3s ease', boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
        }}>{toast}</div>
      )}

      {/* Forms */}
      {showForm && <QuestionForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editing  && <QuestionForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, background: '#0D1117', zIndex: 50,
        borderBottom: '1px solid #21262D', padding: '14px 16px',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={onBack} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '1.3rem', cursor: 'pointer', padding: 4,
            }}>←</button>
            <div>
              <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: 0 }}>
                ⚙️ Gestion des questions
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
                {questions.length} question{questions.length !== 1 ? 's' : ''} · {currentType.label}
              </p>
            </div>
            <button onClick={() => setShowForm(true)} style={{
              marginLeft: 'auto', background: '#22C55E', color: 'white',
              border: 'none', borderRadius: 10, padding: '8px 16px',
              fontFamily: 'var(--font-body)', fontWeight: 800, cursor: 'pointer',
              fontSize: '0.85rem',
            }}>+ Ajouter</button>
          </div>

          {/* Quiz type tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {QUIZ_TYPES.map(t => (
              <button key={t.key} onClick={() => setQuizType(t.key)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem',
                background: quizType === t.key ? t.color : 'rgba(255,255,255,0.06)',
                color: quizType === t.key ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px 0' }}>
        <input
          style={{
            ...inputStyle, marginBottom: 0,
            background: '#161B22', borderColor: '#21262D',
          }}
          placeholder="🔍 Rechercher une question..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Question list */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
            <p style={{ fontWeight: 700 }}>Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
              {search ? '🔍' : '📭'}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 16 }}>
              {search ? 'Aucun résultat' : 'Aucune question pour ce quiz'}
            </p>
            {!search && (
              <button onClick={() => setShowForm(true)} style={{
                background: '#22C55E', color: 'white', border: 'none',
                borderRadius: 12, padding: '12px 24px',
                fontFamily: 'var(--font-body)', fontWeight: 800, cursor: 'pointer',
              }}>➕ Ajouter la première question</button>
            )}
          </div>
        ) : (
          filtered.map((q, i) => (
            <QuestionRow
              key={q._id} question={q} index={i}
              onEdit={setEditing} onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: '#0D1117', border: '1px solid #1e293b',
  borderRadius: 10, padding: '12px 14px', color: 'white',
  fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', outline: 'none',
  marginBottom: 0, boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
  fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
};
