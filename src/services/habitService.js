import { v4 as uuidv4 } from 'uuid';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { dbQuery } from './db';

export const habitService = {
    getAll: async () => {
        const habits = await dbQuery('SELECT * FROM habits ORDER BY created_at DESC');
        const logs = await dbQuery('SELECT * FROM habit_logs');

        // Calculate streaks for each habit
        return habits.map(habit => {
            const habitLogs = logs.filter(log => log.habit_id === habit.id);
            const streak = calculateStreak(habitLogs);
            const completedToday = habitLogs.some(log => isSameDay(parseISO(log.completed_at), new Date()));

            return {
                ...habit,
                streak,
                maxStreak: habit.max_streak || 0,
                completedToday,
                logs: habitLogs
            };
        });
    },

    create: async (habit) => {
        const id = uuidv4();
        const created_at = new Date().toISOString();
        await dbQuery(
            'INSERT INTO habits (id, title, category, created_at) VALUES (?, ?, ?, ?)',
            [id, habit.title, habit.category, created_at]
        );
        return id;
    },

    delete: async (id) => {
        await dbQuery('DELETE FROM habits WHERE id = ?', [id]);
    },

    toggleLog: async (habitId, date) => {
        const logs = await dbQuery('SELECT * FROM habit_logs WHERE habit_id = ?', [habitId]);
        const existing = logs.find(log => isSameDay(parseISO(log.completed_at), date));

        if (existing) {
            // Remove log
            await dbQuery('DELETE FROM habit_logs WHERE id = ?', [existing.id]);
        } else {
            // Add log
            const id = uuidv4();
            await dbQuery(
                'INSERT INTO habit_logs (id, habit_id, completed_at) VALUES (?, ?, ?)',
                [id, habitId, date.toISOString()]
            );
        }

        // Recalculate streak to update max_streak if needed
        const newLogs = await dbQuery('SELECT * FROM habit_logs WHERE habit_id = ?', [habitId]);
        const currentStreak = calculateStreak(newLogs);

        const habitResult = await dbQuery('SELECT max_streak FROM habits WHERE id = ?', [habitId]);
        const currentMax = habitResult[0]?.max_streak || 0;

        if (currentStreak > currentMax) {
            await dbQuery('UPDATE habits SET max_streak = ? WHERE id = ?', [currentStreak, habitId]);
        }
    }
};

const calculateStreak = (logs) => {
    if (!logs || logs.length === 0) return 0;

    // 1. Extract unique dates (YYYY-MM-DD) to simplify comparison
    const uniqueDates = [...new Set(logs.map(log => format(parseISO(log.completed_at), 'yyyy-MM-dd')))];

    // Sort descending (newest first)
    uniqueDates.sort((a, b) => new Date(b) - new Date(a));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    let streak = 0;
    let checkDateStr = todayStr;

    // 2. Determine start point
    if (uniqueDates.includes(todayStr)) {
        // Completed today, start counting from today
        checkDateStr = todayStr;
    } else if (uniqueDates.includes(yesterdayStr)) {
        // Not completed today, but completed yesterday. Streak is still active.
        checkDateStr = yesterdayStr;
    } else {
        // Missed yesterday and today -> Streak broken
        return 0;
    }

    // 3. Count backwards
    // We loop as long as we find the 'checkDateStr' in our logs
    while (uniqueDates.includes(checkDateStr)) {
        streak++;
        // Move to previous day
        checkDateStr = format(subDays(parseISO(checkDateStr), 1), 'yyyy-MM-dd');
    }

    return streak;
};
