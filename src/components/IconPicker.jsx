import React, { useState } from 'react';

const EMOJI_CATEGORIES = {
    'Common': ['📁', '📋', '📝', '📌', '📎', '✅', '⭐', '🎯', '🔥', '💡'],
    'Work': ['💼', '💻', '📊', '📈', '📉', '💰', '🏢', '📧', '📞', '🔧'],
    'Personal': ['👤', '🏠', '❤️', '🎉', '🎂', '🎁', '✈️', '🚗', '🛒', '🍽️'],
    'Study': ['📚', '📖', '✏️', '🎓', '🔬', '🧮', '🌍', '📐', '🖊️', '💭'],
    'Health': ['💪', '🏃', '🧘', '🍎', '💊', '🏥', '😴', '🧠', '🦷', '👁️'],
    'Creative': ['🎨', '🎵', '🎬', '📷', '🎮', '✍️', '🎸', '🎭', '🎪', '🌈'],
    'Symbols': ['⚡', '🔔', '🔒', '🔑', '⚙️', '🛠️', '📢', '🚀', '💎', '🏆']
};

const IconPicker = ({ selectedIcon, onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('Common');

    return (
        <div className="icon-picker-overlay" onClick={onClose}>
            <div className="icon-picker" onClick={(e) => e.stopPropagation()}>
                <div className="icon-picker-header">
                    <h3>Choose an Icon</h3>
                    <button className="icon-picker-close" onClick={onClose}>×</button>
                </div>

                <div className="icon-picker-categories">
                    {Object.keys(EMOJI_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="icon-picker-grid">
                    {EMOJI_CATEGORIES[activeCategory].map((emoji, idx) => (
                        <button
                            key={idx}
                            className={`icon-btn ${selectedIcon === emoji ? 'selected' : ''}`}
                            onClick={() => {
                                onSelect(emoji);
                                onClose();
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <style>{`
                    .icon-picker-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }

                    .icon-picker {
                        background: var(--card-bg);
                        border-radius: 16px;
                        padding: 20px;
                        width: 340px;
                        max-height: 80vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }

                    .icon-picker-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    }

                    .icon-picker-header h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: var(--text-color);
                    }

                    .icon-picker-close {
                        background: transparent;
                        border: none;
                        color: var(--text-color);
                        font-size: 20px;
                        cursor: pointer;
                        opacity: 0.5;
                        transition: opacity 0.15s;
                    }

                    .icon-picker-close:hover {
                        opacity: 1;
                    }

                    .icon-picker-categories {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-bottom: 16px;
                    }

                    .category-btn {
                        padding: 6px 12px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: transparent;
                        color: var(--text-color);
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.15s;
                        opacity: 0.7;
                    }

                    .category-btn:hover {
                        background: rgba(255, 255, 255, 0.05);
                        opacity: 1;
                    }

                    .category-btn.active {
                        background: var(--primary-color);
                        border-color: var(--primary-color);
                        color: white;
                        opacity: 1;
                    }

                    .icon-picker-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 8px;
                    }

                    .icon-btn {
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        background: rgba(255, 255, 255, 0.03);
                        border: 2px solid transparent;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .icon-btn:hover {
                        background: rgba(255, 255, 255, 0.08);
                        transform: scale(1.1);
                    }

                    .icon-btn.selected {
                        border-color: var(--primary-color);
                        background: rgba(var(--primary-rgb), 0.2);
                    }
                `}</style>
            </div>
        </div>
    );
};

export default IconPicker;
