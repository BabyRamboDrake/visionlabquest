import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const Timer = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
    const [customTime, setCustomTime] = useState(25);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((timeLeft) => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound or notify?
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'work') setTimeLeft(customTime * 60);
        if (mode === 'shortBreak') setTimeLeft(5 * 60);
        if (mode === 'longBreak') setTimeLeft(15 * 60);
    };

    const handleTimeChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setCustomTime(val);
            if (mode === 'work') setTimeLeft(val * 60);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'work'
        ? ((customTime * 60 - timeLeft) / (customTime * 60)) * 100
        : 0; // Simplified progress for now

    return (
        <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Progress Background (optional visual flair) */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '4px',
                width: `${progress}%`,
                backgroundColor: 'var(--color-accent)',
                transition: 'width 1s linear'
            }} />

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                    className={`btn ${mode === 'work' ? 'btn-primary' : 'btn-icon'}`}
                    onClick={() => { setMode('work'); setTimeLeft(customTime * 60); setIsActive(false); }}
                >
                    Focus
                </button>
                <button
                    className={`btn ${mode === 'shortBreak' ? 'btn-primary' : 'btn-icon'}`}
                    onClick={() => { setMode('shortBreak'); setTimeLeft(5 * 60); setIsActive(false); }}
                >
                    Short Break
                </button>
            </div>

            <div style={{ fontSize: '6rem', fontWeight: 'bold', fontFamily: 'monospace', margin: '2rem 0', color: isActive ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {isEditing ? (
                    <input
                        type="number"
                        value={customTime}
                        onChange={handleTimeChange}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                        style={{ fontSize: '4rem', width: '150px', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}
                    />
                ) : (
                    <span onClick={() => !isActive && setIsEditing(true)} style={{ cursor: !isActive ? 'pointer' : 'default' }}>
                        {formatTime(timeLeft)}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={toggleTimer} style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
                </button>
                <button className="btn btn-icon" onClick={resetTimer} title="Reset">
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
    );
};

export default Timer;
