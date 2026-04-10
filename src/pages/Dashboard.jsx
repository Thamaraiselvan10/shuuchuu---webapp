
import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TasksContext';
import { useGoals } from '../context/GoalsContext';
import { useTimerContext } from '../context/TimerContext';
import { useProfile } from '../context/ProfileContext';
import { useHabits } from '../context/HabitsContext';
import { useSettings } from '../context/SettingsContext';
import { noteService } from '../services/noteService';
import { useNavigate } from 'react-router-dom';
import Quote from '../components/Quote';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { format, getDayOfYear, isToday, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { articles } from '../data/articles';
import {
    CheckCircle, Calendar, Clock, Target, FileText, Repeat, StickyNote, Check,
    Play, Plus, Zap, TrendingUp, Flame, ArrowRight, Sparkles, Sun, Moon, Coffee, Info, Maximize2
} from 'lucide-react';

const Dashboard = () => {
    const { tasks, updateTask } = useTasks();
    const { goals } = useGoals();
    const {
        timeLeft,
        isActive,
        formatTime,
        getTodayMinutes,
        getYesterdayMinutes,
        getStreak,
        dailyGoalHours,
        setDailyGoalHours,
        duration,
        setMode,
        mode,
        focusHistory
    } = useTimerContext();
    const { profile } = useProfile();
    const { habits, toggleHabitLog } = useHabits();
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();

    // Widget visibility from settings
    const widgets = settings.dashboardWidgets || {};

    const [recentNotes, setRecentNotes] = useState([]);

    // Derived values
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    let greetingIcon = <Sun size={28} />;
    if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon';
        greetingIcon = <Coffee size={28} />;
    }
    if (hour >= 18) {
        greeting = 'Good evening';
        greetingIcon = <Moon size={28} />;
    }

    const day = getDayOfYear(new Date());
    const dailyArticle = articles.length > 0 ? articles[day % articles.length] : null;

    // Goal editing state
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(dailyGoalHours);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const notes = await noteService.getAll();
                setRecentNotes(notes.slice(0, 3));
            } catch (err) {
                console.error('Failed to fetch notes:', err);
            }
        };
        fetchNotes();
    }, []);

    const handleSaveGoal = () => {
        setDailyGoalHours(parseFloat(tempGoal));
        setIsEditingGoal(false);
    };

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const todaysFocusTasks = tasks.filter(t => t.is_today_focus === 1 && t.status !== 'completed');

    // Today's tasks
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todaysTasks = tasks.filter(t => {
        if (!t.due_at) return false;
        const dueDate = new Date(t.due_at);
        return isWithinInterval(dueDate, { start: todayStart, end: todayEnd });
    });

    // Focus Stats
    const todayMinutes = getTodayMinutes();
    const yesterdayMinutes = getYesterdayMinutes();
    const streak = getStreak();
    const dailyGoalMinutes = dailyGoalHours * 60;
    const progressPercent = Math.min(100, (todayMinutes / dailyGoalMinutes) * 100);

    // Get top 2 active goals
    const activeGoals = goals.filter(g => g.status === 'in-progress' || g.status === 'active').slice(0, 2);

    // Habits completed today
    const habitsCompletedToday = habits.filter(h => h.logs?.some(log => isToday(new Date(log.completed_at)))).length;

    // Calculate Focus Score
    // 40% - Daily Focus Time Goal
    const focusTimeScore = Math.round(progressPercent * 0.4);

    // 30% - Habits CompletedToday
    const habitsScore = Math.round((habitsCompletedToday / Math.max(habits.length, 1)) * 100 * 0.3);

    // 30% - Tasks Completed Today (Both pending list completions and focus session completions)
    // We filter for tasks that were completed TODAY
    const tasksCompletedToday = tasks.filter(t => t.status === 'completed' && isToday(new Date(t.updatedAt || new Date()))).length;
    // Total reachable tasks for today (today's tasks + habits count as a proxy for activity level if no tasks)
    const totalDailyTasks = Math.max(todaysTasks.length + pendingTasks.length + tasksCompletedToday, 5); // Assume at least 5 things to do
    const tasksScore = Math.round((tasksCompletedToday / totalDailyTasks) * 100 * 0.3);

    const focusScore = Math.min(100, focusTimeScore + habitsScore + tasksScore);

    const [showScoreDetails, setShowScoreDetails] = useState(false);
    const [showActivityInfo, setShowActivityInfo] = useState(false);

    // Habit Undo State
    const [undoModalOpen, setUndoModalOpen] = useState(false);
    const [habitToUndo, setHabitToUndo] = useState(null);

    const handleHabitClick = (habit, isDone) => {
        if (isDone) {
            setHabitToUndo(habit);
            setUndoModalOpen(true);
        } else {
            toggleHabitLog(habit.id);
        }
    };

    const confirmUndo = async () => {
        if (habitToUndo) {
            await toggleHabitLog(habitToUndo.id);
            setUndoModalOpen(false);
            setHabitToUndo(null);
        }
    };

    const handleStartFocus = () => {
        navigate('/focus', { state: { autoStart: true } });
    };

    const handleToggleTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            updateTask(taskId, { status: task.status === 'completed' ? 'pending' : 'completed' });
        }
    };

    return (
        <div className="dashboard-hub">
            {/* Command Center - Hero Section */}
            <section className="command-center">
                <div className="command-left">
                    <div className="greeting-icon breath-animation">{greetingIcon}</div>
                    <div className="greeting-text">
                        <h1>{greeting}, {profile.name || 'Friend'}!</h1>
                        <p className="date-display">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                    </div>
                </div>

                {/* Daily Goal Progress - Center */}
                <div className="command-center-goal" onClick={() => { setTempGoal(dailyGoalHours); setIsEditingGoal(!isEditingGoal); }}>
                    <div className="goal-ring">
                        <svg viewBox="0 0 100 100">
                            <circle className="goal-ring-bg" cx="50" cy="50" r="42" />
                            <circle
                                className="goal-ring-progress"
                                cx="50" cy="50" r="42"
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 42}`,
                                    strokeDashoffset: `${(2 * Math.PI * 42) * (1 - progressPercent / 100)}`
                                }}
                            />
                        </svg>
                        <div className="goal-ring-value">
                            <span className="goal-percent">{Math.round(progressPercent)}%</span>
                            <span className="goal-label">of {dailyGoalHours}h</span>
                        </div>
                    </div>
                    <div className="goal-info-text">
                        <span className="goal-title-text">Daily Goal</span>
                        <span className="goal-mins">{todayMinutes} mins focused</span>
                    </div>

                    {isEditingGoal && (
                        <div className="goal-edit-popup" onClick={(e) => e.stopPropagation()}>
                            <label>Daily Goal (Hours)</label>
                            <input type="number" step="0.5" min="0.5" max="12" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} />
                            <div className="popup-actions">
                                <button className="save-btn" onClick={handleSaveGoal}>Save</button>
                                <button className="cancel-btn" onClick={() => setIsEditingGoal(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="command-right">
                    <div className="focus-score-card">
                        <div className="score-ring">
                            <svg viewBox="0 0 100 100">
                                <circle className="score-bg" cx="50" cy="50" r="45" />
                                <circle
                                    className="score-progress"
                                    cx="50" cy="50" r="45"
                                    style={{
                                        strokeDasharray: `${2 * Math.PI * 45}`,
                                        strokeDashoffset: `${(2 * Math.PI * 45) * (1 - focusScore / 100)}`
                                    }}
                                />
                            </svg>
                            <div className="score-value">
                                <span className="score-number">{focusScore}</span>
                                <span className="score-label">Score</span>
                                <button
                                    className="score-info-btn"
                                    onMouseEnter={() => setShowScoreDetails(true)}
                                    onMouseLeave={() => setShowScoreDetails(false)}
                                    onClick={() => setShowScoreDetails(!showScoreDetails)}
                                >
                                    <Info size={12} />
                                </button>
                                {showScoreDetails && (
                                    <div className="score-tooltip">
                                        <h4>Focus Score Breakdown</h4>
                                        <div className="score-breakdown">
                                            <div className="sb-row">
                                                <span>Focus Time:</span>
                                                <span className="sb-val">{focusTimeScore}/40</span>
                                            </div>
                                            <div className="sb-row">
                                                <span>Habits:</span>
                                                <span className="sb-val">{habitsScore}/30</span>
                                            </div>
                                            <div className="sb-row">
                                                <span>Tasks:</span>
                                                <span className="sb-val">{tasksScore}/30</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="score-details">
                            <div className="detail-item">
                                <Flame size={16} />
                                <span>{streak} day streak</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Bar */}
            <section className="quick-actions">
                <button className="action-btn primary" onClick={handleStartFocus}>
                    <Play size={18} /> Start Focus
                </button>
                <button className="action-btn" onClick={() => navigate('/tasks')}>
                    <Plus size={18} /> New Task
                </button>
                <button className="action-btn" onClick={() => navigate('/goals')}>
                    <Target size={18} /> View Goals
                </button>
                <button className="action-btn" onClick={() => navigate('/calendar')}>
                    <Calendar size={18} /> Calendar
                </button>
            </section>

            {/* Bento Grid */}
            <div className="bento-grid">

                {/* Row 1: Daily Article (2 cols) */}
                {(widgets.dailyArticle !== false) && dailyArticle && (
                    <div
                        className="bento-card bento-md article-card"
                        style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url(${dailyArticle.image})` }}
                        onClick={() => navigate(`/wellness?articleId=${dailyArticle.id}`)}
                    >
                        <div className="article-badge">Daily Read</div>
                        <div className="article-content">
                            <h4>{dailyArticle.title}</h4>
                            <span className="article-time">{dailyArticle.readTime}</span>
                        </div>
                    </div>
                )}

                {/* Row 1: Habits (1 col) */}
                {(widgets.habits !== false) && (
                    <div className="bento-card bento-sm habits-card">
                        <div className="card-header">
                            <h3><Repeat size={16} /> Habits</h3>
                            <span className="badge">{habitsCompletedToday}/{habits.length}</span>
                        </div>
                        <div className="habits-grid">
                            {habits.length === 0 ? (
                                <p className="empty-state">Build routine!</p>
                            ) : (
                                habits.slice(0, 4).map(habit => {
                                    const isDone = habit.logs?.some(log => isToday(new Date(log.completed_at)));
                                    return (
                                        <div
                                            key={habit.id}
                                            className={`habit-chip ${isDone ? 'done' : ''}`}
                                            onClick={() => handleHabitClick(habit, isDone)}
                                        >
                                            {isDone && <Check size={12} />}
                                            <span>{habit.title}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Row 1: Today's Focus Tasks (1 col) - View Only */}
                {(widgets.tasks !== false) && (
                    <div className="bento-card bento-sm tasks-card">
                        <div className="card-header">
                            <h3><CheckCircle size={16} /> Focus Tasks</h3>
                            <button
                                className="maximize-btn"
                                onClick={() => navigate('/tasks?focus=true')}
                                title="Open Today's Focus"
                            >
                                <Maximize2 size={14} />
                            </button>
                        </div>
                        <div className="tasks-list">
                            {todaysFocusTasks.length === 0 ? (
                                <p className="empty-state">No focus tasks</p>
                            ) : (
                                todaysFocusTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="task-row view-only">
                                        <span className={`task-dot p${task.priority || 0}`}></span>
                                        <span className="task-title">{task.title}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Row 2: Goals (1 col) */}
                {(widgets.goals !== false) && (
                    <div className="bento-card bento-sm goals-card">
                        <div className="card-header">
                            <h3><Target size={16} /> Active Goals</h3>
                            <span className="view-all" onClick={() => navigate('/goals')}>All <ArrowRight size={14} /></span>
                        </div>
                        <div className="goals-list">
                            {activeGoals.length === 0 ? (
                                <p className="empty-state">Set a goal to get started!</p>
                            ) : (
                                activeGoals.slice(0, 3).map(goal => {
                                    const percent = goal.total_phases > 0 ? Math.round((goal.completed_phases / goal.total_phases) * 100) : 0;
                                    return (
                                        <div key={goal.id} className="goal-item" onClick={() => navigate(`/goals/${goal.id}`)}>
                                            <div className="goal-info">
                                                <span className="goal-title">{goal.title}</span>
                                                <span className="goal-percent">{percent}%</span>
                                            </div>
                                            <div className="goal-bar">
                                                <div className="goal-fill" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Row 2: Notes (1 col) */}
                {(widgets.notes !== false) && (
                    <div className="bento-card bento-sm notes-card">
                        <div className="card-header">
                            <h3><StickyNote size={16} /> Notes</h3>
                            <span className="view-all" onClick={() => navigate('/notes')}><ArrowRight size={14} /></span>
                        </div>
                        <div className="notes-list">
                            {recentNotes.length === 0 ? (
                                <p className="empty-state">Jot down thoughts!</p>
                            ) : (
                                recentNotes.slice(0, 4).map(note => (
                                    <div key={note.id} className="note-item" onClick={() => navigate('/notes')}>
                                        <span className="note-title">{note.title || 'Untitled'}</span>
                                        <span className="note-preview">{note.content?.substring(0, 30)}...</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Activity Heat Map (2 cols) - GitHub Style */}
                <div className="bento-card bento-wide activity-card">
                    <div className="card-header">
                        <h3>
                            <Flame size={16} /> Activity
                            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <button
                                    className="info-btn-mini"
                                    onMouseEnter={() => setShowActivityInfo(true)}
                                    onMouseLeave={() => setShowActivityInfo(false)}
                                    onClick={() => setShowActivityInfo(!showActivityInfo)}
                                >
                                    <Info size={12} />
                                </button>
                                {showActivityInfo && (
                                    <div className="activity-tooltip">
                                        <h4>Heat Map Guide</h4>
                                        <p>Each square represents a day in 2026. Darker colors indicate more focus time.</p>
                                        <div className="tooltip-levels">
                                            <div className="level-row"><span className="l-dot l1"></span> <span>1-29 mins</span></div>
                                            <div className="level-row"><span className="l-dot l2"></span> <span>30-59 mins</span></div>
                                            <div className="level-row"><span className="l-dot l3"></span> <span>60-89 mins</span></div>
                                            <div className="level-row"><span className="l-dot l4"></span> <span>90+ mins</span></div>
                                        </div>
                                    </div>
                                )}
                            </span>
                        </h3>
                        <span className="activity-legend">
                            <span className="legend-text">Less</span>
                            <span className="legend-box l0"></span>
                            <span className="legend-box l1"></span>
                            <span className="legend-box l2"></span>
                            <span className="legend-box l3"></span>
                            <span className="legend-box l4"></span>
                            <span className="legend-text">More</span>
                        </span>
                    </div>
                    {(() => {
                        // Generate current year activity data (Jan - Dec)
                        const monthsData = [];
                        const today = new Date();
                        const currentYear = today.getFullYear();

                        for (let month = 0; month < 12; month++) {
                            const monthDate = new Date(currentYear, month, 1);
                            const monthName = format(monthDate, 'MMM');
                            const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
                            const startDayOffset = monthDate.getDay(); // 0 (Sun) - 6 (Sat)

                            const days = [];
                            // Add empty slots for days before start of month
                            for (let j = 0; j < startDayOffset; j++) {
                                days.push({ isEmpty: true });
                            }

                            // Add actual days
                            for (let d = 1; d <= daysInMonth; d++) {
                                const date = new Date(currentYear, month, d);
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const entry = focusHistory?.find(h => h.date === dateStr);
                                const minutes = entry?.minutes || 0;
                                let level = 0;
                                if (minutes > 0) level = 1;
                                if (minutes >= 30) level = 2;
                                if (minutes >= 60) level = 3;
                                if (minutes >= 90) level = 4;

                                days.push({
                                    date: dateStr,
                                    minutes,
                                    level,
                                    isToday: format(today, 'yyyy-MM-dd') === dateStr,
                                    dayNum: d
                                });
                            }
                            monthsData.push({ name: monthName, days });
                        }

                        return (
                            <div className="heatmap-wrapper monthly-view">
                                {monthsData.map((month, mIdx) => (
                                    <div key={mIdx} className="month-block">
                                        <div className="month-title">{month.name}</div>
                                        <div className="month-days-grid">
                                            {month.days.map((day, dIdx) => (
                                                day.isEmpty ? (
                                                    <div key={dIdx} className="heatmap-cell empty" />
                                                ) : (
                                                    <div
                                                        key={dIdx}
                                                        className={`heatmap-cell l${day.level} ${day.isToday ? 'today' : ''}`}
                                                        title={`${day.date}: ${day.minutes} min`}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

            </div>

            {/* Watermark Quote - Subtle at bottom */}
            <div className="quote-watermark">
                <Quote category="focus" />
            </div>

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
                .dashboard-hub {
                    padding: 24px 32px;
                    height: 100%;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    scrollbar-width: none;
                }
                .dashboard-hub::-webkit-scrollbar { display: none; }

                /* Command Center */
                .command-center {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, rgba(73, 136, 196, 0.15), rgba(86, 156, 214, 0.08));
                    border: 1px solid rgba(73, 136, 196, 0.2);
                    border-radius: 20px;
                    padding: 28px 32px;
                    backdrop-filter: blur(20px);
                    animation: fadeInUp 0.5s ease-out;
                    position: relative;
                    z-index: 50;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .command-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .greeting-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 16px rgba(73, 136, 196, 0.3);
                }

                .greeting-text h1 {
                    font-size: 1.8rem;
                    margin-bottom: 4px;
                    background: linear-gradient(135deg, var(--text-color), var(--primary-color));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .date-display {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    margin: 0;
                }

                /* Command Center Goal - Center Element */
                .command-center-goal {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: var(--card-bg);
                    padding: 14px 20px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .command-center-goal:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 16px rgba(73, 136, 196, 0.2);
                }

                .goal-ring {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    flex-shrink: 0;
                }

                .goal-ring svg {
                    transform: rotate(-90deg);
                    width: 100%;
                    height: 100%;
                }

                .goal-ring circle {
                    fill: none;
                    stroke-width: 6;
                }

                .goal-ring-bg { stroke: var(--border-color); }
                .goal-ring-progress {
                    stroke: var(--primary-color);
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.6s ease;
                }

                .goal-ring-value {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                }

                .goal-ring-value .goal-percent {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--primary-color);
                    line-height: 1;
                }

                .goal-ring-value .goal-label {
                    font-size: 0.55rem;
                    color: var(--text-muted);
                }

                .goal-info-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .goal-title-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .goal-mins {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .command-right {
                    display: flex;
                    align-items: center;
                }

                .focus-score-card {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: var(--card-bg);
                    padding: 16px 24px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    position: relative;
                }

                .score-info-btn {
                    position: absolute;
                    top: -4px;
                    right: -20px;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                .score-info-btn:hover { opacity: 1; color: var(--primary-color); }

                .score-tooltip {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--card-elevated);
                    border: 1px solid var(--border-color);
                    padding: 12px;
                    border-radius: 12px;
                    width: 180px;
                    z-index: 20;
                    margin-top: 10px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                }

                .score-tooltip h4 {
                    font-size: 0.8rem;
                    margin-bottom: 8px;
                    color: var(--text-color);
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 4px;
                }

                .sb-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                }

                .sb-val { color: var(--primary-color); font-weight: 600; }

                .score-ring {
                    position: relative;
                    width: 70px;
                    height: 70px;
                }

                .score-ring svg {
                    transform: rotate(-90deg);
                    width: 100%;
                    height: 100%;
                }

                .score-ring circle {
                    fill: none;
                    stroke-width: 6;
                }

                .score-bg { stroke: var(--border-color); }
                .score-progress {
                    stroke: var(--primary-color);
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.6s ease;
                }

                .score-value {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .score-number {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--primary-color);
                    display: block;
                    line-height: 1;
                }

                .score-label {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                .score-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: var(--text-color);
                }

                .detail-item svg { color: var(--primary-color); }

                /* Quick Actions */
                .quick-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    animation: fadeInUp 0.5s ease-out 0.1s backwards;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    background: var(--card-bg);
                    color: var(--text-color);
                    font-weight: 500;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .action-btn:hover {
                    background: var(--card-elevated);
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    color: white;
                    box-shadow: 0 4px 16px rgba(73, 136, 196, 0.4);
                }

                .action-btn.primary:hover {
                    box-shadow: 0 6px 24px rgba(73, 136, 196, 0.5);
                }

                /* Quick Actions Spacer */
                .quick-actions-spacer {
                    flex: 1;
                    min-width: 40px;
                }

                /* Quick Timer Widget */
                .quick-timer-widget {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: var(--card-bg);
                    padding: 10px 16px;
                    border-radius: 14px;
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .quick-timer-widget:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 16px rgba(73, 136, 196, 0.2);
                }

                .qt-play {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 10px rgba(73, 136, 196, 0.4);
                }

                .qt-play:hover {
                    transform: scale(1.08);
                }

                .qt-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .qt-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .qt-time {
                    font-size: 0.75rem;
                    color: var(--primary-color);
                    font-family: var(--font-mono);
                    font-weight: 500;
                }

                /* Bento Grid */
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    grid-auto-rows: auto;
                    gap: 20px;
                    animation: fadeInUp 0.5s ease-out 0.2s backwards;
                }

                .bento-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 0;
                }

                .bento-card:hover {
                    border-color: rgba(73, 136, 196, 0.3);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transform: translateY(-4px);
                }

                .bento-lg { grid-column: span 2; grid-row: span 2; }
                .bento-md { grid-column: span 2; }
                .bento-sm { grid-column: span 1; }
                .bento-wide { grid-column: span 2; }
                .bento-tall { grid-row: span 2; }

                /* Timer Featured Card */
                .timer-card {
                    background: linear-gradient(135deg, rgba(73, 136, 196, 0.15), rgba(86, 156, 214, 0.08));
                    cursor: pointer;
                }

                .timer-featured {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex: 1;
                }

                .timer-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .timer-large {
                    font-size: 2.8rem;
                    font-weight: 700;
                    font-family: var(--font-mono);
                    color: var(--text-color);
                    letter-spacing: -0.02em;
                    line-height: 1;
                }

                .timer-label {
                    font-size: 0.85rem;
                    color: var(--primary-color);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 500;
                }

                .timer-play {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 16px rgba(73, 136, 196, 0.4);
                }

                .timer-play:hover {
                    transform: scale(1.08);
                    box-shadow: 0 8px 24px rgba(73, 136, 196, 0.5);
                }

                /* Horizontal Timer Card (like Daily Goal) */
                .timer-horizontal {
                    flex-direction: row;
                    align-items: center;
                    gap: 14px;
                    padding: 16px 20px;
                }

                .timer-circle {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(73, 136, 196, 0.4);
                }

                .timer-circle:hover {
                    transform: scale(1.08);
                    box-shadow: 0 6px 16px rgba(73, 136, 196, 0.5);
                }

                .timer-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .timer-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .timer-time-h {
                    font-size: 0.8rem;
                    color: var(--primary-color);
                    font-family: var(--font-mono);
                    font-weight: 500;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .card-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                }

                .view-all {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                    color: var(--primary-color);
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .view-all:hover { opacity: 1; }

                .edit-icon {
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    font-size: 1.1rem;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .edit-icon:hover { opacity: 1; }

                .badge {
                    background: rgba(73, 136, 196, 0.2);
                    color: var(--primary-color);
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 20px;
                }

                .empty-state {
                    text-align: center;
                    color: var(--text-muted);
                    font-style: italic;
                    padding: 20px;
                    margin: 0;
                }

                /* Focus Card */
                .focus-card { background: linear-gradient(135deg, rgba(73, 136, 196, 0.1), transparent); }

                .focus-visual {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    flex: 1;
                    gap: 24px;
                }

                .circular-progress-lg {
                    position: relative;
                    width: 140px;
                    height: 140px;
                }

                .circular-progress-lg svg {
                    transform: rotate(-90deg);
                    width: 100%;
                    height: 100%;
                }

                .circular-progress-lg circle {
                    fill: none;
                    stroke-width: 10;
                }

                .progress-bg { stroke: var(--border-color); }
                .progress-fill {
                    stroke: var(--primary-color);
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.8s ease;
                }

                .progress-inner {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .progress-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary-color);
                    display: block;
                }

                .progress-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .focus-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .focus-stat {
                    display: flex;
                    flex-direction: column;
                    padding: 12px 16px;
                    background: var(--card-elevated);
                    border-radius: 12px;
                }

                .stat-num {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .stat-text {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }


                .goal-edit-popup {
                    position: absolute;
                    top: 110%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--card-elevated);
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    min-width: 160px;
                    animation: fadeIn 0.2s ease-out;
                }

                .goal-edit-popup label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    text-align: center;
                }

                .goal-edit-popup input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 8px 10px;
                    color: white;
                    font-size: 0.95rem;
                    text-align: center;
                    box-sizing: border-box;
                }

                .goal-edit-popup input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }

                .popup-actions { display: flex; gap: 8px; }
                .save-btn, .cancel-btn {
                    flex: 1;
                    padding: 6px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.1s, opacity 0.2s;
                }
                .save-btn {
                    background: var(--primary-color);
                    color: white;
                }
                .save-btn:hover { opacity: 0.9; }
                .save-btn:active { transform: scale(0.95); }
                .cancel-btn {
                    background: rgba(255,255,255,0.08);
                    color: var(--text-muted);
                    border: 1px solid var(--border-color);
                }
                .cancel-btn:hover { background: rgba(255,255,255,0.12); color: white; }


                .tasks-list { display: flex; flex-direction: column; gap: 10px; flex: 1; }

                /* Maximize Button */
                .maximize-btn {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 6px;
                    cursor: pointer;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .maximize-btn:hover {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }

                .task-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: var(--nav-hover-bg);
                    border-radius: 10px;
                    transition: background 0.15s;
                }

                .task-row.completed { opacity: 0.5; }
                .task-row.completed .task-title { text-decoration: line-through; }

                .task-check {
                    width: 20px;
                    height: 20px;
                    border-radius: 6px;
                    border: 2px solid var(--border-color);
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }

                .task-check.checked {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                }

                /* Task Priority Dot (view-only mode) */
                .task-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    background: var(--text-muted);
                }

                .task-dot.p0 { background: #888; }
                .task-dot.p1 { background: #2ecc71; }
                .task-dot.p2 { background: #ffa502; }
                .task-dot.p3 { background: #ff4d4d; }

                .task-row.view-only {
                    cursor: default;
                }

                .task-title { flex: 1; font-size: 0.9rem; }

                .priority-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 3px 8px;
                    border-radius: 6px;
                }

                .priority-badge.p1 { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; }
                .priority-badge.p2 { background: rgba(255, 165, 2, 0.2); color: #ffa502; }
                .priority-badge.p3 { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }

                /* Goals Card */
                .goals-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }

                .goal-item {
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 10px;
                    transition: background 0.15s;
                }

                .goal-item:hover { background: var(--nav-hover-bg); }

                .goal-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .goal-title { font-size: 0.9rem; font-weight: 500; }
                .goal-percent { font-size: 0.85rem; color: var(--primary-color); font-weight: 600; }

                .goal-bar {
                    height: 6px;
                    background: var(--card-elevated);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .goal-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    border-radius: 3px;
                    transition: width 0.4s ease;
                }

                /* Habits Card */
                .habits-card {
                    height: auto;
                    align-self: start;
                }

                .habits-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-content: flex-start;
                }

                .habit-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: var(--nav-hover-bg);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: 1px solid transparent;
                }

                .habit-chip:hover { background: var(--card-elevated); }

                .habit-chip.done {
                    background: rgba(73, 136, 196, 0.2);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                /* Notes Card */
                .notes-card {
                    align-self: start;
                }

                .note-preview {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Activity Heat Map */
                .activity-card {
                    overflow: visible !important; /* Force visible to prevent tooltip clipping */
                    z-index: 5;
                    align-self: start; /* Prevent stretching to row height */
                }

                .info-btn-mini {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    margin-left: 8px;
                    opacity: 0.5;
                    transition: all 0.2s;
                }
                .info-btn-mini:hover { opacity: 1; color: var(--primary-color); }

                .activity-tooltip {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: var(--card-elevated);
                    border: 1px solid var(--border-color);
                    padding: 12px;
                    border-radius: 8px;
                    width: 220px;
                    z-index: 9999;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                    font-weight: 400;
                    text-transform: none;
                    cursor: default;
                    margin-top: 8px;
                }
                .activity-tooltip h4 {
                    margin: 0 0 8px 0;
                    font-size: 0.85rem;
                    color: var(--text-color);
                }
                .activity-tooltip p {
                    margin: 0 0 12px 0;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    line-height: 1.4;
                }
                .tooltip-levels {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .level-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }
                .l-dot { width: 8px; height: 8px; border-radius: 2px; }
                .l-dot.l1 { background: rgba(73, 136, 196, 0.25); }
                .l-dot.l2 { background: rgba(73, 136, 196, 0.45); }
                .l-dot.l3 { background: rgba(73, 136, 196, 0.7); }
                .l-dot.l4 { background: var(--primary-color); }
                

                .activity-legend {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                }

                .legend-text {
                    color: var(--text-muted);
                }

                .legend-box {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                }

                .legend-box.l0 { background: rgba(255, 255, 255, 0.08); }
                .legend-box.l1 { background: rgba(73, 136, 196, 0.2); }
                .legend-box.l2 { background: rgba(73, 136, 196, 0.4); }
                .legend-box.l3 { background: rgba(73, 136, 196, 0.6); }
                .legend-box.l4 { background: var(--primary-color); }

                /* GitHub-style Heatmap */
                /* Activity Heat Map */
                .heatmap-wrapper.monthly-view {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                    margin-top: 12px;
                }

                .month-block {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .month-title {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                .month-days-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 10px);
                    gap: 2px;
                }
                
                .heatmap-cell.empty {
                    background: transparent;
                }

                .heatmap-cell {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    transition: transform 0.1s;
                }

                .heatmap-cell:hover {
                    transform: scale(1.4);
                    z-index: 1;
                }

                .heatmap-cell.today {
                    outline: 1px solid var(--primary-color);
                }

                .heatmap-cell.l0 { background: rgba(255, 255, 255, 0.06); }
                .heatmap-cell.l1 { background: rgba(73, 136, 196, 0.25); }
                .heatmap-cell.l2 { background: rgba(73, 136, 196, 0.45); }
                .heatmap-cell.l3 { background: rgba(73, 136, 196, 0.7); }
                .heatmap-cell.l4 { background: var(--primary-color); }

                /* Goals Card Fix */
                .goals-card {
                    align-self: start;
                }

                /* Diary Card */
                .diary-card {
                    background: linear-gradient(135deg, rgba(255, 200, 100, 0.08), rgba(255, 220, 150, 0.04));
                    cursor: pointer;
                }

                .diary-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    gap: 8px;
                    color: var(--text-muted);
                }

                .diary-content svg {
                    color: var(--primary-color);
                    opacity: 0.7;
                }

                .diary-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .diary-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .diary-card:hover .diary-content svg {
                    opacity: 1;
                }

                /* Quote Watermark */
                .quote-watermark {
                    position: fixed;
                    bottom: 20px;
                    right: 40px;
                    max-width: 300px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    opacity: 0.4;
                    font-style: italic;
                    text-align: right;
                    pointer-events: none;
                    z-index: 100;
                }

                .quote-watermark p {
                    margin: 0;
                    line-height: 1.4;
                }

                /* Quote Card - Hidden now, using watermark */
                .quote-card {
                    display: none;
                }

                .quote-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex: 1;
                }

                .quote-icon { color: var(--primary-color); flex-shrink: 0; }

                /* Notes Card */
                .notes-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }

                .note-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    padding: 10px;
                    background: var(--nav-hover-bg);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .note-item:hover { background: var(--card-elevated); }

                .note-title { font-size: 0.9rem; font-weight: 500; }
                .note-preview { font-size: 0.75rem; color: var(--text-muted); }

                /* Article Card */
                .article-card {
                    background-size: cover;
                    background-position: center;
                    justify-content: flex-end;
                    cursor: pointer;
                    min-height: 160px;
                }

                .article-card:hover { transform: scale(1.02) translateY(-4px); }

                .article-badge {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                }

                .article-content { color: white; }
                .article-content h4 { font-size: 1rem; margin-bottom: 4px; }
                .article-time { font-size: 0.8rem; opacity: 0.8; }

                /* Responsive */
                @media (max-width: 1200px) {
                    .bento-grid { grid-template-columns: repeat(3, 1fr); }
                    .bento-lg { grid-column: span 2; }
                }

                @media (max-width: 900px) {
                    .bento-grid { grid-template-columns: repeat(2, 1fr); }
                    .bento-lg { grid-column: span 2; }
                    .bento-md { grid-column: span 2; }
                    .bento-wide { grid-column: span 2; }
                    .command-center { flex-direction: column; gap: 20px; align-items: flex-start; }
                    .command-right { width: 100%; }
                    .focus-score-card { width: 100%; justify-content: center; }
                }

                @media (max-width: 768px) {
                    .dashboard-hub {
                        padding: 16px;
                        gap: 16px;
                        height: auto;
                        padding-bottom: 120px; /* Increased to ensure scrolling past habits card */
                    }

                    .command-center {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        padding: 16px;
                        border-radius: 16px;
                        align-items: stretch;
                        justify-items: stretch;
                    }

                    .command-left {
                        grid-column: 1 / -1;
                        gap: 12px;
                        margin-bottom: 8px;
                    }

                    .greeting-text h1 {
                        font-size: 1.3rem;
                    }

                    .command-center-goal {
                        width: auto;
                        padding: 12px;
                        flex-direction: column;
                        text-align: center;
                        gap: 8px;
                        align-self: stretch;
                    }

                    .goal-ring svg {
                        width: 60px;
                        height: 60px;
                    }

                    .command-right {
                        width: auto;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .focus-score-card {
                        flex: 1;
                        padding: 12px;
                        border-radius: 12px;
                        flex-direction: column;
                        gap: 8px;
                        height: 100%;
                    }

                    .quick-actions {
                        display: flex;
                        overflow-x: auto;
                        gap: 10px;
                        padding-bottom: 4px;
                        flex-wrap: nowrap;
                    }

                    .action-btn {
                        min-width: max-content;
                        white-space: nowrap;
                        padding: 10px 16px;
                        font-size: 0.8rem;
                    }

                    .bento-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }

                    .bento-lg, .bento-md, .bento-sm, .bento-wide {
                        grid-column: span 1;
                    }

                    .bento-card {
                        border-radius: 14px;
                        padding: 16px;
                    }

                    .bento-card-header h3 {
                        font-size: 1rem;
                    }

                    /* Habit grid inside bento */
                    .habit-quick-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 8px !important;
                    }

                    /* Activity heatmap: horizontal scroll */
                    .heatmap-scroll-wrapper {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }

                    /* Streak & stats */
                    .streak-counter {
                        font-size: 1.4rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
