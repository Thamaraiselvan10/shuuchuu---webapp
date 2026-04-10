import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CelebrationContext = createContext();

export const useCelebration = () => useContext(CelebrationContext);

const quotes = [
    "Dopamine isn't just about reward; it's about anticipation. By finishing this, you've strengthened your neural pathways for future success.",
    "The Zeigarnik effect states we remember uncompleted tasks. You've just freed up valuable mental RAM for your next achievement.",
    "Small wins trigger the identical neurochemical circuit as huge triumphs. Relish this moment.",
    "Identity-based habits: You are no longer someone trying to complete goals. You are the person who completes them.",
    "Momentum is psychological physics. An object in motion stays in motion. Keep riding this wave.",
    "Completion builds self-trust. You are proving to your brain that you do exactly what you say you will do.",
    "Every action you take is a vote for the type of person you wish to become. That was a powerful vote."
];

export const CelebrationProvider = ({ children }) => {
    const [celebration, setCelebration] = useState({
        isOpen: false,
        title: '',
        quote: '',
        subtitle: ''
    });

    const triggerCelebration = useCallback((type, customData = '') => {
        let title = 'Incredible Work!';
        let subtitle = 'Milestone Reached';
        
        switch (type) {
            case 'habits':
                title = 'Perfect Day Complete!';
                subtitle = 'All Habits Checked Off';
                break;
            case 'goals':
                title = 'Phase Completed!';
                subtitle = 'One Step Closer to Your Goal';
                break;
            case 'tasks_category':
                title = 'Inbox Zero!';
                subtitle = `Cleared all tasks in ${customData}`;
                break;
            default:
                break;
        }

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        setCelebration({
            isOpen: true,
            title,
            subtitle,
            quote: randomQuote
        });
    }, []);

    const closeCelebration = () => setCelebration(prev => ({ ...prev, isOpen: false }));

    // Auto-close handler (optional, but good for user experience or if they want to click it away manually we leave it on until they click)
    // If you want it to auto close, uncomment:
    /*
    useEffect(() => {
        if (celebration.isOpen) {
            const timer = setTimeout(closeCelebration, 8000);
            return () => clearTimeout(timer);
        }
    }, [celebration.isOpen]);
    */

    return (
        <CelebrationContext.Provider value={{ triggerCelebration }}>
            {children}
            {celebration.isOpen && (
                <div className="celebration-overlay" onClick={closeCelebration}>
                    <div className="celebration-modal" onClick={e => e.stopPropagation()}>
                        
                        {/* 
                          !!! USER ACTION REQUIRED !!!
                          Replace the src below with your actual rotating coin gif path.
                          Example: src="/assets/rotating-coin.gif"
                        */}
                        <img 
                            src="/leetcode-leetcodecoin.gif" 
                            alt="Rotating Coin" 
                            className="celebration-coin" 
                        />
                        
                        <div className="celebration-content">
                            <h2 className="celebration-title">{celebration.title}</h2>
                            <h3 className="celebration-subtitle">{celebration.subtitle}</h3>
                            <div className="celebration-divider"></div>
                            <p className="celebration-quote">"{celebration.quote}"</p>
                            
                            <button className="celebration-btn" onClick={closeCelebration}>
                                Continue Building Momentum
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .celebration-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 200000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }

                .celebration-modal {
                    background: linear-gradient(145deg, var(--card-bg), var(--nav-hover-bg));
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.2);
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                }

                .celebration-coin {
                    width: 120px;
                    height: 120px;
                    object-fit: cover;
                    margin: -80px auto 20px auto;
                    border-radius: 50%;
                    background: transparent;
                    filter: drop-shadow(0 10px 15px rgba(255, 215, 0, 0.4));
                    animation: floatCoin 3s ease-in-out infinite;
                }

                .celebration-title {
                    font-size: 2rem;
                    color: var(--primary-color);
                    margin: 0;
                    font-weight: 800;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .celebration-subtitle {
                    font-size: 1.1rem;
                    color: var(--text-color);
                    opacity: 0.8;
                    margin: 5px 0 20px 0;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .celebration-divider {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent);
                    margin: 20px 0;
                }

                .celebration-quote {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: var(--text-color);
                    font-style: italic;
                    margin-bottom: 30px;
                    padding: 0 10px;
                    opacity: 0.9;
                }

                .celebration-btn {
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 30px;
                    font-size: 1.05rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                }

                .celebration-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
                    filter: brightness(1.1);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes popIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.8) translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }

                @keyframes floatCoin {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }

                @media (max-width: 768px) {
                    .celebration-modal {
                        width: 100%;
                        height: 100dvh;
                        max-width: none;
                        border-radius: 0;
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        margin: 0;
                    }

                    .celebration-coin {
                        width: 100px;
                        height: 100px;
                        margin: 0 auto 20px auto;
                    }

                    .celebration-title {
                        font-size: 1.8rem;
                    }

                    .celebration-subtitle {
                        font-size: 1rem;
                    }

                    .celebration-quote {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </CelebrationContext.Provider>
    );
};
