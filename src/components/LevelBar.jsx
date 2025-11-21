import React from 'react';
import { useGame } from '../context/GameContext';

const LevelBar = () => {
    const { level, xp } = useGame();

    // XP required for next level is level * 1000
    const xpRequired = level * 1000;
    const progress = Math.min((xp / xpRequired) * 100, 100);

    return (
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--color-primary)',
                boxShadow: 'var(--shadow-glow)',
                background: 'var(--color-bg)'
            }}>
                {level}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span>Experience</span>
                    <span>{xp} / {xpRequired} XP</span>
                </div>
                <div style={{
                    height: '12px',
                    background: 'var(--color-bg)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--color-accent), var(--color-primary))',
                        boxShadow: '0 0 10px var(--color-accent)',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>
            </div>
        </div>
    );
};

export default LevelBar;
