import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const Timer = () => {
    // Initialize state from localStorage if available
    const [customTime, setCustomTime] = useState(() => {
        const saved = localStorage.getItem('pomodoro_customTime');
        return saved ? parseInt(saved, 10) : 25;
    });

    const [mode, setMode] = useState(() => {
        return localStorage.getItem('pomodoro_mode') || 'work';
    });

    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('pomodoro_timeLeft');
        return saved ? parseInt(saved, 10) : 25 * 60;
    });

    const [isActive, setIsActive] = useState(() => {
        const saved = localStorage.getItem('pomodoro_isActive');
        return saved === 'true';
    });

    // Ref to track the last tick time for accurate resume after refresh
    const lastTickRef = useRef(Date.now());

    // Save settings whenever they change
    useEffect(() => {
        localStorage.setItem('pomodoro_customTime', customTime);
        localStorage.setItem('pomodoro_mode', mode);
        localStorage.setItem('pomodoro_isActive', isActive);
    }, [customTime, mode, isActive]);

    // Save timeLeft frequently (but maybe not every second to avoid thrashing, 
    // though for localStorage it's fine. Better: calculate diff on mount)
    useEffect(() => {
        localStorage.setItem('pomodoro_timeLeft', timeLeft);
    }, [timeLeft]);

    // Handle Timer Logic
    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0) {
            // Check if we missed time while away/refreshing
            const now = Date.now();
            const lastTick = parseInt(localStorage.getItem('pomodoro_lastTick') || now);
            const delta = Math.floor((now - lastTick) / 1000);

            if (delta > 1) {
                // If we were away for more than 1 second, subtract that time
                // This handles the "refresh" case where the timer "keeps running"
                setTimeLeft(prev => Math.max(0, prev - delta));
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newVal = prev - 1;
                    localStorage.setItem('pomodoro_lastTick', Date.now());
                    return newVal;
                });
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            // Play sound or notify?
        } else {
            // If paused, just update lastTick so we don't jump when resuming
            localStorage.setItem('pomodoro_lastTick', Date.now());
        }

        return () => clearInterval(interval);
    }, [isActive]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        let newTime;
        if (mode === 'work') newTime = customTime * 60;
        if (mode === 'shortBreak') newTime = 5 * 60;
        if (mode === 'longBreak') newTime = 15 * 60;
        setTimeLeft(newTime);
        // Clear lastTick to prevent jumping
        localStorage.setItem('pomodoro_lastTick', Date.now());
    };

    const handleTimeChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setCustomTime(val);
            if (mode === 'work') {
                setTimeLeft(val * 60);
                setIsActive(false);
            }
        }
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'work') setTimeLeft(customTime * 60);
        if (newMode === 'shortBreak') setTimeLeft(5 * 60);
        if (newMode === 'longBreak') setTimeLeft(15 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const [isEditing, setIsEditing] = useState(false);

    const progress = mode === 'work'
        ? ((customTime * 60 - timeLeft) / (customTime * 60)) * 100
        : 0;

    return (
        <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Progress Background */}
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
                    onClick={() => handleModeChange('work')}
                >
                    Focus
                </button>
                <button
                    className={`btn ${mode === 'shortBreak' ? 'btn-primary' : 'btn-icon'}`}
                    onClick={() => handleModeChange('shortBreak')}
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
