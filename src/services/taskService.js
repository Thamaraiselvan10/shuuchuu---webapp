import { v4 as uuidv4 } from 'uuid';

const db = window.electronAPI;

export const taskService = {
    getAll: async () => {
        return await db.dbQuery('SELECT * FROM tasks ORDER BY created_at DESC');
    },

    create: async (task) => {
        const newTask = {
            id: uuidv4(),
            title: task.title,
            description: task.description || '',
            category: task.category || 'General',
            priority: task.priority || 0,
            is_today_focus: task.is_today_focus ? 1 : 0,
            status: 'pending',
            due_at: task.due_at || null,
            estimated_minutes: task.estimated_minutes || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const sql = `
      INSERT INTO tasks (id, title, description, category, priority, is_today_focus, status, due_at, estimated_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        await db.dbQuery(sql, [
            newTask.id, newTask.title, newTask.description, newTask.category, newTask.priority, newTask.is_today_focus,
            newTask.status, newTask.due_at, newTask.estimated_minutes, newTask.created_at, newTask.updated_at
        ]);

        return newTask;
    },

    update: async (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), id];

        const sql = `UPDATE tasks SET ${fields}, updated_at = ? WHERE id = ?`;
        await db.dbQuery(sql, values);
        return { id, ...updates };
    },

    delete: async (id) => {
        await db.dbQuery('DELETE FROM tasks WHERE id = ?', [id]);
        return { success: true };
    },

    toggleStatus: async (id, currentStatus) => {
        // 3-state cycle: pending -> progress -> completed -> pending
        let newStatus;
        if (currentStatus === 'pending') {
            newStatus = 'progress';
        } else if (currentStatus === 'progress') {
            newStatus = 'completed';
        } else {
            newStatus = 'pending';
        }
        await db.dbQuery('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [newStatus, new Date().toISOString(), id]);
        return newStatus;
    },

    // Direct status update for Kanban drag-and-drop style operations
    updateStatus: async (id, newStatus) => {
        await db.dbQuery('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [newStatus, new Date().toISOString(), id]);
        return newStatus;
    },

    // Update priority for priority column moves
    updatePriority: async (id, newPriority) => {
        await db.dbQuery('UPDATE tasks SET priority = ?, updated_at = ? WHERE id = ?', [newPriority, new Date().toISOString(), id]);
        return newPriority;
    }
};
