import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import Dashboard from './pages/Dashboard';
import StorylineView from './pages/StorylineView';
import Auth from './pages/Auth';
import Accounting from './pages/Accounting';

const App = () => {
  const { user, loading } = useGame();

  if (loading) return <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/storyline/:id" element={user ? <StorylineView /> : <Navigate to="/auth" />} />
        <Route path="/accounting" element={user ? <Accounting /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
};

export default App;
