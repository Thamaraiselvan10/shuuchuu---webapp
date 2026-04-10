import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { alarmService } from '../services/alarmService';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Alarms = () => {
    const [alarms, setAlarms] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAlarm, setNewAlarm] = useState({ label: '', time: '08:00' });

    useEffect(() => {
        loadAlarms();
    }, []);

    const loadAlarms = async () => {
        try {
            const result = await alarmService.getAlarms();
            setAlarms(result);
        } catch (err) {
            console.error('Failed to load alarms', err);
        }
    };

    const handleCreate = async () => {
        const alarm = {
            id: uuidv4(),
            label: newAlarm.label,
            time: newAlarm.time,
            recurrence: 'daily',
            enabled: true
        };

        await alarmService.createAlarm(alarm);
        loadAlarms();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        await alarmService.deleteAlarm(id);
        loadAlarms();
    };

    const handleToggle = async (id, enabled) => {
        await alarmService.toggleAlarm(id, enabled);
        loadAlarms();
    };

    return (
        <div className="alarms-container">
            <div className="alarms-header">
                <h1>Alarms</h1>
                <Button onClick={() => setIsModalOpen(true)} className="add-alarm-btn">+ New Alarm</Button>
            </div>

            <div className="alarms-grid">
                {alarms.map(alarm => (
                    <div key={alarm.id} className={`alarm-widget glass-panel ${alarm.enabled ? 'active' : ''}`}>
                        <div className="alarm-time-display">
                            {alarm.time}
                        </div>
                        <div className="alarm-info">
                            <div className="alarm-label">{alarm.label || 'Untitled'}</div>
                            <div className="alarm-recurrence">Daily</div>
                        </div>
                        <div className="alarm-controls">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={!!alarm.enabled}
                                    onChange={(e) => handleToggle(alarm.id, e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                            <button onClick={() => handleDelete(alarm.id)} className="delete-icon" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}

                <div className="alarm-widget glass-panel add-new" onClick={() => setIsModalOpen(true)}>
                    <div className="add-icon">+</div>
                    <div>Add Alarm</div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Alarm">
                <div className="alarm-form">
                    <div className="time-input-large">
                        <input
                            type="time"
                            value={newAlarm.time}
                            onChange={e => setNewAlarm({ ...newAlarm, time: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Label"
                        value={newAlarm.label}
                        onChange={e => setNewAlarm({ ...newAlarm, label: e.target.value })}
                        placeholder="e.g. Wake Up"
                    />
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Button onClick={handleCreate} style={{ width: '100%' }}>Save Alarm</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .alarms-container {
                    padding: 20px;
                }

                .alarms-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .alarms-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }

                .alarm-widget {
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.2);
                    position: relative;
                    overflow: hidden;
                }

                .alarm-widget.active {
                    background: rgba(255, 255, 255, 0.6);
                    border-color: var(--primary-color);
                    box-shadow: 0 8px 32px rgba(var(--primary-rgb), 0.2);
                }
                
                .alarm-widget.active::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: var(--primary-color);
                }

                .alarm-time-display {
                    font-size: 3.5rem;
                    font-weight: 200;
                    color: var(--text-color);
                    line-height: 1;
                    letter-spacing: -2px;
                }

                .alarm-widget.active .alarm-time-display {
                    font-weight: 400;
                    color: var(--primary-color);
                }

                .alarm-info {
                    flex: 1;
                }

                .alarm-label {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .alarm-recurrence {
                    font-size: 0.8rem;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .alarm-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                }

                .delete-icon {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .delete-icon:hover {
                    color: red;
                    background: rgba(255,0,0,0.1);
                }

                /* Toggle Switch */
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                input:checked + .slider {
                    background-color: var(--primary-color);
                }

                input:checked + .slider:before {
                    transform: translateX(24px);
                }

                /* Add New Widget */
                .alarm-widget.add-new {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: 2px dashed rgba(0,0,0,0.1);
                    background: rgba(255,255,255,0.2);
                    color: #888;
                    min-height: 200px;
                }

                .alarm-widget.add-new:hover {
                    background: rgba(255,255,255,0.4);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                .add-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                }

                .time-input-large input {
                    font-size: 3rem;
                    padding: 10px;
                    width: 100%;
                    text-align: center;
                    border: none;
                    background: transparent;
                    color: var(--primary-color);
                    font-weight: bold;
                    outline: none;
                }

                @media (prefers-color-scheme: dark) {
                    .alarm-widget {
                        background: rgba(0,0,0,0.3);
                        border-color: rgba(255,255,255,0.1);
                    }
                    .alarm-widget.active {
                        background: rgba(0,0,0,0.5);
                    }
                    .alarm-widget.add-new {
                        background: rgba(0,0,0,0.2);
                        border-color: rgba(255,255,255,0.1);
                    }
                    .slider {
                        background-color: #444;
                    }
                @media (max-width: 768px) {
                    .alarms-container {
                        padding: 16px;
                    }

                    .alarms-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                        margin-bottom: 24px;
                    }

                    .add-alarm-btn {
                        width: 100%;
                    }

                    .alarms-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }

                    .alarm-widget {
                        padding: 20px;
                    }

                    .alarm-widget.add-new {
                        min-height: 120px;
                        flex-direction: row;
                        gap: 12px;
                    }

                    .add-icon {
                        margin-bottom: 0;
                        font-size: 2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Alarms;
