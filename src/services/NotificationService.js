/**
 * NotificationService - Handles periodic motivational notifications
 * for habits, focus tasks, and goals
 */

// Motivational messages for different types
const HABIT_MESSAGES = [
    "Your habits are waiting for you! 🌟 Building consistency is key.",
    "Time to check your habits! 💪 Small steps lead to big changes.",
    "Don't forget your habits today! 🎯 You're building something great.",
    "Your future self will thank you! ✨ Check those habits.",
    "Habit check time! 🚀 Consistency beats intensity."
];

const GOAL_MESSAGES = [
    "Take a moment to review your goals! 🎯 Keep your vision clear.",
    "Your goals need attention! 🌟 A quick review keeps you on track.",
    "Check in with your goals! 💪 Progress happens one step at a time.",
    "Goal reminder! 🏆 Are you moving closer to your dreams?",
    "Time to reflect on your goals! ✨ Stay focused on what matters."
];

const FOCUS_TASK_MESSAGES = [
    "is waiting for your focus! 💪 You've got this!",
    "needs your attention! 🎯 Make progress today.",
    "is on your focus list! 🚀 Time to tackle it.",
    "is ready for you! ✨ Let's make it happen.",
    "is calling! 🌟 Show it who's boss."
];

// Get a random message from an array
const getRandomMessage = (messages) => {
    return messages[Math.floor(Math.random() * messages.length)];
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Check if notifications are supported and permitted
export const canSendNotifications = () => {
    return 'Notification' in window && Notification.permission === 'granted';
};

// Send a system notification
export const sendNotification = (title, body, icon = '🔔') => {
    if (!canSendNotifications()) {
        console.log('Notifications not permitted');
        return null;
    }

    try {
        // For Electron apps, use Electron's notification
        if (window.electronAPI?.sendNotification) {
            window.electronAPI.sendNotification({ title, body });
            return null;
        }

        // For browser, use web Notification API
        const notification = new Notification(title, {
            body,
            icon: '/icon.png', // Fallback icon
            badge: '/icon.png',
            tag: 'shuuchuu-motivation',
            renotify: true,
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};

// Notification service state
let notificationInterval = null;

// Start the periodic notification service
export const startNotificationService = (settings, data, onNotification = null) => {
    stopNotificationService(); // Clear any existing interval

    if (!settings.motivationalNotificationsEnabled) {
        return;
    }

    if (!canSendNotifications()) {
        requestNotificationPermission();
        return;
    }

    const intervalMs = settings.motivationalNotificationInterval < 1
        ? settings.motivationalNotificationInterval * 1000 // seconds for testing
        : (settings.motivationalNotificationInterval || 60) * 60 * 1000;

    notificationInterval = setInterval(() => {
        sendMotivationalNotification(settings, data, onNotification);
    }, intervalMs);

    console.log(`Notification service started with ${settings.motivationalNotificationInterval || 60} minute interval`);
};

// Stop the notification service
export const stopNotificationService = () => {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
};

// Send a motivational notification based on rotation
export const sendMotivationalNotification = (settings, data, onNotification = null) => {
    const { habits = [], tasks = [], goals = [] } = data;

    // Get pending items
    // Fix: completedToday is camelCase from habitService
    const pendingHabits = habits.filter(h => !h.completedToday && !h.completed_today); // Check both just in case
    const focusTasks = tasks.filter(t => t.is_today_focus && t.status !== 'completed');
    const activeGoals = goals.filter(g => g.status === 'active');

    let notificationSent = false;
    let delay = 0;
    const delayStep = 5000; // 5 seconds between notifications

    // 1. Habits
    if (settings.notifyAboutHabits && pendingHabits.length > 0) {
        setTimeout(() => {
            const title = 'Habit Reminder 🌟';
            const message = getRandomMessage(HABIT_MESSAGES);
            sendNotification(title, message);
            if (onNotification) onNotification({ title, message, type: 'system', subType: 'habit', timestamp: new Date() });
        }, delay);
        delay += delayStep;
        notificationSent = true;
    }

    // 2. Focus Tasks
    if (settings.notifyAboutFocusTasks && focusTasks.length > 0) {
        setTimeout(() => {
            const task = focusTasks[0];
            const title = 'Focus Task Reminder 💪';
            const message = `"${task.title}" ${getRandomMessage(FOCUS_TASK_MESSAGES)}`;
            sendNotification(title, message);
            if (onNotification) onNotification({ title, message, type: 'system', subType: 'focus', timestamp: new Date() });
        }, delay);
        delay += delayStep;
        notificationSent = true;
    }

    // 3. Goals
    if (settings.notifyAboutGoals && activeGoals.length > 0) {
        setTimeout(() => {
            const title = 'Goal Check-in 🎯';
            const message = getRandomMessage(GOAL_MESSAGES);
            sendNotification(title, message);
            if (onNotification) onNotification({ title, message, type: 'system', subType: 'goal', timestamp: new Date() });
        }, delay);
        delay += delayStep;
        notificationSent = true;
    }

    return notificationSent;
};

export default {
    requestNotificationPermission,
    canSendNotifications,
    sendNotification,
    startNotificationService,
    stopNotificationService,
    sendMotivationalNotification
};
