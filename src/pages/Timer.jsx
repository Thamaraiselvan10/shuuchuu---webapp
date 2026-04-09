import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useTimerContext } from '../context/TimerContext';
import Button from '../components/Button';
import Quote from '../components/Quote';
import Modal from '../components/Modal';
import { Pin, GripHorizontal, Music, VolumeX, Play, Square, RotateCcw } from 'lucide-react';

const FocusTime = () => {
    const location = useLocation();
    const {
        duration,
        timeLeft,
        mode,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        adjustDuration,
        setDuration,
        setMode,
        formatTime
    } = useTimerContext();

    const { settings, updateSettings } = useSettings();
    const { isMusicEnabled, playlist, currentTrack } = settings;

    // Pomodoro Mode State
    const [timerType, setTimerType] = useState('pomodoro'); // pomodoro | shortBreak | longBreak | custom
    const [pomodoroCount, setPomodoroCount] = useState(() => {
        const saved = localStorage.getItem('pomodoro_count');
        return saved ? parseInt(saved) : 0;
    });
    const [isLooping, setIsLooping] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customDuration, setCustomDuration] = useState(25);

    // Timer type durations
    const timerTypes = {
        pomodoro: { name: 'Pomodoro', duration: 25, color: '#4988C4' },
        shortBreak: { name: 'Short Break', duration: 5, color: '#27ae60' },
        longBreak: { name: 'Long Break', duration: 15, color: '#9b59b6' },
        custom: { name: 'Custom', duration: customDuration, color: '#e67e22' }
    };

    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showSwitchConfirmModal, setShowSwitchConfirmModal] = useState(false);
    const [pendingSwitchType, setPendingSwitchType] = useState(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Save pomodoro count
    useEffect(() => {
        localStorage.setItem('pomodoro_count', pomodoroCount.toString());
    }, [pomodoroCount]);

    // Handle timer completion for looping and pomodoro counting
    useEffect(() => {
        if (mode === 'completed') {
            if (timerType === 'pomodoro') {
                setPomodoroCount(prev => prev + 1);
            }

            if (isLooping) {
                // Auto-start next session after a short delay
                setTimeout(() => {
                    setDuration(timerTypes[timerType].duration);
                    startTimer();
                }, 1500);
            }
        }
    }, [mode]);

    // Change timer type
    const handleTimerTypeChange = (type) => {
        // If timer is running or paused, show confirmation before switching
        if (mode === 'running' || mode === 'paused') {
            setPendingSwitchType(type);
            setShowSwitchConfirmModal(true);
            return;
        }

        if (type === 'custom') {
            setShowCustomModal(true);
            return;
        }
        setTimerType(type);
        setDuration(timerTypes[type].duration);
        if (mode !== 'setup') {
            setMode('setup');
        }
    };

    const handleConfirmSwitch = () => {
        stopTimer(); // Stop current timer
        setShowSwitchConfirmModal(false);

        if (pendingSwitchType === 'custom') {
            setShowCustomModal(true);
        } else {
            setTimerType(pendingSwitchType);
            setDuration(timerTypes[pendingSwitchType].duration);
            setMode('setup');
        }
        setPendingSwitchType(null);
    };

    const handleSetCustomTimer = () => {
        setTimerType('custom');
        setDuration(customDuration);
        setShowCustomModal(false);
        if (mode !== 'setup') {
            setMode('setup');
        }
    };

    // Auto-open Rules Modal if navigating from Dashboard Start Focus
    useEffect(() => {
        if (location.state?.autoStart && mode === 'setup') {
            setShowRulesModal(true);
        }
    }, [location.state, mode]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const handleMouseDown = (e) => {
        // Prevent drag if clicking buttons or inputs
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleStartClick = () => {
        // Always show rules modal before starting
        setShowRulesModal(true);
    };

    const handleConfirmStart = () => {
        setShowRulesModal(false);
        setPosition({ x: 0, y: 0 }); // Reset to center
        startTimer();
    };

    const toggleMusic = () => {
        updateSettings({ isMusicEnabled: !isMusicEnabled });
    };

    const handleTrackChange = (e) => {
        const trackId = e.target.value;
        const track = playlist.find(t => t.id === trackId);
        if (track) {
            updateSettings({ currentTrack: track });
        }
    };

    const resetPomodoroCount = () => {
        setPomodoroCount(0);
    };

    const currentTypeColor = timerTypes[timerType]?.color || 'var(--primary-color)';

    return (
        <div className="focus-container">
            <div style={{ marginBottom: '5px' }}>
                <Quote category="focus" />
            </div>

            {/* Timer Mode Tabs - Always visible */}
            <div className="timer-mode-tabs">
                {Object.entries(timerTypes).map(([key, type]) => (
                    <button
                        key={key}
                        className={`mode-tab ${timerType === key ? 'active' : ''}`}
                        onClick={() => handleTimerTypeChange(key)}
                        style={{
                            '--tab-color': type.color
                        }}
                    >
                        {type.name}
                    </button>
                ))}
            </div>

            {mode === 'setup' && (
                <div className="setup-view timer-glass-panel">
                    <h1 style={{ color: currentTypeColor }}>
                        {timerTypes[timerType]?.name || 'Focus'} Session
                    </h1>
                    <p className="subtitle">How long would you like to focus?</p>

                    {/* Duration Selector - Original Design */}
                    <div className="duration-selector">
                        <button onClick={() => adjustDuration(-1)} className="adjust-btn">-</button>
                        <div className="duration-display">
                            <span className="duration-value">{duration}</span>
                            <span className="duration-unit">min</span>
                        </div>
                        <button onClick={() => adjustDuration(1)} className="adjust-btn">+</button>
                    </div>

                    {/* Quick Presets */}
                    <div className="quick-presets">
                        {[15, 25, 45, 60].map(min => (
                            <button
                                key={min}
                                onClick={() => setDuration(min)}
                                className={`preset-btn ${duration === min ? 'active' : ''}`}
                            >
                                {min}m
                            </button>
                        ))}
                    </div>

                    {/* Music Toggle */}
                    <div className="music-toggle">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={isMusicEnabled}
                                onChange={toggleMusic}
                            />
                            <span className="toggle-text">Play Focus Music 🎵</span>
                        </label>
                    </div>

                    <Button onClick={handleStartClick} className="start-btn" style={{ background: currentTypeColor }}>
                        Start Focus
                    </Button>
                </div>
            )}

            {(mode === 'running' || mode === 'paused' || mode === 'completed') && (
                <div
                    className="timer-view timer-glass-panel"
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'relative',
                        transform: `translate(${position.x}px, ${position.y}px) ${mode === 'running' ? 'scale(0.85)' : 'scale(1)'}`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Smooth bounce effect
                        padding: mode === 'running' ? '15px' : '25px 30px', // Reduce padding slightly
                        maxWidth: mode === 'running' ? '380px' : '450px' // Reduce max-width
                    }}
                >
                    <div className="drag-handle" title="Drag to move">
                        <GripHorizontal size={20} />
                    </div>

                    <button
                        onClick={() => window.electronAPI.toggleMiniMode(true)}
                        className="pin-button"
                        aria-label="Pin timer to top"
                        title="Pin to top (Mini Mode)"
                    >
                        <Pin size={16} /> Pin to top
                    </button>
                    <div className="timer-circle">
                        {/* Progress Ring */}
                        <svg className="progress-ring" width="280" height="280" viewBox="0 0 280 280">
                            <circle
                                className="progress-ring__bg"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="8"
                                fill="transparent"
                                r="130"
                                cx="140"
                                cy="140"
                            />
                            <circle
                                className="progress-ring__progress"
                                stroke="var(--primary-color)"
                                strokeWidth="8"
                                fill="transparent"
                                r="130"
                                cx="140"
                                cy="140"
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 130}`,
                                    strokeDashoffset: `${(timeLeft / (duration * 60)) * 2 * Math.PI * 130}`,
                                    transform: 'rotate(-90deg)',
                                    transformOrigin: 'center'
                                }}
                            />
                        </svg>
                        <div className="timer-inner">
                            <div className="timer-time">{formatTime(timeLeft)}</div>
                            <div className="timer-status">
                                {mode === 'completed' ? 'Session Complete' : mode === 'paused' ? 'Paused' : 'Focusing...'}
                            </div>
                        </div>
                    </div>

                    <div className="timer-controls">
                        {mode !== 'completed' && (
                            <>
                                {mode === 'running' ? (
                                    <Button onClick={pauseTimer} variant="secondary">Pause</Button>
                                ) : (
                                    <Button onClick={resumeTimer} variant="primary">Resume</Button>
                                )}
                                <Button onClick={stopTimer} variant="danger">Stop</Button>
                            </>
                        )}
                        {mode === 'completed' && (
                            <Button onClick={() => setMode('setup')} variant="primary">Start New Session</Button>
                        )}
                    </div>

                    {mode !== 'completed' && (
                        <div className="music-control-mini" style={{ width: '100%', marginTop: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '10px', marginBottom: '10px', justifyContent: 'center' }}>
                                <button onClick={toggleMusic} className={`music-btn ${isMusicEnabled ? 'active' : ''}`} title="Toggle Music">
                                    {isMusicEnabled ? '🎵' : '🔇'}
                                </button>
                            </div>

                            {isMusicEnabled && (
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    {(!playlist || playlist.length === 0) ? (
                                        <div style={{ color: 'var(--warning-color, #ffaa00)' }}>
                                            No music found. Please add tracks in Settings.
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 600, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentTrack?.name}
                                            </div>

                                            <select
                                                value={currentTrack?.id || ''}
                                                onChange={handleTrackChange}
                                                className="anime-select"
                                                style={{
                                                    width: '200px',
                                                    padding: '4px',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    border: 'none',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {playlist?.map(track => (
                                                    <option key={track.id} value={track.id}>{track.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={showRulesModal}
                onClose={() => setShowRulesModal(false)}
                title={timerType === 'pomodoro' || timerType === 'custom' ? "Focus Rules 🧘‍♂️" : timerType === 'shortBreak' ? "Break Time ☕" : "Long Break 🌴"}
            >
                <div className="rules-content">
                    {(timerType === 'pomodoro' || timerType === 'custom') ? (
                        <>
                            <p className="rules-intro">Before we start, let's set the stage for deep work:</p>
                            <ul className="rules-list">
                                <li>🔕 <strong>Silence your phone</strong> or place it in another room.</li>
                                <li>🌬️ <strong>Take a deep breath</strong> if you feel stuck or distracted.</li>
                                <li>📵 <strong>No social media</strong> until the timer ends.</li>
                                <li>💧 <strong>Keep water nearby</strong> to stay hydrated.</li>
                            </ul>
                        </>
                    ) : timerType === 'shortBreak' ? (
                        <>
                            <p className="rules-intro">Time for a quick recharge! Here's what to do:</p>
                            <ul className="rules-list">
                                <li>🚶 <strong>Stand up and stretch</strong> for a minute.</li>
                                <li>👀 <strong>Look away from screen</strong> - rest your eyes.</li>
                                <li>💧 <strong>Grab some water</strong> and hydrate.</li>
                                <li>🌬️ <strong>Take deep breaths</strong> to refresh your mind.</li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <p className="rules-intro">You've earned a longer break! Make the most of it:</p>
                            <ul className="rules-list">
                                <li>🚶‍♂️ <strong>Take a walk</strong> outside if possible.</li>
                                <li>🍎 <strong>Have a healthy snack</strong> to refuel.</li>
                                <li>🎵 <strong>Listen to relaxing music</strong> or meditate.</li>
                                <li>💬 <strong>Chat with someone</strong> or call a friend.</li>
                                <li>📵 <strong>Avoid social media</strong> - truly disconnect.</li>
                            </ul>
                        </>
                    )}
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <Button onClick={handleConfirmStart} className="ready-btn">
                            {(timerType === 'pomodoro' || timerType === 'custom') ? "I'm Ready to Focus" : "Start Break"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Custom Timer Modal */}
            <Modal
                isOpen={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                title="Custom Timer"
            >
                <div className="custom-timer-content">
                    <p className="custom-intro">Set a custom duration for your work session</p>

                    <div className="custom-presets">
                        {[5, 10, 15, 20, 25, 30].map(min => (
                            <button
                                key={min}
                                className={`custom-preset-btn ${customDuration === min ? 'active' : ''}`}
                                onClick={() => setCustomDuration(min)}
                            >
                                {min}m
                            </button>
                        ))}
                    </div>

                    <div className="custom-input-group">
                        <label>Custom duration (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            max="180"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            className="custom-input"
                            placeholder="Minutes"
                        />
                    </div>

                    <button onClick={handleSetCustomTimer} className="set-timer-btn">
                        Set Timer
                    </button>
                </div>
            </Modal>

            {/* Switch Timer Confirmation Modal */}
            <Modal
                isOpen={showSwitchConfirmModal}
                onClose={() => setShowSwitchConfirmModal(false)}
                title="Switch Timer? ⚠️"
            >
                <div className="confirm-switch-content">
                    <p>You have a timer running. Are you sure you want to terminate it and start a new one?</p>
                    <div className="confirm-buttons">
                        <button onClick={() => setShowSwitchConfirmModal(false)} className="cancel-btn">
                            Keep Current Timer
                        </button>
                        <button onClick={handleConfirmSwitch} className="confirm-btn">
                            Yes, Switch Timer
                        </button>
                    </div>
                </div>
            </Modal>


            <style>{`
                .focus-container {
                    padding: 0 20px;
                    height: calc(100vh - 100px);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }

                /* Timer Mode Tabs */
                .timer-mode-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .mode-tab {
                    padding: 10px 20px;
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: transparent;
                    color: var(--text-color);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .mode-tab:hover {
                    border-color: var(--tab-color);
                    color: var(--tab-color);
                }

                .mode-tab.active {
                    background: var(--tab-color);
                    border-color: var(--tab-color);
                    color: white;
                }

                /* Setup Controls */
                .setup-controls {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin: 12px 0;
                }

                .control-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.95rem;
                }

                .control-btn.start {
                    color: white;
                }

                .control-btn.stop {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    color: var(--text-color);
                }

                .control-btn.reset {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    color: var(--text-color);
                }

                .control-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                /* Loop Button */
                .loop-btn {
                    padding: 8px 20px;
                    border-radius: 25px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: transparent;
                    color: var(--text-color);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin: 8px 0;
                }

                .loop-btn.active {
                    background: #3498db;
                    border-color: #3498db;
                    color: white;
                }

                /* Pomodoro Counter */
                .pomodoro-counter {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 8px;
                    padding: 8px 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    color: var(--text-color);
                    opacity: 0.8;
                    font-size: 0.9rem;
                }

                .reset-count-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: var(--text-color);
                    padding: 4px 12px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                }

                .reset-count-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Setup Circle */
                .setup-circle {
                    width: 180px;
                    height: 180px;
                    margin: 10px auto;
                }

                /* Custom Timer Modal */
                .custom-timer-content {
                    text-align: center;
                    padding: 10px;
                }

                .custom-intro {
                    color: var(--text-color);
                    opacity: 0.8;
                    margin-bottom: 20px;
                }

                .custom-presets {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 25px;
                }

                .custom-preset-btn {
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: transparent;
                    color: var(--text-color);
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .custom-preset-btn:hover,
                .custom-preset-btn.active {
                    background: #3498db;
                    border-color: #3498db;
                    color: white;
                }

                .custom-input-group {
                    margin-bottom: 25px;
                    text-align: center;
                }

                .custom-input-group label {
                    display: block;
                    margin-bottom: 15px;
                    color: var(--text-color);
                    opacity: 0.8;
                    font-size: 0.95rem;
                }

                .custom-input {
                    width: 50%;
                    min-width: 120px;
                    display: block;
                    margin: 0 auto;
                    padding: 12px 15px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-color);
                    font-size: 1.5rem;
                    text-align: center;
                    font-weight: 600;
                    -moz-appearance: textfield; /* Firefox */
                }

                .custom-input::-webkit-outer-spin-button,
                .custom-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                .custom-input:focus {
                    outline: none;
                    border-color: #3498db;
                }

                .set-timer-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 10px;
                    border: none;
                    background: #3498db;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .set-timer-btn:hover {
                    background: #2980b9;
                }

                /* Switch Confirmation Modal */
                .confirm-switch-content {
                    text-align: center;
                    padding: 10px;
                }

                .confirm-switch-content p {
                    margin-bottom: 25px;
                    color: var(--text-color);
                    font-size: 1rem;
                }

                .confirm-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .cancel-btn {
                    padding: 12px 20px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: transparent;
                    color: var(--text-color);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .confirm-btn {
                    padding: 12px 20px;
                    border-radius: 10px;
                    border: none;
                    background: #e74c3c;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .confirm-btn:hover {
                    background: #c0392b;
                }

                .timer-glass-panel {
                    background: var(--glass-panel-bg);
                    backdrop-filter: blur(10px);
                    padding: 25px 30px;
                    border-radius: 20px;
                    text-align: center;
                    width: 100%;
                    max-width: 450px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border-color);
                    margin: 0 auto;
                }

                .drag-handle {
                    position: absolute;
                    top: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    cursor: grab;
                    color: var(--text-color);
                    opacity: 0.4;
                    padding: 4px 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.2s;
                }

                .drag-handle:hover {
                    opacity: 0.8;
                }

                .pin-button {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(var(--primary-rgb, 255, 117, 140), 0.15);
                    border: 1px solid var(--primary-color);
                    padding: 8px 14px;
                    border-radius: 20px;
                    color: var(--primary-color);
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                    z-index: 10;
                }

                .pin-button:hover {
                    background: var(--primary-color);
                    color: white;
                }

                .timer-circle {
                    position: relative;
                    width: 280px;
                    height: 280px;
                    margin: 30px auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .progress-ring {
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .progress-ring__progress {
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.5s ease;
                }

                .timer-inner {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .timer-time {
                    font-size: 3.5rem;
                    font-weight: bold;
                    font-family: monospace;
                    color: var(--text-color);
                    line-height: 1;
                }

                .timer-status {
                    font-size: 1rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    margin-top: 8px;
                }

                .skip-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 20px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: var(--text-color);
                    opacity: 0.8;
                }

                .skip-checkbox input {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }

                h1 {
                    margin: 0 0 10px 0;
                    color: var(--primary-color);
                }

                .subtitle {
                    color: #666;
                    margin-bottom: 30px;
                }

                .duration-selector {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .duration-display {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .duration-value {
                    font-size: 4rem;
                    font-weight: bold;
                    line-height: 1;
                    color: var(--text-color);
                }

                .duration-unit {
                    font-size: 1rem;
                    color: #888;
                }

                .adjust-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: rgba(255,255,255,0.5);
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .adjust-btn:hover {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .quick-presets {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 30px;
                }

                .preset-btn {
                    padding: 5px 15px;
                    border-radius: 15px;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: transparent;
                    cursor: pointer;
                    color: #666;
                    transition: all 0.2s;
                }

                .preset-btn:hover, .preset-btn.active {
                    background: var(--secondary-color);
                    color: white;
                    border-color: var(--secondary-color);
                }

                .start-btn {
                    width: 100%;
                    padding: 15px;
                    font-size: 1.1rem;
                }

                .timer-controls {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 40px;
                }

                .music-toggle {
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }

                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .music-note {
                    font-size: 0.8rem;
                    color: #888;
                    font-style: italic;
                }

                .music-control-mini {
                    margin-top: 20px;
                }

                .music-btn {
                    background: none;
                    border: 1px solid rgba(0,0,0,0.1);
                    padding: 5px 15px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #666;
                }

                .music-btn.active {
                    background: var(--secondary-color);
                    color: white;
                    border-color: var(--secondary-color);
                }

                .completion-content {
                    text-align: center;
                    padding: 20px;
                }

                .trophy {
                    font-size: 4rem;
                    margin-bottom: 15px;
                    animation: bounce 1s infinite;
                }

                .quote {
                    font-style: italic;
                    color: #666;
                    margin: 15px 0 25px 0;
                    font-size: 1.1rem;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                /* Dark mode overrides removed to respect app theme */

                .rules-content {
                    text-align: left;
                    padding: 10px;
                }

                .rules-intro {
                    font-size: 1rem;
                    color: var(--text-color);
                    margin-bottom: 20px;
                }

                .rules-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .rules-list li {
                    font-size: 1rem;
                    color: var(--text-color);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    border: 1px solid rgba(0,0,0,0.05);
                }

                [data-theme='dark'] .rules-list li {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                    color: #d6d6d6;
                }

                .ready-btn {
                    width: 100%;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default FocusTime;
