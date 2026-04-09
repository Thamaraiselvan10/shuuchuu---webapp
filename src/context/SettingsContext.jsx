import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const defaultSettings = {
            timer: {
                focus: 25,
                shortBreak: 5,
                longBreak: 15
            },
            soundEnabled: true,
            notificationTone: 'default', // default, chime, bell, alert
            soundVolume: 0.5,
            eventNotificationMinutes: 1440, // 24 hours
            taskNotificationMinutes: 60, // 1 hour
            notificationsEnabled: true,
            // Music Settings
            isMusicEnabled: true,
            currentTrack: null, // { name: 'Default Lofi', src: '...' }
            playlist: [],
            // Shortcuts
            shortcuts: {
                toggleSidebar: { key: 'b', ctrl: true, alt: false, shift: false, meta: false },
                toggleMusic: { key: 'm', ctrl: true, alt: false, shift: false, meta: false },
                startTimer: { key: 'Enter', ctrl: true, alt: false, shift: false, meta: false },
                pauseTimer: { key: 'p', ctrl: true, alt: false, shift: false, meta: false },
                stopTimer: { key: 'Escape', ctrl: true, alt: false, shift: false, meta: false },
                goToDashboard: { key: 'd', ctrl: false, alt: true, shift: false, meta: false },
                goToTasks: { key: 't', ctrl: false, alt: true, shift: false, meta: false },
                goToGoals: { key: 'g', ctrl: false, alt: true, shift: false, meta: false },
                goToHabits: { key: 'h', ctrl: false, alt: true, shift: false, meta: false },
                goToNotes: { key: 'n', ctrl: false, alt: true, shift: false, meta: false },
                goToCalendar: { key: 'c', ctrl: false, alt: true, shift: false, meta: false },
                goToDiary: { key: 'j', ctrl: false, alt: true, shift: false, meta: false }, // j for journal
                goToAlarms: { key: 'a', ctrl: false, alt: true, shift: false, meta: false },
                goToWellness: { key: 'w', ctrl: false, alt: true, shift: false, meta: false },
                goToProfile: { key: 'u', ctrl: false, alt: true, shift: false, meta: false }, // u for user
                goToSettings: { key: 's', ctrl: false, alt: true, shift: false, meta: false }
            },
            // Dashboard Widget Configuration
            dashboardWidgets: {
                dailyProgress: true,
                dailyArticle: true,
                goals: true,
                tasks: true,
                habits: true,
                notes: true
            },
            // Motivational Notifications
            motivationalNotificationsEnabled: true,
            motivationalNotificationInterval: 60, // minutes
            notifyAboutHabits: true,
            notifyAboutFocusTasks: true,
            notifyAboutGoals: true,
            // Tasks auto-delete
            autoDeleteDoneTasks: true,
            autoDeleteDoneTasksHours: 1
        };

        const saved = localStorage.getItem('app-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge defaults with saved to ensure new keys (like shortcuts, dashboardWidgets) exist
                return {
                    ...defaultSettings,
                    ...parsed,
                    shortcuts: parsed.shortcuts || defaultSettings.shortcuts,
                    dashboardWidgets: { ...defaultSettings.dashboardWidgets, ...parsed.dashboardWidgets }
                };
            } catch (e) {
                console.error("Failed to parse settings", e);
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('app-settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const addTrack = (track) => {
        setSettings(prev => ({
            ...prev,
            playlist: [...(prev.playlist || []), track]
        }));
    };

    const removeTrack = (trackId) => {
        setSettings(prev => ({
            ...prev,
            playlist: prev.playlist.filter(t => t.id !== trackId),
            // Reset current track if it was the one deleted
            currentTrack: prev.currentTrack?.id === trackId ? prev.playlist[0] : prev.currentTrack
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, addTrack, removeTrack }}>
            {children}
        </SettingsContext.Provider>
    );
};
