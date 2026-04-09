import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Wind } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const DailyBriefingModal = ({ isOpen, onNext, tasks, hideOverlay }) => {
    const today = new Date();
    const [showBucket, setShowBucket] = useState(false);
    const [isBreathing, setIsBreathing] = useState(false);

    // Filter tasks due today
    const todaysTasks = tasks.filter(task =>
        task.due_at && isSameDay(new Date(task.due_at), today) && task.status !== 'completed'
    );

    // All pending tasks (not completed)
    const allPendingTasks = tasks.filter(task => task.status !== 'completed');

    // Group pending tasks by category
    const tasksByCategory = allPendingTasks.reduce((acc, task) => {
        const category = task.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // Category colors
    const categoryColors = {
        'Event': '#8b5cf6',
        'Work': '#3b82f6',
        'Personal': '#2ecc71',
        'Health': '#f59e0b',
        'Learning': '#ec4899',
        'Meeting': '#06b6d4',
        'Deadline': '#ef4444',
        'General': '#6b7280'
    };

    const handleReadyClick = () => {
        // If no tasks today but there are pending tasks, show bucket view first
        if (todaysTasks.length === 0 && allPendingTasks.length > 0 && !showBucket) {
            setIsBreathing(true);
            setTimeout(() => {
                setIsBreathing(false);
                setShowBucket(true);
            }, 3000);
        } else {
            onNext();
        }
    };

    // Breathing View
    if (isBreathing) {
        return (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div style={{
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <Wind className="breath-animation" size={56} strokeWidth={1.5} />
                    <span style={{ fontSize: '1.3rem', fontStyle: 'italic', opacity: 0.9, fontWeight: 300 }}>Take a deep breath...</span>
                </div>
            </div>
        );
    }

    // Bucket View - when no tasks today but pending tasks exist
    if (showBucket) {
        return (
            <Modal isOpen={isOpen} onClose={onNext} title="But wait... 🪣" maxWidth="500px" hideOverlay={hideOverlay}>
                <div style={{ padding: '20px' }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
                        <p style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'var(--text-color)',
                            margin: 0
                        }}>
                            You have a lot in your bucket to do!
                        </p>
                        <p style={{
                            fontSize: '0.95rem',
                            opacity: 0.7,
                            margin: '8px 0 0 0'
                        }}>
                            {allPendingTasks.length} pending task{allPendingTasks.length !== 1 ? 's' : ''} total
                        </p>
                    </div>

                    {/* Tasks by Category */}
                    <div style={{ marginBottom: '20px' }}>
                        {Object.entries(tasksByCategory).map(([category, count]) => (
                            <div key={category} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 15px',
                                marginBottom: '8px',
                                background: 'var(--card-elevated)',
                                borderRadius: '10px',
                                borderLeft: `4px solid ${categoryColors[category] || '#6b7280'}`
                            }}>
                                <span style={{ fontWeight: '500', fontSize: '1rem' }}>{category}</span>
                                <span style={{
                                    fontSize: '0.9rem',
                                    padding: '5px 15px',
                                    borderRadius: '12px',
                                    background: categoryColors[category] || '#6b7280',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Button onClick={onNext} variant="primary" style={{
                            padding: '12px 30px',
                            fontSize: '1rem'
                        }}>
                            Got it! Let's go! 🚀
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    // Regular Daily Briefing View
    return (
        <Modal isOpen={isOpen} onClose={onNext} title="Your Day Ahead" maxWidth="500px" hideOverlay={hideOverlay}>
            <div style={{ padding: '20px' }}>
                {/* Date Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    borderRadius: '12px'
                }}>
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: 'var(--primary-color)'
                    }}>
                        {format(today, 'EEEE')}
                    </div>
                    <div style={{
                        fontSize: '0.95rem',
                        opacity: 0.8,
                        marginTop: '4px'
                    }}>
                        {format(today, 'MMMM d, yyyy')}
                    </div>
                </div>

                {/* Task Count */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '15px',
                    fontSize: '1rem'
                }}>
                    You have <span style={{
                        fontWeight: 'bold',
                        color: 'var(--primary-color)',
                        fontSize: '1.2rem'
                    }}>{todaysTasks.length}</span> task{todaysTasks.length !== 1 ? 's' : ''} today
                </div>

                {/* Task List */}
                {todaysTasks.length > 0 && (
                    <div style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        marginBottom: '15px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '8px'
                    }}>
                        {todaysTasks.map(task => (
                            <div key={task.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                marginBottom: '6px',
                                background: 'var(--card-elevated)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${categoryColors[task.category] || '#8b5cf6'}`
                            }}>
                                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{task.title}</span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    background: categoryColors[task.category] || '#8b5cf6',
                                    color: 'white'
                                }}>
                                    {task.category || 'General'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {todaysTasks.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '15px',
                        opacity: 0.7,
                        fontStyle: 'italic',
                        fontSize: '0.95rem'
                    }}>
                        No tasks scheduled for today! 🎉
                    </div>
                )}

                {/* Action Button */}
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <Button onClick={handleReadyClick} variant="primary" style={{
                        padding: '10px 25px',
                        fontSize: '0.95rem'
                    }}>
                        I am ready! 💪
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DailyBriefingModal;
