import React from 'react';

export default function Landing({ onHost, onPlay }) {
  return (
    <div className="screen" style={{
      background: 'linear-gradient(160deg, #001a6e 0%, #002395 40%, #ED2939 100%)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      minHeight: '100vh',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 280, height: 280, borderRadius: '50%',
        background: 'rgba(0,0,0,0.15)', pointerEvents: 'none'
      }} />

      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Logo area */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '4rem' }}>🐓</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 8vw, 3rem)',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1.1,
          marginBottom: 8
        }}>
          CocoricOz
        </h1>
        <div className="tricolor" style={{ maxWidth: 200, margin: '0 auto 12px', height: 5, borderRadius: 999 }} />
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 48,
          letterSpacing: '0.05em'
        }}>
          🇫🇷 Le Grand Quiz Franco-Australien 🇦🇺
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            onClick={onHost}
            style={{
              background: 'var(--gold)',
              color: 'var(--dark)',
              padding: '18px 32px',
              borderRadius: 14,
              fontSize: '1.1rem',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.15s, filter 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <span style={{ fontSize: '1.3rem' }}>🎙️</span>
            Je suis l'animateur
          </button>

          <button
            onClick={onPlay}
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '18px 32px',
              borderRadius: 14,
              fontSize: '1.1rem',
              fontWeight: 800,
              border: '2px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <span style={{ fontSize: '1.3rem' }}>🎮</span>
            Je joue !
          </button>
        </div>

        <p style={{
          marginTop: 40,
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          25 questions • 20 secondes par question
        </p>
      </div>
    </div>
  );
}
