import React from 'react';
import { useGame } from '../context/GameContext';
import { X } from 'lucide-react';

const Inventory = ({ onClose }) => {
    const { inventory } = useGame();

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'common': return '#a0a0a0';
            case 'rare': return '#0070dd';
            case 'epic': return '#a335ee';
            case 'legendary': return '#ff8000';
            default: return '#a0a0a0';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '1rem'
                }}>
                    <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Inventory</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1rem',
                    overflowY: 'auto',
                    padding: '0.5rem'
                }}>
                    {inventory.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            Your inventory is empty. <br /> Level up to find items!
                        </div>
                    ) : (
                        inventory.map((slot) => (
                            <div key={slot.id} style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: `1px solid ${getRarityColor(slot.item.rarity)}`,
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    marginBottom: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <img
                                        src={slot.item.image_url}
                                        alt={slot.item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: getRarityColor(slot.item.rarity) }}>
                                    {slot.item.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                    {slot.item.rarity.charAt(0).toUpperCase() + slot.item.rarity.slice(1)}
                                </div>
                                {slot.quantity > 1 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: 'var(--color-primary)',
                                        color: 'var(--color-bg)',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {slot.quantity}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
