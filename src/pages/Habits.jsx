import React, { useState, useEffect } from 'react';
import { useHabits } from '../context/HabitsContext';
import { useToast } from '../context/ToastContext';
import { useCelebration } from '../context/CelebrationContext';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Quote from '../components/Quote';
import { subDays, format, isSameDay } from 'date-fns';

const Habits = () => {
    const { habits, createHabit, deleteHabit, toggleHabitLog } = useHabits();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ title: '', category: 'Health' });
    const [showMilestone, setShowMilestone] = useState(null);

    const { showToast } = useToast();
    const { triggerCelebration } = useCelebration();

    // Category icons mapping
    const categoryIcons = {
        'Health': '💪',
        'Productivity': '🚀',
        'Mindfulness': '🧘',
        'Learning': '📚',
        'Fitness': '🏃',
        'Social': '👥',
        'Creative': '🎨',
        'Finance': '💰'
    };

    // Statistics calculations
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.completedToday).length;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.maxStreak || 0)) : 0;
    const avgCompletionRate = habits.length > 0
        ? Math.round((completedToday / totalHabits) * 100)
        : 0;

    // Streak milestones
    const streakMilestones = [7, 14, 21, 30, 60, 100, 365];
    const getMilestoneMessage = (streak) => {
        if (streak >= 365) return { emoji: '👑', msg: 'Legendary! 1 Year!' };
        if (streak >= 100) return { emoji: '🏆', msg: '100 Days!' };
        if (streak >= 60) return { emoji: '💎', msg: '60 Days!' };
        if (streak >= 30) return { emoji: '🔥', msg: '1 Month!' };
        if (streak >= 21) return { emoji: '⭐', msg: '21 Days!' };
        if (streak >= 14) return { emoji: '🌟', msg: '2 Weeks!' };
        if (streak >= 7) return { emoji: '✨', msg: '1 Week!' };
        return null;
    };

    const handleCreate = async () => {
        if (!newHabit.title.trim()) return;
        try {
            await createHabit(newHabit);
            setNewHabit({ title: '', category: 'Health' });
            setIsModalOpen(false);
            showToast('Habit created successfully!', 'success');
        } catch (error) {
            showToast('Failed to create habit', 'error');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [habitToDelete, setHabitToDelete] = useState(null);

    // Undo Confirmation State
    const [undoModalOpen, setUndoModalOpen] = useState(false);
    const [habitToUndo, setHabitToUndo] = useState(null);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setHabitToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (habitToDelete) {
            try {
                await deleteHabit(habitToDelete);
                setDeleteModalOpen(false);
                setHabitToDelete(null);
                showToast('Habit deleted', 'success');
            } catch (error) {
                showToast('Failed to delete habit', 'error');
            }
        }
    };


    const handleCheckIn = async (e, id) => {
        e.stopPropagation();
        const habit = habits.find(h => h.id === id);

        // If habit is already completed, ask for confirmation before undoing
        if (habit && habit.completedToday) {
            setHabitToUndo(habit);
            setUndoModalOpen(true);
            return;
        }

        await executeToggle(id);
    };

    const executeToggle = async (id) => {
        try {
            await toggleHabitLog(id, new Date());
            const habit = habits.find(h => h.id === id);

            // Check for milestone (only when completing, not undoing)
            if (habit && !habit.completedToday) {
                // We just toggled it, so if it WAS NOT completed before toggle (which is this case),
                // we check the NEW state... actually toggleHabitLog updates the backend.
                // refreshHabits is called... wait, we need the updated habit.
                // But simplified: we just assume success and show toast.

                // Note: The habit object here is stale (pre-update). 
                // So if it was NOT completedToday, it is NOW completed.
                const newStreak = (habit.streak || 0) + 1;
                const milestone = getMilestoneMessage(newStreak);
                if (milestone && streakMilestones.includes(newStreak)) {
                    setShowMilestone({ ...milestone, streak: newStreak, habitTitle: habit.title });
                    setTimeout(() => setShowMilestone(null), 3000);
                }

                // Check for Celebration Popup (Streak System Engine)
                const uncompletedActiveHabits = habits.filter(h => !h.completedToday);
                if (uncompletedActiveHabits.length === 1) {
                    triggerCelebration('habits');
                }

                showToast(`Habit completed! Streak: ${newStreak}`, 'success');
            } else {
                showToast(`Habit updated!`, 'success');
            }
        } catch (error) {
            showToast('Failed to update habit', 'error');
        }
    };

    const confirmUndo = async () => {
        if (habitToUndo) {
            await executeToggle(habitToUndo.id); // Toggle it off
            setUndoModalOpen(false);
            setHabitToUndo(null);
        }
    };


    // Generate last 7 days for the mini-heatmap
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

    return (
        <div className="habits-container">
            {/* Milestone Celebration Popup */}
            {showMilestone && (
                <div className="milestone-popup">
                    <div className="milestone-content">
                        <span className="milestone-emoji">{showMilestone.emoji}</span>
                        <div className="milestone-text">
                            <strong>{showMilestone.habitTitle}</strong>
                            <span>{showMilestone.msg}</span>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '5px' }}>
                <Quote category="goals" />
            </div>

            <div className="habits-header">
                <div className="header-left">
                    <h1>Habit Tracker</h1>
                    <span className="habit-count">{habits.length} Habits</span>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="new-habit-btn">+ New Habit</Button>
            </div>

            {/* Statistics Dashboard */}
            <div className="habits-stats-dashboard">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>📊</div>
                    <div className="stat-info">
                        <span className="stat-value">{totalHabits}</span>
                        <span className="stat-label">Total Habits</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(46, 204, 113, 0.2)' }}>✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{completedToday}/{totalHabits}</span>
                        <span className="stat-label">Done Today</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 107, 107, 0.2)' }}>🔥</div>
                    <div className="stat-info">
                        <span className="stat-value">{bestStreak}</span>
                        <span className="stat-label">Best Streak</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(52, 152, 219, 0.2)' }}>📈</div>
                    <div className="stat-info">
                        <span className="stat-value">{avgCompletionRate}%</span>
                        <span className="stat-label">Today's Rate</span>
                    </div>
                </div>
            </div>

            <div className="habits-grid">
                {habits.length === 0 ? (
                    <div className="empty-state">
                        <p>No habits yet. Start building a streak today!</p>
                    </div>
                ) : (
                    habits.map(habit => {
                        const milestone = getMilestoneMessage(habit.streak || 0);
                        return (
                            <div key={habit.id} className={`anime-habit-card ${habit.completedToday ? 'completed-glow' : ''}`}>
                                <div className="habit-card-header">
                                    <div className="habit-info">
                                        <div className="habit-category-badge">
                                            <span className="category-icon">{categoryIcons[habit.category] || '📌'}</span>
                                            <span>{habit.category}</span>
                                        </div>
                                        <h3>{habit.title}</h3>
                                    </div>
                                    <button onClick={(e) => handleDelete(e, habit.id)} className="icon-btn delete" title="Delete Habit">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>

                                {/* 7-Day Heatmap Grid */}
                                <div className="heatmap-section">
                                    <div className="heatmap-label">Last 7 days</div>
                                    <div className="heatmap-grid">
                                        {last7Days.map((date, i) => {
                                            const isToday = i === 6;
                                            const isCompleted = isToday && habit.completedToday;
                                            // For past days, we show filled if within streak count
                                            const streakFilled = !isToday && (habit.streak || 0) > (6 - i);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`heatmap-cell ${isCompleted || streakFilled ? 'filled' : ''} ${isToday ? 'today' : ''}`}
                                                    title={format(date, 'EEE, MMM d')}
                                                >
                                                    <span className="heatmap-day">{format(date, 'EEE')[0]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Streak Display */}
                                <div className="habit-visuals">
                                    <div className="streak-display">
                                        <div className="streak-pill">
                                            <span role="img" aria-label="fire">🔥</span>
                                            <span>{habit.streak || 0} Day Streak</span>
                                        </div>
                                        {milestone && (
                                            <div className="milestone-badge" title={milestone.msg}>
                                                {milestone.emoji}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="habit-actions">
                                    <button
                                        onClick={(e) => handleCheckIn(e, habit.id)}
                                        className={`check-in-btn ${habit.completedToday ? 'completed' : ''}`}
                                    >
                                        {habit.completedToday ? (
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                <span>Done Today!</span>
                                            </>
                                        ) : (
                                            <span>✓ Check In</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Habit"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Input
                        placeholder="Habit Title"
                        value={newHabit.title}
                        onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['Health', 'Productivity', 'Mindfulness', 'Learning'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setNewHabit({ ...newHabit, category: cat })}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '15px',
                                    border: '1px solid var(--border-color)',
                                    background: newHabit.category === cat ? 'var(--primary-color)' : 'transparent',
                                    color: newHabit.category === cat ? 'white' : 'var(--text-color)',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <Button onClick={handleCreate}>Create Habit</Button>
                </div>
            </Modal>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Habit"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Are you sure you want to delete this habit?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmDelete} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={undoModalOpen}
                onClose={() => setUndoModalOpen(false)}
                title="Undo Habit?"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '10px', color: 'var(--text-color)', fontSize: '1.2rem' }}>🤔</p>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>
                        Are you sure? You didn't finish <strong>{habitToUndo?.title}</strong> today?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setUndoModalOpen(false)} style={{ background: 'var(--primary-color)', color: 'white' }}>No, I did it!</Button>
                        <Button onClick={confirmUndo} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Yes, undo it</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .habits-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    height: 100%;
                    padding: 20px 40px;
                    overflow: hidden;
                    background: var(--bg-gradient);
                }

                .habits-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 20px;
                    border-bottom: var(--glass-border);
                    margin-bottom: 10px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .habits-header h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .habit-count {
                    background: rgba(var(--primary-rgb), 0.15);
                    color: var(--primary-color);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }

                .new-habit-btn {
                    height: 36px;
                    border-radius: 8px;
                    padding: 0 18px;
                    font-size: 0.9rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .new-habit-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.3);
                    filter: brightness(1.1);
                }

                /* Statistics Dashboard */
                .habits-stats-dashboard {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .habits-stats-dashboard .stat-card {
                    background: var(--card-bg);
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                }

                .habits-stats-dashboard .stat-card:hover {
                    background: var(--card-elevated);
                    border-color: rgba(73, 136, 196, 0.2);
                }

                .habits-stats-dashboard .stat-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                }

                .habits-stats-dashboard .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .habits-stats-dashboard .stat-value {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--text-color);
                }

                .habits-stats-dashboard .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Milestone Popup */
                .milestone-popup {
                    position: fixed;
                    top: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 9999;
                    animation: milestoneSlide 0.5s ease-out;
                }

                @keyframes milestoneSlide {
                    from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }

                .milestone-content {
                    background: linear-gradient(145deg, #8b5cf6, #6366f1);
                    padding: 20px 30px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4);
                }

                .milestone-emoji {
                    font-size: 2.5rem;
                    animation: bounce 0.5s ease infinite alternate;
                }

                @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(-5px); }
                }

                .milestone-text {
                    display: flex;
                    flex-direction: column;
                    color: white;
                }

                .milestone-text strong {
                    font-size: 1.1rem;
                }

                .milestone-text span {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }

                /* Category Badge */
                .habit-category-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--nav-hover-bg);
                    padding: 4px 10px;
                    border-radius: 20px;
                    width: fit-content;
                    margin-bottom: 5px;
                }

                .category-icon {
                    font-size: 0.9rem;
                }

                .habit-category-badge span:last-child {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    opacity: 0.7;
                }

                /* Heatmap Grid */
                .heatmap-section {
                    margin: 10px 0;
                }

                .heatmap-label {
                    font-size: 0.7rem;
                    color: var(--text-color);
                    opacity: 0.5;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .heatmap-grid {
                    display: flex;
                    gap: 6px;
                }

                .heatmap-cell {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: var(--nav-hover-bg);
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .heatmap-cell.filled {
                    background: linear-gradient(145deg, var(--secondary-color), #2ecc71);
                    border-color: var(--secondary-color);
                }

                .heatmap-cell.today {
                    border: 2px solid var(--primary-color);
                }

                .heatmap-cell.today.filled {
                    border-color: var(--secondary-color);
                    box-shadow: 0 0 10px rgba(46, 204, 113, 0.4);
                }

                .heatmap-day {
                    font-size: 0.65rem;
                    color: var(--text-color);
                    opacity: 0.5;
                    font-weight: 600;
                }

                .heatmap-cell.filled .heatmap-day {
                    color: white;
                    opacity: 1;
                }

                /* Streak Display */
                .streak-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .milestone-badge {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.3));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    animation: glow 2s ease-in-out infinite alternate;
                }

                @keyframes glow {
                    from { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
                    to { box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); }
                }

                .habits-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    overflow-y: auto;
                    padding: 5px;
                    padding-bottom: 40px;
                }

                .anime-habit-card {
                    background: var(--card-bg);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    position: relative;
                }

                .anime-habit-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                    border-color: rgba(73, 136, 196, 0.2);
                    background: var(--card-elevated);
                }

                .anime-habit-card.completed-glow {
                    border-color: rgba(39, 174, 96, 0.4);
                    box-shadow: 0 0 15px rgba(39, 174, 96, 0.15);
                }

                .habit-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .habit-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .habit-category {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-color);
                    opacity: 0.5;
                    font-weight: 600;
                }

                .habit-info h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .habit-visuals {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .streak-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--nav-hover-bg);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                }

                .habit-actions {
                    margin-top: auto;
                }

                .check-in-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    border: none;
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 1rem;
                }

                .check-in-btn:hover {
                    background: var(--nav-hover-bg);
                    filter: brightness(1.1);
                }

                .check-in-btn.completed {
                    background: var(--secondary-color);
                    color: white;
                    box-shadow: 0 4px 12px rgba(var(--secondary-rgb), 0.3);
                }

                .icon-btn.delete {
                    background: transparent;
                    border: none;
                    color: var(--text-color);
                    opacity: 0.3;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .icon-btn.delete:hover {
                    background: rgba(255, 77, 77, 0.1);
                    color: #ff4d4d;
                    opacity: 1;
                }

                .habit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .form-group label {
                    font-weight: 500;
                    font-size: 0.9rem;
                    color: var(--text-color);
                }

                .anime-select {
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: rgba(255,255,255,0.5);
                    font-family: inherit;
                    outline: none;
                    width: 100%;
                    box-sizing: border-box;
                }
                .anime-select:focus {
                    border-color: var(--primary-color);
                    background: rgba(255,255,255,0.8);
                }

                .form-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px;
                    color: var(--text-color);
                    opacity: 0.4;
                    font-size: 1.1rem;
                }

                @media (max-width: 768px) {
                    .habits-container {
                        padding: 16px;
                    }

                    .habits-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }

                    .habits-title h1 {
                        font-size: 1.5rem;
                    }

                    .header-actions {
                        width: 100%;
                    }

                    .new-habit-btn {
                        width: 100%;
                    }

                    .habits-stats-dashboard {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                    }

                    .stat-card {
                        padding: 12px;
                    }

                    .stat-icon {
                        width: 36px;
                        height: 36px;
                        font-size: 1.1rem;
                    }

                    .stat-value {
                        font-size: 1.2rem;
                    }

                    .habit-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }

                    .habit-card {
                        padding: 16px;
                    }

                    .habit-log-btn {
                        width: 44px;
                        height: 44px;
                        font-size: 1.2rem;
                    }
                }

                @media (prefers-color-scheme: dark) {
                    .anime-select {
                        background: rgba(0,0,0,0.3);
                        color: white;
                        border-color: rgba(255,255,255,0.1);
                    }
                }
            `}</style>
        </div>
    );
};

export default Habits;
