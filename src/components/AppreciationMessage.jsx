import React from 'react';

const AppreciationMessage = ({ message, duration = 4 }) => {
    return (
        <div className="appreciation-message-container">
            <div className="appreciation-content">
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <span>{message}</span>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
            </div>
            <style>{`
                .appreciation-message-container {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 50;
                    pointer-events: none;
                }

                .appreciation-content {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 8px 24px;
                    border-radius: 30px;
                    color: white;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    white-space: nowrap;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    animation: fadeInOut ${duration}s ease-in-out forwards;
                }

                @keyframes fadeInOut {
                    0% {
                        opacity: 0;
                        transform: translateY(10px) scale(0.95);
                    }
                    15% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    85% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                }
            `}</style>
        </div>
    );
};

export default AppreciationMessage;
