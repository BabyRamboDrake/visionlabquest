import React from 'react';
import { useGame } from './context/GameContext';
import Dashboard from './pages/Dashboard';
import StorylineView from './pages/StorylineView';
import Auth from './pages/Auth';

function App() {
  const { user, loading, activeStorylineId } = useGame();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
        Loading Quest...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      {activeStorylineId ? <StorylineView /> : <Dashboard />}
    </div>
  );
}

export default App;
