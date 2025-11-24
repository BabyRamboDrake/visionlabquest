import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Timer from '../components/Timer';
import LevelBar from '../components/LevelBar';
import QuestLog from '../components/QuestLog';
import { ArrowLeft } from 'lucide-react';

const StorylineView = () => {
    const { id } = useParams();
    const { storylines } = useGame();
    const storyline = storylines.find(s => s.id === id);

    if (!storyline) return <div className="container">Loading or Storyline not found...</div>;

    return (
        <div className="container">
            <Link
                to="/"
                className="btn btn-icon"
                style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: 0, textDecoration: 'none', color: 'var(--color-text)' }}
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--color-text)' }}>
                    <span style={{ color: 'var(--color-primary)' }}>Storyline:</span> {storyline.title}
                </h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <LevelBar />
                    <Timer />
                </div>

                <div style={{ height: '600px' }}> {/* Fixed height for scrolling quest log */}
                    <QuestLog storylineId={id} />
                </div>
            </div>
        </div>
    );
};

export default StorylineView;
