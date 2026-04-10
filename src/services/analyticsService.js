import { dbQuery } from './db';

export const analyticsService = {
    getSummaryStats: async () => {
        const today = new Date().toISOString().split('T')[0];

        const tasksPending = await dbQuery("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'");
        const tasksCompletedToday = await dbQuery(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND date(updated_at) = date('${today}')`);
        const sessionsToday = await dbQuery(`SELECT COUNT(*) as count FROM pomodoro_sessions WHERE date(start_at) = date('${today}')`);
        const focusMinutesToday = await dbQuery(`SELECT SUM(duration_minutes) as total FROM pomodoro_sessions WHERE date(start_at) = date('${today}')`);

        return {
            tasksPending: tasksPending[0].count,
            tasksCompletedToday: tasksCompletedToday[0].count,
            sessionsToday: sessionsToday[0].count,
            focusMinutesToday: focusMinutesToday[0].total || 0
        };
    },

    getFocusHistory: async () => {
        // Last 7 days
        const result = await dbQuery(`
      SELECT date(start_at) as date, SUM(duration_minutes) as minutes 
      FROM pomodoro_sessions 
      WHERE start_at >= date('now', '-7 days') 
      GROUP BY date(start_at) 
      ORDER BY date(start_at) ASC
    `);
        return result;
    },

    getTaskCompletionHistory: async () => {
        // Last 7 days
        const result = await dbQuery(`
      SELECT date(updated_at) as date, COUNT(*) as count 
      FROM tasks 
      WHERE status = 'completed' AND updated_at >= date('now', '-7 days') 
      GROUP BY date(updated_at) 
      ORDER BY date(updated_at) ASC
    `);
        return result;
    },

    getCategoryDistribution: async () => {
        const result = await dbQuery(`
      SELECT category, COUNT(*) as count 
      FROM tasks 
      WHERE status = 'pending' 
      GROUP BY category
    `);
        return result;
    }
};
