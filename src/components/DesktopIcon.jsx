import React, { useState } from 'react';

const DesktopIcon = ({
    icon = '📁',
    name,
    taskCount = 0,
    onDoubleClick,
    onContextMenu,
    isSelected,
    onSelect
}) => {
    const handleDoubleClick = (e) => {
        e.preventDefault();
        onDoubleClick?.();
    };

    const handleClick = (e) => {
        e.preventDefault();
        onSelect?.();
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        onContextMenu?.(e);
    };

    return (
        <div
            className={`desktop-icon ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            title={`${name} (${taskCount} tasks)`}
        >
            <div className="desktop-icon-image">
                <span className="desktop-icon-emoji">{icon}</span>
                {taskCount > 0 && (
                    <span className="desktop-icon-badge">{taskCount}</span>
                )}
            </div>
            <div className="desktop-icon-label">{name}</div>

            <style>{`
                .desktop-icon {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 90px;
                    padding: 12px 8px;
                    cursor: pointer;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    user-select: none;
                    position: relative;
                }

                .desktop-icon:hover {
                    background: var(--nav-hover-bg);
                    transform: translateY(-2px);
                }

                .desktop-icon.selected {
                    background: rgba(var(--primary-rgb), 0.2);
                    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.4);
                }

                .desktop-icon-image {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--card-bg);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    margin-bottom: 8px;
                    position: relative;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }

                .desktop-icon:hover .desktop-icon-image {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                    border-color: rgba(var(--primary-rgb), 0.3);
                }

                .desktop-icon-emoji {
                    font-size: 32px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }

                .desktop-icon-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: var(--primary-color);
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    min-width: 18px;
                    height: 18px;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 5px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }

                .desktop-icon-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-color);
                    text-align: center;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    width: 100%;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }

                .desktop-icon.selected .desktop-icon-label {
                    color: var(--primary-color);
                }
            `}</style>
        </div>
    );
};

export default DesktopIcon;
