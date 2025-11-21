import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, BookOpen, MoreVertical } from 'lucide-react';

const Dashboard = () => {
    const { storylines, addStoryline, setActiveStorylineId, deleteStoryline } = useGame();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        if (newTitle.trim()) {
            addStoryline(newTitle);
            setNewTitle('');
            setIsCreating(false);
        }
    };

    const handleDelete = (id) => {
        deleteStoryline(id);
        setDeleteConfirmId(null);
        setActiveMenuId(null);
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <img src="/logo.png" alt="Vision Quest Logo" style={{ width: '120px', height: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--color-primary-glow))' }} />
                <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)', textShadow: 'var(--shadow-glow)', marginBottom: '0.5rem' }}>
                    Vision Quest
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

                        {/* Menu Button */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={e => e.stopPropagation()}>
                            <button
                                className="btn-icon"
                                onClick={() => setActiveMenuId(activeMenuId === storyline.id ? null : storyline.id)}
                            >
                                <MoreVertical size={20} />
                            </button>

                            {activeMenuId === storyline.id && (
                                <div ref={menuRef} style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-glow)',
                                    zIndex: 10,
                                    minWidth: '120px',
                                    overflow: 'hidden'
                                }}>
                                    <button
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'transparent',
                                            color: 'var(--color-danger)',
                                            fontSize: '0.9rem',
                                            textAlign: 'left'
                                        }}
                                        onClick={() => setDeleteConfirmId(storyline.id)}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Delete Confirmation Modal */}
                        {deleteConfirmId === storyline.id && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                cursor: 'default'
                            }} onClick={e => e.stopPropagation()}>
                                <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Delete Storyline?</h3>
                                    <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                                        Are you sure you want to delete <strong>{storyline.title}</strong>? This action cannot be undone.
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <button
                                            className="btn"
                                            style={{ background: 'var(--color-danger)', color: 'white' }}
                                            onClick={() => handleDelete(storyline.id)}
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            className="btn btn-accent"
                                            onClick={() => setDeleteConfirmId(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
