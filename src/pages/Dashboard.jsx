import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, BookOpen } from 'lucide-react';

const Dashboard = () => {
    const { storylines, addStoryline, setActiveStorylineId, deleteStoryline } = useGame();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newTitle.trim()) {
            addStoryline(newTitle);
            setNewTitle('');
            setIsCreating(false);
        }
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)', textShadow: 'var(--shadow-glow)', marginBottom: '0.5rem' }}>
                    Pomodoro Quest
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Select a Storyline to begin your adventure</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '2rem'
            }}>
                {storylines.map(storyline => (
                    <div
                        key={storyline.id}
                        className="card"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '200px',
                            position: 'relative'
                        }}
                        onClick={() => setActiveStorylineId(storyline.id)}
                    >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <BookOpen size={48} color="var(--color-primary)" />
                            <h3 style={{ fontSize: '1.25rem', textAlign: 'center' }}>{storyline.title}</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                {storyline.quests.length} Quests
                            </span>
                        </div>

                        <button
                            className="btn-icon"
                            style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--color-danger)' }}
                            onClick={(e) => { e.stopPropagation(); deleteStoryline(storyline.id); }}
                            title="Delete Storyline"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {/* Create New Button */}
                <div
                    className="card"
                    style={{
                        borderStyle: 'dashed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        cursor: 'pointer',
                        background: isCreating ? 'var(--color-bg-secondary)' : 'transparent'
                    }}
                    onClick={() => !isCreating && setIsCreating(true)}
                >
                    {isCreating ? (
                        <form onSubmit={handleCreate} style={{ width: '100%', padding: '1rem' }} onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Storyline Title..."
                                autoFocus
                                style={{ marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" className="btn btn-accent" onClick={() => setIsCreating(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <Plus size={48} style={{ marginBottom: '0.5rem' }} />
                            <div>New Storyline</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
