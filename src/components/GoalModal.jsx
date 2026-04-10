import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

const GoalModal = ({ isOpen, onClose, onSave, onDelete, initialData = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Personal');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState(0);

    // Refs for keyboard navigation
    const descriptionRef = useRef(null);
    const categoryRef = useRef(null);
    const priorityRef = useRef(null);
    const deadlineRef = useRef(null);

    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            }
        }
    };

    // Description handles Shift+Enter for new line, Enter for next field
    const handleDescriptionKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            categoryRef.current.focus();
        }
    };

    const handleDeadlineKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setCategory(initialData.category || 'Personal');
            setDeadline(initialData.deadline ? initialData.deadline.split('T')[0] : '');
            setPriority(initialData.priority || 0);
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('Personal');
        setDeadline('');
        setPriority(0);
    };

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
            title,
            description,
            category,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            priority
        });
        onClose();
    };

    const categories = ['Personal', 'Work', 'Study', 'Fitness', 'Project', 'Skill Development'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Goal' : 'New Goal'}>
            <div className="goal-form">
                <Input
                    label="Goal Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Learn React Native"
                    autoFocus
                    onKeyDown={(e) => handleKeyDown(e, descriptionRef)}
                />

                <div className="form-group">
                    <label>Description</label>

                    <textarea
                        ref={descriptionRef}
                        className="anime-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyDown={handleDescriptionKeyDown}
                        placeholder="Describe your goal..."
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            ref={categoryRef}
                            className="anime-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, priorityRef)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            ref={priorityRef}
                            className="anime-select"
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, deadlineRef)}
                        >
                            <option value={0}>Low</option>
                            <option value={1}>Medium</option>
                            <option value={2}>High</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Target Deadline</label>
                    <input
                        type="date"
                        className="anime-input"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        ref={deadlineRef}
                        onKeyDown={handleDeadlineKeyDown}
                    />
                </div>

                {/* Phases Section Removed */}

                <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                    {initialData && onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            style={{
                                background: 'transparent',
                                border: '1px solid #ff4d4d',
                                color: '#ff4d4d',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Delete Goal
                        </button>
                    ) : <div></div>}
                    <Button onClick={handleSubmit}>
                        {initialData ? 'Update Goal' : 'Create Goal'}
                    </Button>
                </div>
            </div>

            <style>{`
                .goal-form {
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
                .form-row {
                    display: flex;
                    gap: 15px;
                }
                .form-row .form-group {
                    flex: 1;
                }
                .anime-input, .anime-select {
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    font-family: inherit;
                    color: var(--text-color);
                    outline: none;
                    width: 100%;
                    box-sizing: border-box;
                }
                .anime-input:focus, .anime-select:focus {
                    border-color: var(--primary-color);
                    background: var(--card-bg);
                }
                .phases-input-group {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }
                .phases-list {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    margin-top: 5px;
                    max-height: 150px;
                    overflow-y: auto;
                }
                .phase-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0,0,0,0.05);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .remove-phase-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 1.1rem;
                    padding: 0 5px;
                }
                .form-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                }

                @media (max-width: 768px) {
                    .form-row {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form-actions {
                        flex-direction: column-reverse;
                        gap: 12px;
                    }

                    .form-actions button {
                        width: 100%;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default GoalModal;
