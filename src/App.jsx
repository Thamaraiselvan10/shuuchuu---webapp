import React, { Suspense, lazy } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { GoalsProvider } from './context/GoalsContext'
import { ToastProvider } from './context/ToastContext'
import { CelebrationProvider } from './context/CelebrationContext'
import { TasksProvider } from './context/TasksContext'
import { HabitsProvider } from './context/HabitsContext'

import Layout from './layouts/Layout'
import AlarmManager from './components/AlarmManager';

// Static imports
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Timer from './pages/Timer';
import Alarms from './pages/Alarms';
import Calendar from './pages/Calendar';
import Diary from './pages/Diary';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import GoalDetails from './pages/GoalDetails';
import Habits from './pages/Habits';
import Notes from './pages/Notes';
import Wellness from './pages/Wellness';
import MiniTimer from './pages/MiniTimer';

import { useNavigate } from 'react-router-dom';

const NavigationHandler = ({ isMiniMode, prevMiniModeRef }) => {
    const navigate = useNavigate();

    React.useEffect(() => {
        if (prevMiniModeRef.current === true && isMiniMode === false) {
            setTimeout(() => {
                navigate('/focus');
            }, 100);
        }
        prevMiniModeRef.current = isMiniMode;
    }, [isMiniMode, navigate, prevMiniModeRef]);

    return null;
};

import { AuthProvider } from './context/AuthContext'

function App() {
    // Mini mode is an Electron-only feature; always false in web app
    const [isMiniMode] = React.useState(false);
    const prevMiniModeRef = React.useRef(false);

    return (
        <ThemeProvider>
            <SettingsProvider>
                <TimerProvider>
                    <ProfileProvider>
                        <GoalsProvider>
                            <ToastProvider>
                                <CelebrationProvider>
                                    <AuthProvider>
                                    <TasksProvider>
                                        <HabitsProvider>
                                            <AlarmManager />
                                            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                                <NavigationHandler isMiniMode={isMiniMode} prevMiniModeRef={prevMiniModeRef} />

                                                {isMiniMode ? (
                                                    <MiniTimer />
                                                ) : (
                                                    <Routes>
                                                        {/* Removed Login and RequireAuth — App is local only now */}
                                                        <Route path="/" element={<Layout />}>
                                                            <Route index element={<Dashboard />} />
                                                            <Route path="tasks" element={<Tasks />} />
                                                            <Route path="goals" element={<Goals />} />
                                                            <Route path="goals/:id" element={<GoalDetails />} />
                                                            <Route path="calendar" element={<Calendar />} />
                                                            <Route path="diary" element={<Diary />} />
                                                            <Route path="alarms" element={<Alarms />} />
                                                            <Route path="focus" element={<Timer />} />
                                                            <Route path="habits" element={<Habits />} />
                                                            <Route path="notes" element={<Notes />} />
                                                            <Route path="wellness" element={<Wellness />} />
                                                            <Route path="settings" element={<Settings />} />
                                                            <Route path="profile" element={<Profile />} />
                                                        </Route>
                                                    </Routes>
                                                )}
                                            </Router>
                                        </HabitsProvider>
                                    </TasksProvider>
                                </AuthProvider>
                                </CelebrationProvider>
                            </ToastProvider>
                        </GoalsProvider>
                    </ProfileProvider>
                </TimerProvider>
            </SettingsProvider>
        </ThemeProvider>
    )
}

export default App
