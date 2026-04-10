/**
 * Browser-based Alarm Service
 * Replaces the Electron IPC-based alarm system with a browser-compatible one
 * using the sql.js database for storage and setInterval for checking.
 */
import { v4 as uuidv4 } from 'uuid';
import { dbQuery } from './db';

let alarmCheckInterval = null;
let alarmCallbacks = [];

export const alarmService = {
    getAlarms: async () => {
        return await dbQuery('SELECT * FROM alarms ORDER BY time ASC');
    },

    createAlarm: async (alarm) => {
        const newAlarm = {
            id: alarm.id || uuidv4(),
            label: alarm.label || '',
            time: alarm.time,
            recurrence: alarm.recurrence || 'daily',
            enabled: alarm.enabled ? 1 : 0,
            created_at: new Date().toISOString()
        };

        await dbQuery(
            'INSERT INTO alarms (id, label, time, recurrence, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [newAlarm.id, newAlarm.label, newAlarm.time, newAlarm.recurrence, newAlarm.enabled, newAlarm.created_at]
        );

        return newAlarm;
    },

    deleteAlarm: async (id) => {
        await dbQuery('DELETE FROM alarms WHERE id = ?', [id]);
    },

    toggleAlarm: async (id, enabled) => {
        await dbQuery('UPDATE alarms SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
    },

    // Register a callback for when alarms trigger
    onAlarmTriggered: (callback) => {
        alarmCallbacks.push(callback);
    },

    // Start checking alarms every 30 seconds
    startChecking: () => {
        if (alarmCheckInterval) return;

        const lastTriggered = {};

        alarmCheckInterval = setInterval(async () => {
            try {
                const alarms = await dbQuery('SELECT * FROM alarms WHERE enabled = 1');
                const now = new Date();
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                for (const alarm of alarms) {
                    if (alarm.time === currentTime) {
                        const todayKey = `${alarm.id}-${now.toDateString()}`;
                        if (!lastTriggered[todayKey]) {
                            lastTriggered[todayKey] = true;
                            alarmCallbacks.forEach(cb => cb(alarm));
                        }
                    }
                }
            } catch (e) {
                // DB may not be ready yet, silently ignore
            }
        }, 30000); // Check every 30 seconds
    },

    stopChecking: () => {
        if (alarmCheckInterval) {
            clearInterval(alarmCheckInterval);
            alarmCheckInterval = null;
        }
    }
};

export default alarmService;
