import React, { useState } from 'react';
import Landing from './Landing.jsx';
import HostView from './HostView.jsx';
import PlayerView from './PlayerView.jsx';

export default function App() {
  const [view, setView] = useState('landing');
  if (view === 'host') return <HostView onBack={() => setView('landing')} />;
  if (view === 'player') return <PlayerView onBack={() => setView('landing')} />;
  return <Landing onHost={() => setView('host')} onPlay={() => setView('player')} />;
}
