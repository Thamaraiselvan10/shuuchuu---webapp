import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns';

const TimerContext = createContext();

export const useTimerContext = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
    // Persistent state
    const [duration, setDuration] = useState(() => {
        const saved = localStorage.getItem('focus_duration');
        return saved ? parseInt(saved, 10) : 25;
    });

    const [mode, setMode] = useState(() => {
        return localStorage.getItem('focus_mode') || 'setup'; // setup, running, completed, paused
    });

    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('focus_timeLeft');
        return saved ? parseInt(saved, 10) : 25 * 60;
    });

    const [isActive, setIsActive] = useState(() => {
        return localStorage.getItem('focus_isActive') === 'true';
    });

    const endTimeRef = useRef(null);
    const intervalRef = useRef(null);

    // Focus History Tracking
    const [focusHistory, setFocusHistory] = useState(() => {
        const saved = localStorage.getItem('focus_history');
        return saved ? JSON.parse(saved) : [];
    });

    const [dailyGoalHours, setDailyGoalHours] = useState(() => {
        const saved = localStorage.getItem('focus_daily_goal');
        return saved ? parseFloat(saved) : 1.5;
    });

    // Track current date to force re-renders on day change
    const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        const checkDate = () => {
            const nowStr = format(new Date(), 'yyyy-MM-dd');
            if (nowStr !== currentDate) {
                setCurrentDate(nowStr);
            }
        };

        const timer = setInterval(checkDate, 60000); // Check every minute
        return () => clearInterval(timer);
    }, [currentDate]);

    // Initialize end time from storage if active
    useEffect(() => {
        const savedEndTime = localStorage.getItem('focus_endTime');
        if (savedEndTime && isActive) {
            endTimeRef.current = parseInt(savedEndTime, 10);
        }
    }, []);

    // Persist history and goal
    useEffect(() => {
        localStorage.setItem('focus_history', JSON.stringify(focusHistory));
    }, [focusHistory]);

    useEffect(() => {
        localStorage.setItem('focus_daily_goal', dailyGoalHours);
    }, [dailyGoalHours]);

    // Computed Properties
    const getTodayMinutes = () => {
        const today = new Date();
        const entry = focusHistory.find(h => isSameDay(parseISO(h.date), today));
        return entry ? entry.minutes : 0;
    };

    const getYesterdayMinutes = () => {
        const yesterday = subDays(new Date(), 1);
        const entry = focusHistory.find(h => isSameDay(parseISO(h.date), yesterday));
        return entry ? entry.minutes : 0;
    };

    const getStreak = () => {
        let streak = 0;
        let checkDate = new Date();
        // Use current daily goal for calculation. 
        // Note: Ideally history would track goal at that time, but simplicity dictates using current goal.
        const goalMinutes = Math.max(1, dailyGoalHours * 60);

        while (true) {
            const entry = focusHistory.find(h => isSameDay(parseISO(h.date), checkDate));
            const minutes = entry ? entry.minutes : 0;

            if (minutes >= goalMinutes) {
                streak++;
                checkDate = subDays(checkDate, 1);
            } else {
                // If it's today and we haven't met the goal yet, we don't break the streak, 
                // we just don't count today and check yesterday.
                if (isSameDay(checkDate, new Date())) {
                    checkDate = subDays(checkDate, 1);
                    continue;
                }
                // If a past day didn't meet the goal, streak is broken.
                break;
            }
        }
        return streak;
    };

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('focus_duration', duration);
        localStorage.setItem('focus_mode', mode);
        localStorage.setItem('focus_timeLeft', timeLeft);
        localStorage.setItem('focus_isActive', isActive);
        if (endTimeRef.current) {
            localStorage.setItem('focus_endTime', endTimeRef.current);
        } else {
            localStorage.removeItem('focus_endTime');
        }
    }, [duration, mode, timeLeft, isActive]);

    // Timer tick logic
    useEffect(() => {
        if (isActive && mode === 'running') {
            if (!endTimeRef.current) {
                // If we just started or reloaded and lost ref, reset based on timeLeft
                endTimeRef.current = Date.now() + (timeLeft * 1000);
            }

            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((endTimeRef.current - now) / 1000);

                if (remaining <= 0) {
                    handleComplete();
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
            endTimeRef.current = null;
        }

        return () => clearInterval(intervalRef.current);
    }, [isActive, mode]);

    const startTimer = () => {
        const now = Date.now();
        const end = now + (duration * 60 * 1000);
        endTimeRef.current = end;
        setTimeLeft(duration * 60);
        setIsActive(true);
        setMode('running');
    };

    const pauseTimer = () => {
        setIsActive(false);
        setMode('paused');
        endTimeRef.current = null; // Clear end time as we are pausing
    };

    const resumeTimer = () => {
        const now = Date.now();
        const end = now + (timeLeft * 1000);
        endTimeRef.current = end;
        setIsActive(true);
        setMode('running');
    };

    const stopTimer = () => {
        setIsActive(false);
        setMode('setup');
        setTimeLeft(duration * 60);
        endTimeRef.current = null;
    };

    const handleComplete = () => {
        setIsActive(false);
        setMode('completed');
        setTimeLeft(0);
        endTimeRef.current = null;

        // Update History
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setFocusHistory(prev => {
            const existingIndex = prev.findIndex(h => h.date === todayStr);
            const minutesToAdd = parseInt(duration, 10) || 0; // Ensure number
            if (existingIndex >= 0) {
                const newHistory = [...prev];
                newHistory[existingIndex].minutes += minutesToAdd;
                return newHistory;
            } else {
                return [...prev, { date: todayStr, minutes: minutesToAdd }];
            }
        });

        // Audio handled in Timer.jsx now

        // System notification disabled to prevent double popup (User request)
        /* 
        if (window.electronAPI && window.electronAPI.invoke) {
            window.electronAPI.invoke('show-notification', {
                title: 'Focus Session Complete',
                body: 'Great job! Time to take a break.'
            });
        }
        */
    };

    const adjustDuration = (amount) => {
        setDuration(prev => Math.max(1, Math.min(180, prev + amount)));
    };

    const setDurationValue = (val) => {
        setDuration(val);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const value = {
        duration,
        timeLeft,
        isActive,
        mode,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        adjustDuration,
        setDuration: setDurationValue,
        setMode,
        formatTime,
        focusHistory,
        dailyGoalHours,
        setDailyGoalHours,
        getTodayMinutes,
        getYesterdayMinutes,
        getStreak
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};
