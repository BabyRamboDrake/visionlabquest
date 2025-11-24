import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, MoreVertical, Trash2, Backpack, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import LevelBar from '../components/LevelBar';
import Inventory from '../components/Inventory';

const Dashboard = () => {
    const { storylines, addStoryline, deleteStoryline } = useGame();
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showInventory, setShowInventory] = useState(false);

    const handleAddStoryline = (e) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            addStoryline(newStoryTitle);
            setNewStoryTitle('');
        }
    };

    const handleDeleteClick = (id) => {
        setShowDeleteConfirm(id);
        setActiveMenuId(null);
    };

    const confirmDelete = () => {
        if (showDeleteConfirm) {
            deleteStoryline(showDeleteConfirm);
            setShowDeleteConfirm(null);
        }
    };

    return (
        <div className="container fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px' }} />
                    <h1 className="text-gradient" style={{ margin: 0 }}>Vision Quest</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <LevelBar />
                    <Link to="/accounting" className="btn btn-icon" title="Accounting">
                        <DollarSign size={24} />
                    </Link>
                    <button
                        className="btn btn-icon"
                        onClick={() => setShowInventory(true)}
                        title="Inventory"
                        style={{ position: 'relative' }}
                    >
                        <Backpack size={24} />
                    </button>
                </div>
            </header>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* New Storyline Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', borderStyle: 'dashed', borderColor: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <form onSubmit={handleAddStoryline} style={{ width: '100%', textAlign: 'center' }}>
                        <Plus size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
                        <input
                            type="text"
                            value={newStoryTitle}
                            onChange={(e) => setNewStoryTitle(e.target.value)}
                            placeholder="New Storyline..."
                            style={{ width: '80%', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-text-muted)', color: 'var(--color-text)', fontSize: '1.2rem', marginBottom: '1rem' }}
                        />
                        <button type="submit" className="btn btn-primary">Create Journey</button>
                    </form>
                </div>

                {/* Existing Storylines */}
                {storylines.map(story => (
                    <div key={story.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                            <button
                                className="btn-icon"
                                onClick={() => setActiveMenuId(activeMenuId === story.id ? null : story.id)}
                            >
                                <MoreVertical size={20} />
                            </button>
                            {activeMenuId === story.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    background: 'var(--color-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.5rem',
                                    zIndex: 10,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    minWidth: '120px'
                                }}>
                                    <button
                                        onClick={() => handleDeleteClick(story.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--color-danger)',
                                            background: 'transparent',
                                            border: 'none',
                                            width: '100%',
                                            padding: '0.5rem',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        <Link to={`/storyline/${story.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                            <h2 style={{ marginTop: 0, paddingRight: '2rem' }}>{story.title}</h2>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                {story.quests.filter(q => q.completed).length} / {story.quests.length} Quests Completed
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${story.quests.length > 0 ? (story.quests.filter(q => q.completed).length / story.quests.length) * 100 : 0}%` }}
                                />
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Delete Storyline?</h3>
                        <p>Are you sure you want to delete this storyline? All quests and progress within it will be lost forever.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Modal */}
            {showInventory && (
                <Inventory onClose={() => setShowInventory(false)} />
            )}
        </div>
    );
};

export default Dashboard;
