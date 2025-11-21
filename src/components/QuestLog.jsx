import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Check, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const QuestItem = ({ quest, storylineId, depth = 0 }) => {
    const { completeQuest, addQuest } = useGame();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');

    const handleAddSubquest = (e) => {
        e.preventDefault();
        if (newSubTitle.trim()) {
            addQuest(storylineId, newSubTitle, quest.id);
            setNewSubTitle('');
            setIsAddingSub(false);
            setIsExpanded(true);
        }
    };

    return (
        <div style={{ marginLeft: `${depth * 20}px`, marginTop: '0.5rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-sm)',
                border: quest.completed ? '1px solid var(--color-accent)' : '1px solid transparent',
                opacity: quest.completed ? 0.7 : 1
            }}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ background: 'transparent', padding: '2px', color: 'var(--color-text-muted)' }}
                >
                    {quest.subquests.length > 0 ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <div style={{ width: 16 }} />}
                </button>

                <button
                    onClick={() => completeQuest(storylineId, quest.id, !quest.completed)}
                    style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '2px solid var(--color-primary)',
                        background: quest.completed ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-bg)'
                    }}
                >
                    {quest.completed && <Check size={14} strokeWidth={3} />}
                </button>

                <span style={{
                    flex: 1,
                    textDecoration: quest.completed ? 'line-through' : 'none',
                    color: quest.completed ? 'var(--color-accent)' : 'var(--color-text)'
                }}>
                    {quest.title}
                </span>

                <button
                    className="btn-icon"
                    onClick={() => setIsAddingSub(!isAddingSub)}
                    title="Add Subquest"
                >
                    <Plus size={16} />
                </button>
            </div>

            {isAddingSub && (
                <form onSubmit={handleAddSubquest} style={{ marginLeft: '20px', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newSubTitle}
                        onChange={(e) => setNewSubTitle(e.target.value)}
                        placeholder="New subquest..."
                        autoFocus
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Add</button>
                </form>
            )}

            {isExpanded && quest.subquests.length > 0 && (
                <div>
                    {quest.subquests.map(sub => (
                        <QuestItem key={sub.id} quest={sub} storylineId={storylineId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const QuestLog = ({ storylineId }) => {
    const { storylines, addQuest } = useGame();
    const storyline = storylines.find(s => s.id === storylineId);
    const [newQuestTitle, setNewQuestTitle] = useState('');

    if (!storyline) return <div>Storyline not found</div>;

    const handleAddQuest = (e) => {
        e.preventDefault();
        if (newQuestTitle.trim()) {
            addQuest(storylineId, newQuestTitle);
            setNewQuestTitle('');
        }
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                Quest Log
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                {storyline.quests.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        No active quests. <br /> Add one to begin your journey.
                    </div>
                ) : (
                    storyline.quests.map(quest => (
                        <QuestItem key={quest.id} quest={quest} storylineId={storylineId} />
                    ))
                )}
            </div>

            <form onSubmit={handleAddQuest} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newQuestTitle}
                    onChange={(e) => setNewQuestTitle(e.target.value)}
                    placeholder="Add new quest..."
                />
                <button type="submit" className="btn btn-primary">
                    <Plus size={20} />
                </button>
            </form>
        </div>
    );
};

export default QuestLog;
