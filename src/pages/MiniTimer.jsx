import React, { useState } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';

const MiniTimer = () => {
    const {
        timeLeft,
        mode,
        startTimer,
        pauseTimer,
        resumeTimer,
        duration
    } = useTimerContext();

    const { settings } = useSettings();
    const [isPinned, setIsPinned] = useState(true);

    // Motivational quotes
    const motivationalQuotes = [
        "Stay focused, stay sharp",
        "Deep work builds dreams",
        "One task at a time",
        "Focus is your superpower",
        "Great things take time",
        "Stay in the zone",
        "Progress, not perfection",
        "You've got this!"
    ];

    const [currentQuote] = useState(() =>
        motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );

    const handleExpand = () => {
        window.electronAPI.toggleMiniMode(false);
    };

    const togglePin = () => {
        const newState = !isPinned;
        setIsPinned(newState);
        window.electronAPI.toggleAlwaysOnTop(newState);
    };

    // Play success sound on completion
    React.useEffect(() => {
        if (mode === 'completed') {
            const playSuccessSound = () => {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContext) return;
                    const ctx = new AudioContext();
                    const playNote = (freq, time, dur) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.frequency.value = freq;
                        osc.type = 'sine';
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        gain.gain.setValueAtTime(0, time);
                        gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
                        osc.start(time);
                        osc.stop(time + dur);
                    };
                    const now = ctx.currentTime;
                    playNote(523.25, now, 0.3);
                    playNote(659.25, now + 0.15, 0.3);
                    playNote(783.99, now + 0.3, 0.6);
                } catch (e) {
                    console.error("Audio play failed", e);
                }
            };
            playSuccessSound();
        }
    }, [mode]);

    // Enforce Always on Top on mount
    React.useEffect(() => {
        window.electronAPI.toggleAlwaysOnTop(true);
    }, []);

    const progress = duration > 0 ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Generate tick marks around the circle (like a clock)
    const tickMarks = Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 6) - 90; // 6 degrees per tick, start from top
        const isLargeTick = i % 5 === 0;
        const innerRadius = isLargeTick ? 82 : 85;
        const outerRadius = 92;
        const radians = (angle * Math.PI) / 180;

        const x1 = 100 + innerRadius * Math.cos(radians);
        const y1 = 100 + innerRadius * Math.sin(radians);
        const x2 = 100 + outerRadius * Math.cos(radians);
        const y2 = 100 + outerRadius * Math.sin(radians);

        return (
            <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#4a4a4a"
                strokeWidth={isLargeTick ? 2.5 : 1.5}
                strokeLinecap="round"
            />
        );
    });

    // Progress arc parameters
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (circumference * progress) / 100;

    // Dynamic sizing - fixed size to prevent shrinking/collapsing issues
    const circleSize = '240px';

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Segoe UI", sans-serif',
            userSelect: 'none',
            overflow: 'hidden',
            padding: '40px 20px 20px 20px',
            boxSizing: 'border-box',
            gap: '15px'
        }}>
            {/* Maximize Button - Top Right */}
            <button
                onClick={handleExpand}
                style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
                title="Maximize Timer"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            </button>

            {/* Motivational Quote - Bold styling */}
            <div style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
                fontWeight: '600',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textAlign: 'center',
                maxWidth: '90%'
            }}>
                {currentQuote}
            </div>

            {/* Main Timer Circle */}
            {mode === 'completed' ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    padding: '30px'
                }}>
                    <div style={{ fontSize: '3.5rem', animation: 'bounce 1s infinite' }}>🏆</div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#00d4aa', fontWeight: '500' }}>
                            Well Done!
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                            Session Complete
                        </p>
                    </div>
                    <button
                        onClick={handleExpand}
                        style={{
                            marginTop: '15px',
                            padding: '10px 28px',
                            background: 'linear-gradient(135deg, #00d4aa 0%, #00a8b5 100%)',
                            border: 'none',
                            borderRadius: '25px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)'
                        }}
                    >
                        Finish
                    </button>
                    <style>{`
                        @keyframes bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                    `}</style>
                </div>
            ) : (
                <div style={{
                    position: 'relative',
                    width: circleSize,
                    height: circleSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg
                        viewBox="0 0 200 200"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        {/* Dark inner circle background */}
                        <circle
                            cx="100"
                            cy="100"
                            r="75"
                            fill="#252525"
                        />

                        {/* Tick marks */}
                        {tickMarks}

                        {/* Progress arc */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke="#00d4aa"
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            style={{
                                transform: 'rotate(-90deg)',
                                transformOrigin: '100px 100px',
                                transition: 'stroke-dashoffset 1s linear'
                            }}
                        />
                    </svg>

                    {/* Timer Display - MM:SS with slide animation on seconds only */}
                    <div style={{
                        textAlign: 'center',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center'
                    }}>
                        {/* Minutes - static */}
                        <span style={{
                            fontSize: 'clamp(2rem, 12vw, 3.5rem)',
                            fontWeight: '300',
                            color: '#fff',
                            letterSpacing: '2px'
                        }}>
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                        </span>

                        {/* Colon */}
                        <span style={{
                            fontSize: 'clamp(2rem, 12vw, 3.5rem)',
                            fontWeight: '300',
                            color: '#fff',
                            margin: '0 2px'
                        }}>
                            :
                        </span>

                        {/* Seconds - animated with flip/page-tear effect */}
                        <span
                            key={timeLeft % 60}
                            style={{
                                fontSize: 'clamp(2rem, 12vw, 3.5rem)',
                                fontWeight: '300',
                                color: '#fff',
                                letterSpacing: '2px',
                                display: 'inline-block',
                                minWidth: '1.2em'
                            }}
                        >
                            {(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>


                </div>
            )
            }

            {/* Controls - Icon only */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Pause/Resume/Start Button - Icon only */}
                <button
                    onClick={mode === 'running' ? pauseTimer : (mode === 'paused' ? resumeTimer : startTimer)}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 212, 170, 0.2)';
                        e.currentTarget.style.borderColor = '#00d4aa';
                        e.currentTarget.style.color = '#00d4aa';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    }}
                    title={mode === 'running' ? 'Pause' : (mode === 'paused' ? 'Resume' : 'Start')}
                >
                    {mode === 'running' ? (
                        // Pause icon
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                        </svg>
                    ) : (
                        // Play icon
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    )}
                </button>
            </div>
        </div >
    );
};

export default MiniTimer;
