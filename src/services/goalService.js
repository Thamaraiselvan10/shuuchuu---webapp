import { v4 as uuidv4 } from 'uuid';

const db = window.electronAPI;

export const goalService = {
    // Goals
    getAllGoals: async () => {
        const sql = `
            SELECT 
                g.*,
                (SELECT COUNT(*) FROM goal_phases WHERE goal_id = g.id) as total_phases,
                (SELECT COUNT(*) FROM goal_phases WHERE goal_id = g.id AND status = 'completed') as completed_phases
            FROM goals g
            ORDER BY g.created_at DESC
        `;
        return await db.dbQuery(sql);
    },

    createGoal: async (goal) => {
        const newGoal = {
            id: uuidv4(),
            title: goal.title,
            description: goal.description || '',
            deadline: goal.deadline || null,
            category: goal.category || 'Personal',
            priority: goal.priority || 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const sql = `
            INSERT INTO goals (id, title, description, deadline, category, priority, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.dbQuery(sql, [
            newGoal.id, newGoal.title, newGoal.description, newGoal.deadline,
            newGoal.category, newGoal.priority, newGoal.status,
            newGoal.created_at, newGoal.updated_at
        ]);

        return newGoal;
    },

    updateGoal: async (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), id];

        const sql = `UPDATE goals SET ${fields}, updated_at = ? WHERE id = ?`;
        await db.dbQuery(sql, values);
        return { id, ...updates };
    },

    deleteGoal: async (id) => {
        await db.dbQuery('DELETE FROM goals WHERE id = ?', [id]);
        return { success: true };
    },

    // Phases
    getPhasesByGoalId: async (goalId) => {
        return await db.dbQuery('SELECT * FROM goal_phases WHERE goal_id = ? ORDER BY order_index ASC', [goalId]);
    },

    createPhase: async (phase) => {
        const newPhase = {
            id: uuidv4(),
            goal_id: phase.goal_id,
            title: phase.title,
            description: phase.description || '',
            start_date: phase.start_date || null,
            deadline: phase.deadline || null,
            status: 'pending',
            order_index: phase.order_index || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const sql = `
            INSERT INTO goal_phases (id, goal_id, title, description, start_date, deadline, status, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.dbQuery(sql, [
            newPhase.id, newPhase.goal_id, newPhase.title, newPhase.description,
            newPhase.start_date, newPhase.deadline, newPhase.status,
            newPhase.order_index, newPhase.created_at, newPhase.updated_at
        ]);

        return newPhase;
    },

    updatePhase: async (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), id];

        const sql = `UPDATE goal_phases SET ${fields}, updated_at = ? WHERE id = ?`;
        await db.dbQuery(sql, values);
        return { id, ...updates };
    },

    deletePhase: async (id) => {
        await db.dbQuery('DELETE FROM goal_phases WHERE id = ?', [id]);
        return { success: true };
    }
};
