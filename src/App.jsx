import React from 'react';
import { useGame } from './context/GameContext';
import Dashboard from './pages/Dashboard';
import StorylineView from './pages/StorylineView';

function App() {
  const { activeStorylineId } = useGame();

  return (
    <div className="app">
      {activeStorylineId ? <StorylineView /> : <Dashboard />}
    </div>
  );
}

export default App;
