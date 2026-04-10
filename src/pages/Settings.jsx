import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useSettings } from '../context/SettingsContext';
import { useTimerContext } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';


const Settings = () => {
    const { settings, updateSettings, addTrack, removeTrack } = useSettings();
    const { profile } = useProfile();
    const { theme, setTheme } = useTheme();
    const { setDuration } = useTimerContext();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('appearance');
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleTimerChange = (key, value) => {
        const intVal = parseInt(value) || 0;
        updateSettings({
            timer: {
                ...settings.timer,
                [key]: intVal
            }
        });

        if (key === 'focus') {
            setDuration(intVal);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large. Please upload MP3s smaller than 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target.result;
                const newTrack = {
                    id: Date.now().toString(),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    src: base64Url,
                    type: 'file'
                };
                addTrack(newTrack);
                updateSettings({ currentTrack: newTrack });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExport = async () => {
        try {
            const { exportToJson } = await import('../services/db.js');
            const data = await exportToJson();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shuuchuu-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Backup exported successfully!');
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        }
    };

    const handleImport = () => {
        setRestoreModalOpen(true);
    };

    const confirmRestore = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const { importFromJson } = await import('../services/db.js');
                    await importFromJson(data);
                    showToast('Data restored! Refreshing...');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    console.error('Import failed:', err);
                    alert('Import failed: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
        setRestoreModalOpen(false);
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
        { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg> },
        { id: 'tasks', label: 'Tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'music', label: 'Focus Music', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
        { id: 'notifications', label: 'Notifications', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
        { id: 'shortcuts', label: 'Shortcuts', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
        { id: 'data', label: 'Data', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> },
        { id: 'help', label: 'Help & Guide', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'about', label: 'About', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
    ];

    return (
        <div className="settings-container">
            <h1 className="page-title">Settings</h1>

            {/* Sidebar */}
            <div className="settings-sidebar">
                <div className="sidebar-header">Settings</div>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}

                <button
                    className="settings-tab close-btn"
                    onClick={() => navigate(-1)}
                    style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', borderRadius: '0' }}
                >
                    <span className="tab-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </span>
                    Close Settings
                </button>
            </div>


            {/* Content Area */}
            <div className="settings-content">

                {activeTab === 'appearance' && (
                    <div className="content-section">
                        <h2>Appearance</h2>
                        <div className="setting-group">
                            <label style={{ marginBottom: '15px', display: 'block' }}>Application Theme</label>

                            <div className="theme-selection-grid">
                                {/* System Default Removed */}

                                {/* Light Theme */}
                                <div
                                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <div className="theme-preview light-preview">
                                        <div className="preview-ui">
                                            <div className="preview-sidebar"></div>
                                            <div className="preview-content"></div>
                                        </div>
                                    </div>
                                    <div className="theme-card-info">
                                        <h3>Light Mode</h3>
                                        <button className="theme-select-btn">
                                            {theme === 'light' ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                </div>

                                {/* Dark Theme */}
                                <div
                                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <div className="theme-preview dark-preview">
                                        <div className="preview-ui">
                                            <div className="preview-sidebar"></div>
                                            <div className="preview-content"></div>
                                        </div>
                                    </div>
                                    <div className="theme-card-info">
                                        <h3>Dark Mode</h3>
                                        <button className="theme-select-btn">
                                            {theme === 'dark' ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <div className="content-section">
                        <h2>Dashboard Widgets</h2>
                        <p className="description">Choose which widgets to display on your dashboard.</p>

                        <div className="widget-toggles">
                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">📊 Daily Progress</span>
                                    <span className="widget-desc">Focus time tracking with circular progress</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.dailyProgress ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                dailyProgress: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">📖 Daily Article</span>
                                    <span className="widget-desc">Wellness article of the day</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.dailyArticle ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                dailyArticle: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">🎯 Active Goals</span>
                                    <span className="widget-desc">Your current goals with progress bars</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.goals ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                goals: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">📝 Next Up Tasks</span>
                                    <span className="widget-desc">Upcoming pending tasks</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.tasks ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                tasks: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">🔄 Today's Habits</span>
                                    <span className="widget-desc">Track daily habits from dashboard</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.habits ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                habits: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="widget-toggle-item">
                                <div className="widget-info">
                                    <span className="widget-name">📋 Recent Notes</span>
                                    <span className="widget-desc">Quick access to your latest notes</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.dashboardWidgets?.notes ?? true}
                                        onChange={(e) => updateSettings({
                                            dashboardWidgets: {
                                                ...settings.dashboardWidgets,
                                                notes: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="content-section">
                        <h2>Tasks Settings</h2>
                        <p className="description">Configure settings related to task management.</p>
                        
                        <div className="settings-list" style={{ marginTop: '20px' }}>
                            <div className="setting-item-row">
                                <div className="setting-meta">
                                    <div className="setting-title">Auto-Delete Done Tasks</div>
                                    <div className="setting-desc">Automatically delete tasks in the Kanban Done column after a set time.</div>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoDeleteDoneTasks ?? true}
                                            onChange={(e) => updateSettings({ autoDeleteDoneTasks: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            
                            {(settings.autoDeleteDoneTasks ?? true) && (
                                <div className="setting-item-row">
                                    <div className="setting-meta">
                                        <div className="setting-title">Deletion Time</div>
                                        <div className="setting-desc">How long until done tasks are deleted.</div>
                                    </div>
                                    <div className="setting-control">
                                        <select
                                            value={settings.autoDeleteDoneTasksHours || 1}
                                            onChange={(e) => updateSettings({ autoDeleteDoneTasksHours: parseFloat(e.target.value) })}
                                            className="minimal-select"
                                        >
                                            <option value={1}>1 hour</option>
                                            <option value={2}>2 hours</option>
                                            <option value={5}>5 hours</option>
                                            <option value={12}>12 hours</option>
                                            <option value={24}>24 hours</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'music' && (
                    <div className="content-section">
                        <h2>Focus Music</h2>
                        <p className="description">Upload your own MP3s or manage the playlist.</p>

                        <label className="file-upload-btn">
                            <input
                                type="file"
                                accept="audio/mp3,audio/mpeg"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <span className="upload-icon">📂</span>
                            <span>Upload MP3</span>
                        </label>

                        <div className="music-list">
                            {settings.playlist && settings.playlist.map((track) => (
                                <div key={track.id} className="music-item">
                                    <div className="track-icon">🎵</div>
                                    <div className="track-info">
                                        <div className="track-name">{track.name}</div>
                                        <div className="track-type">{track.type === 'file' ? 'Custom' : 'Preset'}</div>
                                    </div>
                                    {track.type !== 'url' && (
                                        <button onClick={() => removeTrack(track.id)} className="delete-btn" title="Remove">✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="content-section">
                        <h2>Notifications</h2>

                        <div className="settings-list">
                            <div className="setting-item-row">
                                <div className="setting-meta">
                                    <div className="setting-title">Enable All Notifications</div>
                                    <div className="setting-desc">Master switch to control all application notifications.</div>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {settings.notificationsEnabled && (
                                <>
                                    <div className="setting-item-row">
                                        <div className="setting-meta">
                                            <div className="setting-title">Task Reminders</div>
                                            <div className="setting-desc">Get notified before your tasks are due.</div>
                                        </div>
                                        <div className="setting-control">
                                            <select
                                                value={settings.taskNotificationMinutes || 60}
                                                onChange={(e) => updateSettings({ taskNotificationMinutes: parseInt(e.target.value) })}
                                                className="minimal-select"
                                            >
                                                <option value={10}>10 min before</option>
                                                <option value={30}>30 min before</option>
                                                <option value={60}>1 hour before</option>
                                                <option value={120}>2 hours before</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="setting-item-row">
                                        <div className="setting-meta">
                                            <div className="setting-title">Event Reminders</div>
                                            <div className="setting-desc">Notifications for upcoming calendar events.</div>
                                        </div>
                                        <div className="setting-control">
                                            <select
                                                value={settings.eventNotificationMinutes || 1440}
                                                onChange={(e) => updateSettings({ eventNotificationMinutes: parseInt(e.target.value) })}
                                                className="minimal-select"
                                            >
                                                <option value={60}>1 hour before</option>
                                                <option value={300}>5 hours before</option>
                                                <option value={1440}>1 day before</option>
                                                <option value={2880}>2 days before</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="setting-item-row">
                                        <div className="setting-meta">
                                            <div className="setting-title">Notification Sound</div>
                                            <div className="setting-desc">Choose the sound for your alerts.</div>
                                        </div>
                                        <div className="setting-control">
                                            <select
                                                value={settings.notificationTone || 'default'}
                                                onChange={(e) => updateSettings({ notificationTone: e.target.value })}
                                                className="minimal-select"
                                            >
                                                <option value="default">Default</option>
                                                <option value="chime">Chime</option>
                                                <option value="bell">Soft Bell</option>
                                                <option value="alert">Alert</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Motivational Notifications Section */}
                                    <div style={{ marginTop: '30px', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 5px', color: 'var(--text-color)' }}>
                                            Motivational Reminders
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
                                            Periodic notifications to keep you motivated and on track.
                                        </p>
                                    </div>

                                    <div className="setting-item-row">
                                        <div className="setting-meta">
                                            <div className="setting-title">Enable Motivational Notifications</div>
                                            <div className="setting-desc">Receive periodic reminders about your habits, tasks, and goals.</div>
                                        </div>
                                        <div className="setting-control">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.motivationalNotificationsEnabled ?? true}
                                                    onChange={(e) => updateSettings({ motivationalNotificationsEnabled: e.target.checked })}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {settings.motivationalNotificationsEnabled && (
                                        <>
                                            <div className="setting-item-row">
                                                <div className="setting-meta">
                                                    <div className="setting-title">Reminder Frequency</div>
                                                    <div className="setting-desc">How often to send motivational notifications.</div>
                                                </div>
                                                <div className="setting-control">
                                                    <select
                                                        value={settings.motivationalNotificationInterval || 60}
                                                        onChange={(e) => updateSettings({ motivationalNotificationInterval: parseFloat(e.target.value) })}
                                                        className="minimal-select"
                                                    >
                                                        <option value={10}>Every 10 minutes</option>
                                                        <option value={25}>Every 25 minutes</option>
                                                        <option value={60}>Every 1 hour</option>
                                                        <option value={150}>Every 2.5 hours</option>
                                                        <option value={180}>Every 3 hours</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="setting-item-row">
                                                <div className="setting-meta">
                                                    <div className="setting-title">🔄 Habit Reminders</div>
                                                    <div className="setting-desc">Get reminded about your pending habits.</div>
                                                </div>
                                                <div className="setting-control">
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifyAboutHabits ?? true}
                                                            onChange={(e) => updateSettings({ notifyAboutHabits: e.target.checked })}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="setting-item-row">
                                                <div className="setting-meta">
                                                    <div className="setting-title">🎯 Focus Task Reminders</div>
                                                    <div className="setting-desc">Get reminded about your today's focus tasks.</div>
                                                </div>
                                                <div className="setting-control">
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifyAboutFocusTasks ?? true}
                                                            onChange={(e) => updateSettings({ notifyAboutFocusTasks: e.target.checked })}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="setting-item-row">
                                                <div className="setting-meta">
                                                    <div className="setting-title">🏆 Goal Reminders</div>
                                                    <div className="setting-desc">Get reminded to check on your active goals.</div>
                                                </div>
                                                <div className="setting-control">
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifyAboutGoals ?? true}
                                                            onChange={(e) => updateSettings({ notifyAboutGoals: e.target.checked })}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'shortcuts' && (
                    <div className="content-section">
                        <h2>Keyboard Shortcuts</h2>
                        <div className="shortcuts-grid">
                            {settings.shortcuts && Object.entries(settings.shortcuts).map(([action, shortcut]) => (
                                <div key={action} className="shortcut-item">
                                    <span className="shortcut-label">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <div className="keys">
                                        {[
                                            shortcut.ctrl && 'Ctrl',
                                            shortcut.alt && 'Alt',
                                            shortcut.shift && 'Shift',
                                            shortcut.meta && 'Meta',
                                            shortcut.key.toUpperCase()
                                        ].filter(Boolean).map((key, i) => (
                                            <kbd key={i}>{key}</kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="content-section">
                        <h2>Data Management</h2>
                        <div className="data-card">
                            <div className="data-icon">💾</div>
                            <div className="data-info">
                                <h3>Backup & Restore</h3>
                                <p className="description">Export your settings and tasks to a JSON file, or restore from a backup.</p>
                            </div>
                        </div>
                        <div className="action-buttons">
                            <Button onClick={handleExport} style={{ background: 'var(--primary-color)', color: 'white' }}>Export Data</Button>
                            <Button onClick={handleImport} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)' }}>Import Data</Button>
                        </div>
                    </div>
                )}

                {activeTab === 'help' && (
                    <div className="content-section">
                        <h2>Help & Guide</h2>
                        <p className="description" style={{ marginBottom: '25px' }}>Learn how to use each feature of the app effectively.</p>

                        <div className="help-sections">
                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">📊</span>
                                    <h3>Dashboard</h3>
                                </div>
                                <p>Your central hub showing daily progress, today's focus, active goals, habits status, and quick access to recent notes. Start your day here to see everything at a glance.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">⏱️</span>
                                    <h3>Timer (Focus Mode)</h3>
                                </div>
                                <p>Use the Pomodoro technique to stay focused. Set focus rules before starting. The timer tracks your work sessions and breaks. Enable focus music for better concentration.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">✅</span>
                                    <h3>Tasks</h3>
                                </div>
                                <p>Manage all your tasks in one place. Create tasks with due dates, priorities, and categories. Mark tasks as "Today's Focus" to highlight what's important. Use the Kanban view to visualize your workflow.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">🎯</span>
                                    <h3>Goals</h3>
                                </div>
                                <p>Set long-term goals and break them into phases. Track progress as you complete each phase. Goals help you stay aligned with your bigger vision.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">🔄</span>
                                    <h3>Habits</h3>
                                </div>
                                <p>Build positive habits by tracking them daily. See your current streak and best streak. The visual calendar shows your consistency over time.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">📝</span>
                                    <h3>Notes</h3>
                                </div>
                                <p>Quick capture for your ideas and thoughts. Create, edit, and organize notes. Perfect for meeting notes, brainstorming, or quick reminders.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">📅</span>
                                    <h3>Calendar</h3>
                                </div>
                                <p>View your tasks and events in a calendar layout. See what's due on each day. Plan your week by visualizing your commitments.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">📖</span>
                                    <h3>Diary</h3>
                                </div>
                                <p>Reflect on your day with personal journal entries. Track your mood and add attachments. A private space for self-reflection.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">⏰</span>
                                    <h3>Alarms</h3>
                                </div>
                                <p>Set reminders and alarms for important events. Get notified at the right time so you never miss anything important.</p>
                            </div>

                            <div className="help-card">
                                <div className="help-card-header">
                                    <span className="help-icon">🔔</span>
                                    <h3>Notifications</h3>
                                </div>
                                <p>Enable motivational reminders to stay on track. Get periodic nudges about your habits, focus tasks, and goals. Customize frequency in Settings.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="content-section">
                        <h2>About</h2>
                        <div className="about-grid">
                            <div className="about-row" style={{ justifyContent: 'center', paddingBottom: '10px', borderBottom: 'none' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '2px solid var(--primary-color)',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                    backgroundColor: 'var(--card-bg)'
                                }}>
                                    <img
                                        src="/avatars/dev-icon.PNG"
                                        alt="Developer"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: 'translateZ(0)',
                                            imageRendering: 'high-quality'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="about-row">
                                <span className="about-label">Developer</span>
                                <span className="about-value">Thamaraiselvan S</span>
                            </div>
                            <div className="about-row">
                                <span className="about-label">Version</span>
                                <span className="about-value version-pill">v1.3.1</span>
                            </div>
                            <div className="about-row bio-row">
                                <span className="about-label">Bio</span>
                                <p className="about-value bio-text">
                                    I am currently pursuing Computer Science & Engineering at Knowledge Institute of Technology in Salem, Tamilnadu. This application is a personal project. I am aspiring to develop desktop & mobile applications.
                                </p>
                            </div>
                            <div className="about-row">
                                <span className="about-label">Contact</span>
                                <span className="about-value">thamaraiselvanvcb@gmail.com</span>
                            </div>
                            <div className="about-row">
                                <span className="about-label">Social</span>
                                <div className="social-links-inline">
                                    <a href="https://www.linkedin.com/in/thamarai-selvan-15765a2a2" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="LinkedIn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                    </a>
                                    <a href="https://github.com/Thamaraiselvan10" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="GitHub">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={restoreModalOpen}
                onClose={() => setRestoreModalOpen(false)}
                title="Restore Data"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Restoring will overwrite current data. Are you sure you want to continue?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setRestoreModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmRestore} style={{ background: 'var(--primary-color)', color: 'white' }}>Restore</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                /* Main Grid Layout */
                .settings-container {
                    width: 100%;
                    max-width: 900px;
                    margin: 20px auto;
                    height: calc(100vh - 80px);
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    gap: 0;
                    background: var(--card-bg);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .page-title { display: none; }

                /* Sidebar */
                .settings-sidebar {
                    background: rgba(0, 0, 0, 0.2);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    padding: 30px 15px;
                    gap: 8px;
                    overflow-y: auto;
                }

                .settings-tab {
                    background: transparent;
                    border: none;
                    color: var(--text-color);
                    padding: 12px 20px;
                    text-align: left;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    font-weight: 500;
                    font-size: 0.95rem;
                    opacity: 0.7;
                    width: 100%;
                }
                .settings-tab:hover {
                    background: rgba(255, 255, 255, 0.05);
                    opacity: 1;
                }
                .settings-tab.active {
                    background: var(--primary-color);
                    color: white;
                    font-weight: 600;
                    opacity: 1;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .tab-icon { font-size: 1.1rem; }

                /* Content Area */
                .settings-content {
                    padding: 40px;
                    overflow-y: auto;
                    background: transparent;
                }
                
                .content-section {
                    max-width: 800px;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .content-section h2 {
                    margin-top: 0;
                    margin-bottom: 40px;
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-color);
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 15px;
                }

                /* Structured Settings List */
                .settings-list {
                    display: flex;
                    flex-direction: column;
                }

                .setting-group {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .setting-item-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .setting-item-row:last-child { border-bottom: none; }

                .setting-meta {
                    flex: 1;
                    padding-right: 20px;
                }
                .setting-title {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin-bottom: 6px;
                }
                .setting-desc {
                    font-size: 0.9rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    line-height: 1.5;
                }

                .setting-control { flex-shrink: 0; }

                /* Minimal Inputs */
                .minimal-select {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    min-width: 140px;
                    transition: border-color 0.2s;
                }
                .minimal-select:focus {
                    border-color: var(--primary-color);
                    outline: none;
                }

                /* IOS Toggle Switch */
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 28px;
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
                    background-color: rgba(255,255,255,0.1);
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: var(--primary-color);
                }
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }

                /* Widget Toggle Styles */
                .widget-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .widget-toggle-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.15s ease;
                }

                .widget-toggle-item:hover {
                    background: rgba(255,255,255,0.06);
                }

                .widget-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .widget-name {
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--text-color);
                }

                .widget-desc {
                    font-size: 0.85rem;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: .3s;
                    border-radius: 34px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }

                input:checked + .toggle-slider {
                    background-color: var(--primary-color);
                }

                input:checked + .toggle-slider:before {
                    transform: translateX(22px);
                }


                /* Music Section */
                .file-upload-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 20px;
                }
                .file-upload-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .music-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    border: none;
                }

                .music-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                }
                .track-icon { margin-right: 12px; opacity: 0.7; }
                .track-info { flex: 1; }
                .track-name { font-weight: 500; font-size: 0.95rem; color: var(--text-color); }
                .track-type { font-size: 0.8rem; opacity: 0.5; margin-top: 2px; }
                
                .delete-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-color);
                    opacity: 0.4;
                    font-size: 1.1rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .delete-btn:hover { background: rgba(255,0,0,0.1); color: #ff5555; opacity: 1; }

                /* Theme Cards */
                .theme-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 10px;
                }

                .theme-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .theme-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.2);
                }

                .theme-card.active {
                    border-color: var(--primary-color);
                    background: rgba(var(--primary-rgb), 0.05);
                    box-shadow: 0 0 0 1px var(--primary-color);
                }

                .theme-preview {
                    height: 100px;
                    width: 100%;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.1);
                }

                .preview-ui {
                    display: flex;
                    height: 100%;
                    width: 100%;
                }

                .preview-sidebar {
                    width: 30%;
                    height: 100%;
                    border-right: 1px solid rgba(0,0,0,0.1);
                }

                .preview-content {
                    flex: 1;
                    height: 100%;
                    padding: 8px;
                }

                /* Light Theme Preview */
                .light-preview { background: #f5f5f7; }
                .light-preview .preview-sidebar { background: #eaeaec; border-right-color: #d1d1d6; }
                .light-preview .preview-content { background: #ffffff; }

                /* Dark Theme Preview */
                .dark-preview { background: #1c1c1e; }
                .dark-preview .preview-sidebar { background: #2c2c2e; border-right-color: #3a3a3c; }
                .dark-preview .preview-content { background: #000000; }

                /* System Theme Preview (Split) */
                .system-preview {
                    background: linear-gradient(135deg, #f5f5f7 50%, #1c1c1e 50%);
                }
                 .system-preview .preview-ui { opacity: 0.7; }

                .theme-card-info {
                    text-align: center;
                }

                .theme-card-info h3 {
                    margin: 0 0 8px 0;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .theme-select-btn {
                    width: 100%;
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    background: transparent;
                    color: var(--text-color);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .theme-card.active .theme-select-btn {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                
                /* Data Section */
                .data-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                    padding: 20px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color);
                    max-width: 600px; /* Limit width */
                }
                .data-icon { font-size: 2rem; }
                .data-info h3 { margin: 0 0 5px 0; font-size: 1.1rem; }
                .action-buttons { display: flex; gap: 10px; }

                /* About Section - Minimal Redesign */
                /* About Grid Redesign */
                .about-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    background: rgba(255,255,255,0.02);
                    padding: 24px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .about-row {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    align-items: baseline;
                    gap: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .about-row:last-child { border-bottom: none; padding-bottom: 0; }
                .about-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-color);
                    opacity: 0.5;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .about-value {
                    font-size: 0.95rem;
                    color: var(--text-color);
                    opacity: 0.9;
                }
                .bio-text { margin: 0; line-height: 1.5; font-size: 0.9rem; opacity: 0.8; }
                .version-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-family: monospace;
                    min-width: 60px;
                    text-align: center;
                }
                .social-links-inline { display: flex; gap: 12px; }
                .social-icon-link {
                    color: var(--text-color);
                    opacity: 0.6;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                .social-icon-link:hover { opacity: 1; color: var(--primary-color); }
                
                .version-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    font-family: monospace;
                    font-size: 0.75rem;
                    opacity: 0.4;
                }

                /* Shortcuts Section */
                .shortcuts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 15px;
                }
                .shortcut-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                .shortcut-label { font-weight: 500; font-size: 0.9rem; opacity: 0.9; }
                .keys { display: flex; gap: 6px; }
                kbd {
                    padding: 4px 8px;
                    background: linear-gradient(180deg, #3a3f4b 0%, #2b303b 100%);
                    border: 1px solid #1e222b;
                    border-bottom: 2px solid #181b23;
                    border-radius: 6px;
                    font-family: monospace;
                    color: #eceff4;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    min-width: 24px;
                    text-align: center;
                }

                /* Mobile */
                @media (max-width: 800px) {
                    .settings-container {
                        display: flex;
                        flex-direction: column;
                        height: auto;
                        min-height: calc(100vh - 80px);
                        overflow: visible;
                        margin: 10px;
                        border-radius: 12px;
                    }
                    .settings-sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                        flex-direction: row;
                        overflow-x: auto;
                        padding: 10px;
                        gap: 4px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .settings-sidebar::-webkit-scrollbar {
                        display: none;
                    }
                    .settings-tab {
                        padding: 10px 14px;
                        flex-shrink: 0;
                        font-size: 0.85rem;
                    }
                    .settings-tab .tab-icon {
                        display: none;
                    }
                    .settings-content { 
                        padding: 20px 15px; 
                    }
                    .content-section h2 {
                        font-size: 1.5rem;
                        margin-bottom: 25px;
                    }
                    .theme-selection-grid {
                        grid-template-columns: 1fr;
                    }
                    .setting-item-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    .setting-control {
                        align-self: flex-end;
                    }
                    .shortcuts-grid {
                        grid-template-columns: 1fr;
                    }
                    .help-sections {
                        grid-template-columns: 1fr;
                    }
                }

                /* Help & Guide Styles */
                .help-sections {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }

                .help-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 18px;
                    transition: all 0.2s;
                }

                .help-card:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                }

                .help-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .help-icon {
                    font-size: 1.3rem;
                }

                .help-card h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .help-card p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    line-height: 1.5;
                }
            `}</style>
        </div >
    );
};

export default Settings;
