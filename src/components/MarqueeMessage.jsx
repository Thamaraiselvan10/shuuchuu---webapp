import React from 'react';

const MarqueeMessage = ({ message, duration = 15 }) => {
    return (
        <div className="marquee-container">
            <div className="marquee-content">
                <span className="train-icon">🚂</span>
                <span className="message-text">{message}</span>
                <span className="train-icon">🚃</span>
            </div>
            <style>{`
                .marquee-container {
                    position: absolute;
                    top: 10px;
                    left: 0;
                    width: 100%;
                    height: 40px;
                    overflow: hidden;
                    z-index: 100;
                    pointer-events: none;
                }

                .marquee-content {
                    position: absolute;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(0, 0, 0, 0.6);
                    padding: 5px 15px;
                    border-radius: 20px;
                    color: #fff;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: slideLeft ${duration}s linear forwards;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }

                .train-icon {
                    font-size: 1.5rem;
                }

                .message-text {
                    font-size: 1rem;
                }

                @keyframes slideLeft {
                    0% {
                        left: 100%;
                        transform: translateX(0);
                    }
                    100% {
                        left: 0;
                        transform: translateX(-100%);
                    }
                }
            `}</style>
        </div>
    );
};

export default MarqueeMessage;
