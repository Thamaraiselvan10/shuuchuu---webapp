import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import ProfilePopup from '../components/ProfilePopup';
import DailyBriefingModal from '../components/DailyBriefingModal';
import FocusRulesModal from '../components/FocusRulesModal';
import AppreciationMessage from '../components/AppreciationMessage';
import { Home, CheckSquare, Clock, Target, Repeat, Calendar, FileText, BookOpen, Heart, Bell, Pin, PinOff, ChevronLeft, ChevronsLeft, Wind, MoreHorizontal, Settings as SettingsIcon, User } from 'lucide-react';
import './Layout.css';

import { formatDistanceToNow, isSameDay, differenceInMinutes } from 'date-fns';

import { useTimerContext } from '../context/TimerContext';
import { useTasks } from '../context/TasksContext';
import { useGoals } from '../context/GoalsContext';
import { useHabits } from '../context/HabitsContext';

import { useSettings } from '../context/SettingsContext';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { startNotificationService, stopNotificationService, requestNotificationPermission } from '../services/NotificationService';


const Layout = () => {
    const { profile, updateProfile } = useProfile();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { timeLeft, mode, formatTime, setMode } = useTimerContext();
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { habits } = useHabits();
    const { settings, updateSettings } = useSettings();

    // Sync Google Profile to Local Profile: DISABLED by user request
    // User wants to keep local profile separate from Google Auth.
    /*
    useEffect(() => {
        if (currentUser && (!profile.name || !profile.photo)) {
             // ... Code removed ...
        }
    }, [currentUser, profile, updateProfile]);
    */

    // Rescue State for small windows
    const [isRescueMode, setIsRescueMode] = useState(window.innerWidth < 500);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed for auto-hide
    const [isSidebarPinned, setIsSidebarPinned] = useState(false); // User can pin sidebar open
    const sidebarRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // Mobile navigation state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showMoreDrawer, setShowMoreDrawer] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Startup Flow State: 0=check, 1=profile popup, 2=daily briefing, 3=focus rules, 4=done
    const [startupStep, setStartupStep] = useState(() => {
        const hasShown = sessionStorage.getItem('startupFlowShown');
        return hasShown ? 4 : 1; // If shown before, skip to done
    });

    const handleStartupNext = () => {
        if (startupStep < 4) {
            const nextStep = startupStep + 1;
            // Temporarily hide current modal (step 0 or similar non-matching value)
            setStartupStep(0);

            // Delay before showing next modal to give user time to think
            setTimeout(() => {
                setStartupStep(nextStep);
                if (nextStep === 4) {
                    sessionStorage.setItem('startupFlowShown', 'true');
                }
            }, 1500);
        }
    };

    // Auto-show sidebar when mouse is near left edge
    useEffect(() => {
        const handleMouseMove = (e) => {
            // Don't auto-hide if pinned
            if (isSidebarPinned) return;

            const triggerZone = 20; // pixels from left edge to trigger show
            const sidebarWidth = 250;

            // Show sidebar when mouse is within trigger zone on left edge
            if (e.clientX <= triggerZone && !isSidebarOpen) {
                clearTimeout(hideTimeoutRef.current);
                setIsSidebarOpen(true);
            }

            // Hide sidebar when mouse moves away from sidebar area
            if (e.clientX > sidebarWidth + 30 && isSidebarOpen && !isSidebarPinned) {
                // Quick hide with minimal delay
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = setTimeout(() => {
                    setIsSidebarOpen(false);
                }, 50);
            }

            // Cancel hide if mouse returns to sidebar area
            if (e.clientX <= sidebarWidth && isSidebarOpen) {
                clearTimeout(hideTimeoutRef.current);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(hideTimeoutRef.current);
        };
    }, [isSidebarOpen, isSidebarPinned]);

    // Dynamic greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const pendingTaskCount = tasks.filter(t => t.status === 'pending').length;
    const habitsPendingCount = habits.filter(h => !h.completedToday).length;
    const goalsActiveCount = goals.filter(g => g.status !== 'completed').length;
    const todayEventsCount = tasks.filter(t => t.due_at && isSameDay(new Date(t.due_at), new Date())).length;
    // Shortcuts
    useKeyboardShortcuts({
        toggleSidebar: () => {
            if (isSidebarPinned) {
                setIsSidebarPinned(false);
                setIsSidebarOpen(false);
            } else {
                setIsSidebarPinned(true);
                setIsSidebarOpen(true);
            }
        },
        toggleMusic: () => updateSettings({ isMusicEnabled: !settings.isMusicEnabled }),

        // Timer Controls - Updated to show rules popup
        startTimer: () => {
            // Navigate to focus page with autoStart flag to trigger rules popup
            navigate('/focus', { state: { autoStart: true, timestamp: Date.now() } });
        },
        pauseTimer: () => setMode('paused'),
        stopTimer: () => setMode('setup'),

        // Navigation
        goToDashboard: () => navigate('/'),
        goToTasks: () => navigate('/tasks'),
        goToGoals: () => navigate('/goals'),
        goToHabits: () => navigate('/habits'),
        goToNotes: () => navigate('/notes'),
        goToCalendar: () => navigate('/calendar'),
        goToDiary: () => navigate('/diary'),
        goToAlarms: () => navigate('/alarms'),
        goToWellness: () => navigate('/wellness'),
        goToProfile: () => navigate('/profile'),
        goToSettings: () => navigate('/settings')
    });

    useEffect(() => {
        const handleResize = () => {
            // Only trigger rescue mode if width is small BUT greater than 0
            // Windows sometimes reports 0 or very small width when minimized
            if (window.innerWidth > 0 && window.innerWidth < 500) {
                setIsRescueMode(true);
                setIsSidebarOpen(false);
                setIsSidebarPinned(false);
            } else if (window.innerWidth >= 500) {
                setIsRescueMode(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [taskNotifications, setTaskNotifications] = useState([]); // Renamed from notifications
    const [systemNotifications, setSystemNotifications] = useState([]); // New state
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const notificationRef = useRef(null);
    const alarmAudioRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu) {
                setShowProfileMenu(false);
            }
            if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showProfileMenu, showNotifications]);

    // Notification Filtering Logic based on settings
    useEffect(() => {
        const now = new Date();
        const taskNotificationMinutes = settings.taskNotificationMinutes || 60;

        if (!settings.notificationsEnabled) {
            setTaskNotifications([]);
            return;
        }

        const upcomingTasks = tasks.filter(task => {
            if (!task.due_at || task.status === 'completed') return false;
            const dueDate = new Date(task.due_at);
            const minutesUntilDue = differenceInMinutes(dueDate, now);
            // Include tasks due within the notification threshold and not overdue by more than 60 mins
            return minutesUntilDue >= -60 && minutesUntilDue <= taskNotificationMinutes;
        });

        // Add type and timestamp to tasks for consistent handling
        const formattedTasks = upcomingTasks.map(t => ({
            ...t,
            type: 'task',
            timestamp: new Date(t.due_at) // Use due date as sort key
        }));

        setTaskNotifications(formattedTasks);
    }, [tasks, settings.taskNotificationMinutes, settings.notificationsEnabled]);

    // Helper to add system notifications
    const addSystemNotification = (notif) => {
        const newNotif = {
            id: Date.now(), // unique id
            timestamp: new Date(),
            ...notif
        };
        setSystemNotifications(prev => [newNotif, ...prev]);
    };

    // Merge and sort notifications
    const notifications = React.useMemo(() => {
        return [...systemNotifications, ...taskNotifications].sort((a, b) => {
            // Sort by timestamp descending (newest/most upcoming first)
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }, [systemNotifications, taskNotifications]);

    const completionQuotes = [
        "Great job! You've mastered your focus.",
        "Success is the sum of small efforts repeated day in and day out.",
        "You did it! Take a well-deserved break.",
        "Focus is the key to productivity. You nailed it!",
        "Another step closer to your goals. Keep it up!"
    ];
    const [randomQuote, setRandomQuote] = useState("");

    // Appreciation Message State
    const [showAppreciation, setShowAppreciation] = useState(false);
    const [appreciationMessage, setAppreciationMessage] = useState('');
    const lastMilestone = useRef(0);
    const { duration } = useTimerContext(); // Ensure duration is available

    // Listen for timer completion
    useEffect(() => {
        if (mode === 'completed') {
            setShowCompletionModal(true);
            setRandomQuote(completionQuotes[Math.floor(Math.random() * completionQuotes.length)]);
            if (alarmAudioRef.current) {
                alarmAudioRef.current.currentTime = 0;
                alarmAudioRef.current.play().catch(e => console.error("Alarm play failed:", e));
            }
            // Send system notification for timer completion
            import('../services/NotificationService').then(({ sendNotification }) => {
                const title = '🏆 Focus Session Complete!';
                const message = 'Great job! You\'ve completed your focus session.';

                sendNotification(title, message);
                addSystemNotification({
                    title,
                    message,
                    type: 'system',
                    subType: 'timer'
                });
            });
        } else {
            // Stop alarm if mode changes (e.g. user resets elsewhere)
            if (alarmAudioRef.current) {
                alarmAudioRef.current.pause();
                alarmAudioRef.current.currentTime = 0;
            }
        }
    }, [mode]);

    // Marquee Trigger Logic (Every 5 minutes)
    useEffect(() => {
        if (mode === 'running') {
            const totalSeconds = (duration || 25) * 60;
            const elapsedSeconds = totalSeconds - timeLeft;

            const currentMinutes = Math.floor(elapsedSeconds / 60);

            // Trigger every 5 minutes
            if (currentMinutes > 0 && currentMinutes % 5 === 0 && currentMinutes > lastMilestone.current) {
                const msgs = [
                    `${currentMinutes} minutes of focus! Keep it up!`,
                    `You're doing great! ${currentMinutes} minutes in!`,
                    `Stay focused! ${currentMinutes} minutes passed.`,
                    `Excellent work! ${currentMinutes} minutes focused.`
                ];
                const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];

                setAppreciationMessage(randomMsg);
                setShowAppreciation(true);
                lastMilestone.current = currentMinutes;

                setTimeout(() => {
                    setShowAppreciation(false);
                }, 5000);
            }
        } else {
            // Reset if mode is not running, if desired, or keep track
        }

        // Reset if new session (elapsed near 0)
        const totalSeconds = (duration || 25) * 60;
        if ((totalSeconds - timeLeft) < 10) {
            lastMilestone.current = 0;
        }

    }, [timeLeft, mode, duration]);

    // Focus Music Logic (Persistent)
    const bgMusicRef = useRef(null);
    const { isMusicEnabled, currentTrack, playlist } = settings;

    // Ensure we have a track selected if none is set
    useEffect(() => {
        if (!currentTrack && playlist && playlist.length > 0) {
            updateSettings({ currentTrack: playlist[0] });
        }
    }, [playlist, currentTrack, updateSettings]);

    // Motivational Notification Service
    useEffect(() => {
        // Request permission on mount
        requestNotificationPermission();

        // Start the service with current settings and data
        if (settings.motivationalNotificationsEnabled) {
            startNotificationService(settings, { tasks, goals, habits }, addSystemNotification);
        }

        return () => {
            stopNotificationService();
        };
    }, [settings.motivationalNotificationsEnabled, settings.motivationalNotificationInterval]);

    // Re-sync notification data when tasks/goals/habits change
    useEffect(() => {
        if (settings.motivationalNotificationsEnabled) {
            startNotificationService(settings, { tasks, goals, habits }, addSystemNotification);
        }
    }, [tasks, goals, habits]);

    // Unified Audio Sync Effect
    useEffect(() => {
        const audio = bgMusicRef.current;
        if (!audio || !currentTrack) return;

        // 1. Update Source if needed
        // Note: audio.src returns full absolute URL, currentTrack.src might be relative or different. 
        // We compare loosely or just rely on the fact that execution is fast. 
        // Better to check if src actually needs update to avoid resetting playback position needlessly, 
        // though for bg music loops it's less critical.
        // For simplicity and robustness on track change:

        const updateSource = async () => {
            // Check if source is actually different to avoid reload
            // (Simple string check might fail if browser resolves relative paths, but our inputs are absolute HTTP URLs or blobs)
            if (audio.src !== currentTrack.src) {
                audio.src = currentTrack.src;
                audio.load();
            }

            try {
                if (mode === 'running' && isMusicEnabled) {
                    await audio.play();
                } else {
                    audio.pause();
                }
            } catch (err) {
                console.error("Audio playback error:", err);
            }
        };

        updateSource();

    }, [mode, isMusicEnabled, currentTrack]); // Re-run if any dependency changes

    // Auto-play next track
    const handleTrackEnded = () => {
        if (!playlist || playlist.length === 0) return;

        const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
        const nextIndex = (currentIndex + 1) % playlist.length;
        updateSettings({ currentTrack: playlist[nextIndex] });
    };

    // ... (notification logic remains same)

    const handleCloseModal = () => {
        setShowCompletionModal(false);
        setMode('setup');
        if (alarmAudioRef.current) {
            alarmAudioRef.current.pause();
            alarmAudioRef.current.currentTime = 0;
        }
    };

    return (
        <div className="layout">
            {/* Startup Flow Modals */}
            {/* Persistent Overlay for seamless transitions */}
            {startupStep < 4 && (
                <div className="modal-overlay" style={{ zIndex: 999 }}>
                    {startupStep === 0 && (
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
                    )}
                </div>
            )}

            <ProfilePopup isOpen={startupStep === 1} onNext={handleStartupNext} hideOverlay={true} />
            <DailyBriefingModal isOpen={startupStep === 2} onNext={handleStartupNext} tasks={tasks} hideOverlay={true} />
            <FocusRulesModal isOpen={startupStep === 3} onClose={handleStartupNext} hideOverlay={true} />

            {/* Edge trigger indicator when sidebar is closed */}
            {!isSidebarOpen && (
                <div className="sidebar-edge-trigger" title="Move cursor here to open sidebar">
                    <span>›</span>
                </div>
            )}
            <aside
                ref={sidebarRef}
                className={`sidebar ${isSidebarOpen ? '' : 'closed'} ${isSidebarPinned ? 'pinned' : ''}`}
            >
                <div className="logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Shuuchuu</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                            style={{
                                background: isSidebarPinned ? 'var(--primary-color)' : 'transparent',
                                border: 'none',
                                color: isSidebarPinned ? 'white' : 'var(--text-color)',
                                cursor: 'pointer',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                opacity: isSidebarPinned ? 1 : 0.6,
                                transition: 'all 0.2s ease'
                            }}
                            title={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar Open"}
                        >
                            {isSidebarPinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                        </button>
                        <button
                            onClick={() => {
                                setIsSidebarOpen(false);
                                setIsSidebarPinned(false);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                opacity: 0.6,
                                transition: 'all 0.2s ease'
                            }}
                            title="Collapse Sidebar"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                    </div>
                </div>
                <nav>
                    <NavLink to="/" title="Dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Home size={18} /> <span>Dashboard</span></NavLink>
                    <NavLink to="/tasks" title="Tasks" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <CheckSquare size={18} /> <span>Tasks</span>
                        {pendingTaskCount > 0 && <span className="nav-badge">{pendingTaskCount}</span>}
                    </NavLink>
                    <NavLink to="/focus" title="Focus Time" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Clock size={18} /> <span>Focus Time</span></NavLink>
                    <NavLink to="/goals" title="Goals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Target size={18} /> <span>Goals</span>
                        {goalsActiveCount > 0 && <span className="nav-badge">{goalsActiveCount}</span>}
                    </NavLink>
                    <NavLink to="/habits" title="Habits" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Repeat size={18} /> <span>Habits</span>
                        {habitsPendingCount > 0 && <span className="nav-badge">{habitsPendingCount}</span>}
                    </NavLink>
                    <NavLink to="/calendar" title="Calendar" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Calendar size={18} /> <span>Calendar</span>
                        {todayEventsCount > 0 && <span className="nav-badge">{todayEventsCount}</span>}
                    </NavLink>
                    <NavLink to="/notes" title="Notes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><FileText size={18} /> <span>Notes</span></NavLink>
                    <NavLink to="/diary" title="Diary" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><BookOpen size={18} /> <span>Diary</span></NavLink>
                    <NavLink to="/wellness" title="Wellness" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Heart size={18} /> <span>Wellness</span></NavLink>
                    <NavLink to="/alarms" title="Alarms" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Bell size={18} /> <span>Alarms</span></NavLink>
                </nav>
            </aside>
            <main className="content">
                <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100 }}>



                    {showAppreciation && <AppreciationMessage message={appreciationMessage} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {mode === 'running' && (
                            <div style={{
                                background: 'rgba(var(--primary-rgb), 0.15)',
                                color: 'var(--primary-color)',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: '1px solid var(--primary-color)',
                                boxShadow: '0 2px 8px rgba(var(--primary-rgb), 0.2)'
                            }}>
                                <Clock size={16} />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Notification Bell */}
                        <div className="notification-wrapper" ref={notificationRef}>
                            <button
                                className={`notification-btn ${notifications.length > 0 ? 'glowing' : ''}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label={`View notifications${notifications.length > 0 ? ` (${notifications.length} pending)` : ''}`}
                            >
                                <span style={{ fontSize: '1.2rem' }}>🔔</span>
                                {notifications.length > 0 && (
                                    <span className="notification-badge" aria-hidden="true">{notifications.length}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown glass-panel">
                                    <div className="notification-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3>Notifications</h3>
                                            <span className="count">{notifications.length}</span>
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSystemNotifications([]);
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-color)',
                                                    opacity: 0.6,
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                                onMouseLeave={(e) => { e.target.style.opacity = '0.6'; e.target.style.background = 'transparent'; }}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="empty-notifications">
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map(item => (
                                                <div key={item.id} className="notification-item" onClick={() => {
                                                    if (item.type === 'task') {
                                                        navigate('/tasks');
                                                    }
                                                    // For system notifs, maybe just close or navigate to relevant page
                                                    setShowNotifications(false);
                                                }}>
                                                    <div className="notif-title">{item.title}</div>
                                                    <div className="notif-time">
                                                        {item.type === 'task'
                                                            ? `Due ${formatDistanceToNow(new Date(item.due_at), { addSuffix: true })}`
                                                            : item.message
                                                        }
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className="profile-menu-wrapper"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowProfileMenu(!showProfileMenu);
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: '20px',
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
                                    {profile.name || 'User'}
                                </span>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#ccc'
                                }}>
                                    {profile.photo ? (
                                        <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                            {profile.name ? profile.name[0].toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Click Dropdown */}
                            {showProfileMenu && (
                                <div className="profile-dropdown glass-panel">
                                    <div className="menu-item" onClick={(e) => { e.stopPropagation(); navigate('/profile'); setShowProfileMenu(false); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        View Profile
                                    </div>
                                    <div className="menu-item" onClick={(e) => { e.stopPropagation(); navigate('/settings'); setShowProfileMenu(false); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                        Settings
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>

            {/* ===== MOBILE BOTTOM TAB BAR ===== */}
            {isMobile && (
                <nav className="bottom-tab-bar">
                    <NavLink to="/" className={({ isActive }) => `tab-item ${isActive && location.pathname === '/' ? 'active' : ''}`} end>
                        <Home />
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/tasks" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                        <CheckSquare />
                        <span>Tasks</span>
                        {pendingTaskCount > 0 && <span className="tab-badge">{pendingTaskCount}</span>}
                    </NavLink>
                    <NavLink to="/focus" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                        <Clock />
                        <span>Focus</span>
                    </NavLink>
                    <NavLink to="/habits" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                        <Repeat />
                        <span>Habits</span>
                        {habitsPendingCount > 0 && <span className="tab-badge">{habitsPendingCount}</span>}
                    </NavLink>
                    <button className={`tab-item ${showMoreDrawer ? 'active' : ''}`} onClick={() => setShowMoreDrawer(true)}>
                        <MoreHorizontal />
                        <span>More</span>
                    </button>
                </nav>
            )}

            {/* ===== MOBILE "MORE" DRAWER ===== */}
            {isMobile && showMoreDrawer && (
                <div className="more-drawer-overlay" onClick={() => setShowMoreDrawer(false)}>
                    <div className="more-drawer" onClick={e => e.stopPropagation()}>
                        <div className="more-drawer-handle" />
                        <div className="more-drawer-grid">
                            {[
                                { to: '/goals', icon: <Target />, label: 'Goals' },
                                { to: '/calendar', icon: <Calendar />, label: 'Calendar' },
                                { to: '/notes', icon: <FileText />, label: 'Notes' },
                                { to: '/diary', icon: <BookOpen />, label: 'Diary' },
                                { to: '/wellness', icon: <Heart />, label: 'Wellness' },
                                { to: '/alarms', icon: <Bell />, label: 'Alarms' },
                                { to: '/profile', icon: <User />, label: 'Profile' },
                                { to: '/settings', icon: <SettingsIcon />, label: 'Settings' },
                            ].map(item => (
                                <button
                                    key={item.to}
                                    className={`more-drawer-item ${location.pathname === item.to ? 'active-route' : ''}`}
                                    onClick={() => { navigate(item.to); setShowMoreDrawer(false); }}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Alarm Audio */}
            <audio ref={alarmAudioRef} loop>
                <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
                <source src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" type="audio/ogg" />
            </audio>

            {/* Global Focus Background Music */}
            <audio ref={bgMusicRef} loop={false} onEnded={handleTrackEnded} />

            {/* Global Completion Modal */}
            {
                showCompletionModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className="glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🏆</div>
                            <h2 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>Session Completed!</h2>
                            <h3 style={{ margin: '0 0 15px 0' }}>You made it!</h3>
                            <p style={{ marginBottom: '20px', color: 'var(--text-color)', fontStyle: 'italic' }}>"{randomQuote}"</p>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Awesome!
                            </button>
                        </div>
                    </div>
                )
            }

            <style>{`
                .notification-wrapper {
                    position: relative;
                }

                .notification-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .notification-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.7rem;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 2px solid var(--bg-color);
                }

                .notification-dropdown {
                    position: absolute;
                    top: 100%;
                    right: -10px;
                    width: 300px;
                    background: var(--card-bg);
                    border: var(--glass-border);
                    border-radius: 12px;
                    margin-top: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 9999;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .notification-header {
                    padding: 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notification-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .notification-header .count {
                    background: rgba(var(--primary-rgb), 0.1);
                    color: var(--primary-color);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }

                .notification-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item {
                    padding: 12px 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .notification-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .notification-item:last-child {
                    border-bottom: none;
                }

                .notif-title {
                    font-weight: 500;
                    margin-bottom: 4px;
                    font-size: 0.95rem;
                }

                .notif-time {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.6;
                }

                .notification-btn.glowing {
                    animation: glow 1.5s infinite alternate;
                    background: rgba(var(--primary-rgb), 0.2);
                }

                @keyframes glow {
                    from { box-shadow: 0 0 5px rgba(var(--primary-rgb), 0.5); }
                    to { box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.8), 0 0 20px rgba(var(--primary-rgb), 0.4); }
                }

                .empty-notifications {

                    padding: 30px;
                    text-align: center;
                    color: var(--text-color);
                    opacity: 0.5;
                    font-style: italic;
                }

                .profile-menu-wrapper {
                    position: relative;
                    z-index: 10000;
                }

                .profile-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 180px;
                    background: var(--card-bg);
                    border: var(--glass-border);
                    border-radius: 12px;
                    margin-top: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    overflow: visible; /* Changed from hidden to allow pseudo-element bridge */
                    animation: slideDown 0.2s ease-out;
                    padding: 5px;
                }

                /* Invisible bridge to prevent menu from closing when moving mouse across gap */
                .profile-dropdown::before {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: 0;
                    right: 0;
                    height: 10px;
                    background: transparent;
                }

                .menu-item {
                    padding: 10px 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--text-color);
                    cursor: pointer;
                    border-radius: 8px;
                    transition: background 0.2s;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .menu-item:hover {
                    background: rgba(255,255,255,0.05); /* Assuming dark mode default, adjust if light */
                    color: var(--primary-color);
                }
            `}</style>
        </div >
    );
};

export default Layout;
