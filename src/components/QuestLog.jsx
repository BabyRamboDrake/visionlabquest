import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Check, ChevronRight, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const QuestItem = ({ quest, storylineId, depth = 0, isSortable = false }) => {
    const { completeQuest, addQuest, updateQuest, deleteQuest } = useGame();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(quest.title);
    const editInputRef = useRef(null);

    // Sortable hooks
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: quest.id, disabled: !isSortable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 20}px`,
        marginTop: '0.5rem',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 0
    };

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [isEditing]);

    const handleAddSubquest = (e) => {
        e.preventDefault();
        if (newSubTitle.trim()) {
            addQuest(storylineId, newSubTitle, quest.id);
            setNewSubTitle('');
            setIsAddingSub(false);
            setIsExpanded(true);
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (editTitle.trim() && editTitle !== quest.title) {
            updateQuest(storylineId, quest.id, editTitle);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setEditTitle(quest.title);
            setIsEditing(false);
        }
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-sm)',
                border: quest.completed ? '1px solid var(--color-accent)' : '1px solid transparent',
                // opacity handled in parent style
            }}>
                {/* Drag Handle */}
                {isSortable && (
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                        <GripVertical size={16} />
                    </div>
                )}

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
                        color: 'var(--color-bg)',
                        cursor: 'pointer'
                    }}
                >
                    {quest.completed && <Check size={14} strokeWidth={3} />}
                </button>

                {isEditing ? (
                    <form onSubmit={handleUpdate} style={{ flex: 1 }}>
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleUpdate}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--color-primary)',
                                color: 'var(--color-text)',
                                fontSize: '1rem',
                                padding: '0 0.25rem'
                            }}
                        />
                    </form>
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        style={{
                            flex: 1,
                            textDecoration: quest.completed ? 'line-through' : 'none',
                            color: quest.completed ? 'var(--color-accent)' : 'var(--color-text)',
                            cursor: 'text'
                        }}
                        title="Click to edit"
                    >
                        {quest.title}
                    </span>
                )}

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                        className="btn-icon"
                        onClick={() => setIsAddingSub(!isAddingSub)}
                        title="Add Subquest"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => deleteQuest(storylineId, quest.id)}
                        title="Delete Quest"
                        style={{ color: 'var(--color-danger)' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
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
                        <QuestItem key={sub.id} quest={sub} storylineId={storylineId} depth={depth + 1} isSortable={false} />
                    ))}
                </div>
            )}
        </div>
    );
};

const QuestLog = ({ storylineId }) => {
    const { storylines, addQuest, reorderQuests } = useGame();
    const storyline = storylines.find(s => s.id === storylineId);
    const [newQuestTitle, setNewQuestTitle] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!storyline) return <div>Storyline not found</div>;

    const handleAddQuest = (e) => {
        e.preventDefault();
        if (newQuestTitle.trim()) {
            addQuest(storylineId, newQuestTitle);
            setNewQuestTitle('');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = storyline.quests.findIndex((q) => q.id === active.id);
            const newIndex = storyline.quests.findIndex((q) => q.id === over.id);

            const newQuests = arrayMove(storyline.quests, oldIndex, newIndex);
            reorderQuests(storylineId, newQuests);
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={storyline.quests.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {storyline.quests.map(quest => (
                                <QuestItem
                                    key={quest.id}
                                    quest={quest}
                                    storylineId={storylineId}
                                    isSortable={true}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
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
