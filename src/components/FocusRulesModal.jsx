import React, { useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';

const FocusRulesModal = ({ isOpen, onClose, hideOverlay }) => {
    // Motivational thoughts (shorter versions)
    const motivationalThoughts = [
        "The secret of getting ahead is getting started.",
        "It does not matter how slowly you go as long as you do not stop.",
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
        "Focus on being productive instead of busy.",
        "Your focus determines your reality.",
        "Where focus goes, energy flows."
    ];

    // 5 Rules - simplified
    const focusRules = [
        { emoji: '🎯', rule: 'Set Clear Goals' },
        { emoji: '📵', rule: 'Eliminate Distractions' },
        { emoji: '⏱️', rule: 'Work in Focused Bursts' },
        { emoji: '🧘', rule: 'Stay Present' },
        { emoji: '🏆', rule: 'Celebrate Small Wins' }
    ];

    const randomThought = useMemo(() =>
        motivationalThoughts[Math.floor(Math.random() * motivationalThoughts.length)],
        []
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Before You Begin..." maxWidth="500px" hideOverlay={hideOverlay}>
            <div style={{ padding: '20px' }}>
                {/* Motivational Thought */}
                <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    marginBottom: '15px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.08))',
                    borderRadius: '10px',
                    borderLeft: '3px solid var(--primary-color)'
                }}>
                    <p style={{
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        margin: 0,
                        color: 'var(--text-color)'
                    }}>
                        💡 "{randomThought}"
                    </p>
                </div>

                {/* 5 Rules Header */}
                <h4 style={{
                    textAlign: 'center',
                    margin: '0 0 12px 0',
                    color: 'var(--primary-color)',
                    fontSize: '0.95rem'
                }}>
                    5 Rules to Focus
                </h4>

                {/* Rules List - Compact */}
                <div style={{ marginBottom: '15px' }}>
                    {focusRules.map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            marginBottom: '5px',
                            background: 'var(--card-elevated)',
                            borderRadius: '8px'
                        }}>
                            <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
                            <span style={{
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                color: 'var(--text-color)'
                            }}>
                                {index + 1}. {item.rule}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                <div style={{ textAlign: 'center' }}>
                    <Button onClick={onClose} variant="primary" style={{
                        padding: '10px 25px',
                        fontSize: '0.9rem'
                    }}>
                        Let's Focus! 🚀
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FocusRulesModal;
