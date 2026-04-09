import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalsContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import GoalModal from '../components/GoalModal';
import Modal from '../components/Modal';
import Quote from '../components/Quote';
import { format } from 'date-fns';

const Goals = () => {
    const { goals, addGoal, deleteGoal } = useGoals();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Statistics calculations
    const stats = useMemo(() => {
        const total = goals.length;
        const completed = goals.filter(g => g.completed_phases === g.total_phases && g.total_phases > 0).length;
        const inProgress = goals.filter(g => g.completed_phases > 0 && g.completed_phases < g.total_phases).length;
        const overdue = goals.filter(g => g.deadline && new Date(g.deadline) < new Date() && g.completed_phases < g.total_phases).length;
        return { total, completed, inProgress, overdue };
    }, [goals]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = ['All', ...new Set(goals.map(g => g.category).filter(Boolean))];
        return cats;
    }, [goals]);

    // Filter goals by category
    const filteredGoals = useMemo(() => {
        if (selectedCategory === 'All') return goals;
        return goals.filter(g => g.category === selectedCategory);
    }, [goals, selectedCategory]);

    const handleCreateGoal = async (goalData) => {
        await addGoal(goalData);
        setIsModalOpen(false);
        showToast('Goal created successfully!', 'success');
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState(null);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setGoalToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (goalToDelete) {
            await deleteGoal(goalToDelete);
            setDeleteModalOpen(false);
            setGoalToDelete(null);
        }
    };

    // Circular progress ring component
    const ProgressRing = ({ progress, size = 50, strokeWidth = 4, color = 'var(--primary-color)' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress / 100) * circumference;

        return (
            <svg width={size} height={size} className="progress-ring-svg">
                <circle
                    stroke="var(--border-color)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.5s ease'
                    }}
                />
            </svg>
        );
    };

    return (
        <div className="goals-container">
            <div style={{ marginBottom: '5px' }}>
                <Quote category="goals" />
            </div>
            <div className="goals-header">
                <div className="header-left">
                    <h1>Goals & Roadmaps</h1>
                    <span className="goal-count">{goals.length} Goals</span>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="new-goal-btn">+ New Goal</Button>
            </div>

            {/* Statistics Dashboard */}
            <div className="goals-stats-dashboard">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>🎯</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Goals</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(52, 152, 219, 0.2)' }}>🚀</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.inProgress}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(46, 204, 113, 0.2)' }}>✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 107, 107, 0.2)' }}>⚠️</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.overdue}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>
            </div>

            {/* Category Filter Tabs */}
            {categories.length > 1 && (
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="empty-state">
                        <p>No goals yet. Start by creating one to build your roadmap!</p>
                    </div>
                ) : (
                    filteredGoals.map(goal => {
                        const progress = goal.total_phases > 0 ? Math.round((goal.completed_phases / goal.total_phases) * 100) : 0;
                        const isCompleted = progress === 100;
                        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

                        return (
                            <div key={goal.id} className={`anime-goal-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue-card' : ''}`} onClick={() => navigate(`/goals/${goal.id}`)}>
                                <div className="goal-card-header">
                                    <div className="goal-title">{goal.title}</div>
                                    <div className={`goal-priority p-${goal.priority}`}>
                                        {goal.priority === 0 ? 'Low' : goal.priority === 1 ? 'Med' : 'High'}
                                    </div>
                                </div>

                                <div className="goal-description">{goal.description}</div>

                                <div className="goal-progress-section">
                                    <div className="progress-ring-container">
                                        <ProgressRing
                                            progress={progress}
                                            size={60}
                                            strokeWidth={5}
                                            color={isCompleted ? '#2ecc71' : isOverdue ? '#ff4d4d' : 'var(--primary-color)'}
                                        />
                                        <span className="progress-text">{progress}%</span>
                                    </div>
                                    <div className="progress-details">
                                        <span className="phases-count">{goal.completed_phases}/{goal.total_phases} phases</span>
                                        <div className="goal-progress-bar-bg">
                                            <div
                                                className="goal-progress-bar-fill"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: isCompleted ? 'linear-gradient(90deg, #2ecc71, #27ae60)' :
                                                        isOverdue ? 'linear-gradient(90deg, #ff4d4d, #e74c3c)' :
                                                            'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="goal-card-footer">
                                    <div className="goal-meta">
                                        <span className="goal-category">{goal.category}</span>
                                        {goal.deadline && (
                                            <span className={`goal-deadline ${isOverdue ? 'overdue' : ''}`}>
                                                📅 {format(new Date(goal.deadline), 'MMM d, yyyy')}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={(e) => handleDelete(e, goal.id)} className="icon-btn delete" title="Delete Goal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <GoalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateGoal}
            />

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Goal"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Are you sure you want to delete this goal?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmDelete} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .goals-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    height: 100%;
                    padding: 20px 40px;
                    overflow: hidden;
                    background: var(--bg-gradient);
                }

                .goals-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 10px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .goals-header h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .goal-count {
                    background: rgba(var(--primary-rgb), 0.15);
                    color: var(--primary-color);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }

                .new-goal-btn {
                    height: 36px;
                    border-radius: 8px;
                    padding: 0 18px;
                    font-size: 0.9rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .new-goal-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.3);
                    filter: brightness(1.1);
                }

                /* Statistics Dashboard */
                .goals-stats-dashboard {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .goals-stats-dashboard .stat-card {
                    background: var(--card-bg);
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                }

                .goals-stats-dashboard .stat-card:hover {
                    background: var(--card-elevated);
                    border-color: rgba(73, 136, 196, 0.2);
                }

                .goals-stats-dashboard .stat-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                }

                .goals-stats-dashboard .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .goals-stats-dashboard .stat-value {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--text-color);
                }

                .goals-stats-dashboard .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Category Tabs */
                .category-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }

                .category-tab {
                    padding: 8px 18px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .category-tab:hover {
                    background: var(--card-elevated);
                }

                .category-tab.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                /* Progress Ring Container */
                .goal-progress-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                }

                .progress-ring-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .progress-text {
                    position: absolute;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .progress-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .phases-count {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.7;
                }

                /* Card states */
                .anime-goal-card.completed {
                    border-color: rgba(46, 204, 113, 0.3);
                }

                .anime-goal-card.overdue-card {
                    border-color: rgba(255, 77, 77, 0.3);
                }

                .goals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    overflow-y: auto;
                    padding: 5px;
                    padding-bottom: 60px; /* More breathing space at bottom */
                }

                .anime-goal-card {
                    background: var(--card-bg);
                    padding: 24px;
                    padding-bottom: 20px;
                    border-radius: 14px;
                    border: 1px solid var(--border-color);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    position: relative;
                    min-height: 200px;
                    overflow: hidden;
                }

                .anime-goal-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                    border-color: rgba(73, 136, 196, 0.2);
                    background: var(--card-elevated);
                }

                .goal-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 10px;
                }

                .goal-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-color);
                    line-height: 1.3;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .goal-priority {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .goal-priority.p-0 { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); }
                .goal-priority.p-1 { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
                .goal-priority.p-2 { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.3); }

                .goal-description {
                    font-size: 0.95rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    line-height: 1.6;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    flex: 1;
                    min-height: 48px;
                }

                .goal-progress-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-color);
                    opacity: 0.8;
                }

                .goal-progress-bar-bg {
                    height: 6px;
                    background: var(--nav-hover-bg);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .goal-progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    border-radius: 3px;
                    transition: width 0.5s ease;
                }

                .goal-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid var(--border-color);
                    margin-top: 5px;
                }

                .goal-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    align-items: center;
                }

                .goal-category {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .goal-category::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--primary-color);
                }

                .goal-deadline.overdue {
                    color: #ff4d4d;
                    font-weight: 600;
                }

                .icon-btn.delete {
                    background: transparent;
                    border: none;
                    color: var(--text-color);
                    opacity: 0.5;
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

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px;
                    color: var(--text-color);
                    opacity: 0.4;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};

export default Goals;
