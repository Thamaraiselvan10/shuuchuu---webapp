import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

const PhaseModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [addToCalendar, setAddToCalendar] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setStartDate(initialData.start_date ? initialData.start_date.split('T')[0] : '');
            setDeadline(initialData.deadline ? initialData.deadline.split('T')[0] : '');
            setAddToCalendar(false); // Reset for edit
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStartDate('');
        setDeadline('');
        setAddToCalendar(false);
    };

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
            title,
            description,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            addToCalendar
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Phase' : 'New Phase'}>
            <div className="phase-form">
                <Input
                    label="Phase Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Requirement Analysis"
                    autoFocus
                />

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        className="anime-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe this phase..."
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            className="anime-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Deadline</label>
                        <input
                            type="date"
                            className="anime-input"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                </div>

                {!initialData && (
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="addToCalendar"
                            checked={addToCalendar}
                            onChange={(e) => setAddToCalendar(e.target.checked)}
                            className="anime-checkbox"
                        />
                        <label htmlFor="addToCalendar">Add deadline to Calendar (create task)</label>
                    </div>
                )}

                <div className="form-actions">
                    <Button onClick={handleSubmit}>
                        {initialData ? 'Update Phase' : 'Add Phase'}
                    </Button>
                </div>
            </div>

            <style>{`
                .phase-form {
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
                .checkbox-group {
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                }
                .anime-checkbox {
                    width: 18px;
                    height: 18px;
                    accent-color: var(--primary-color);
                }
                .anime-input {
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
                .anime-input:focus {
                    border-color: var(--primary-color);
                    background: var(--card-bg);
                }
                .form-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                }
                /* Dark mode overrides removed for theme consistency */
            `}</style>
        </Modal>
    );
};

export default PhaseModal;
