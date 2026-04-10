import { v4 as uuidv4 } from 'uuid';
import { dbQuery } from './db';

export const diaryService = {
    getAll: async () => {
        return await dbQuery('SELECT * FROM diary_entries ORDER BY created_at DESC');
    },

    search: async (query) => {
        return await dbQuery(`
        SELECT * FROM diary_entries 
        WHERE title LIKE ? OR content LIKE ? 
        ORDER BY created_at DESC
      `, [`%${query}%`, `%${query}%`]);
    },

    create: async (entry) => {
        const newEntry = {
            id: uuidv4(),
            title: entry.title,
            content: entry.content,
            mood: entry.mood || 'neutral',
            attachments: JSON.stringify(entry.attachments || []),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const sql = `
        INSERT INTO diary_entries (id, title, content, mood, attachments, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        await dbQuery(sql, [
            newEntry.id, newEntry.title, newEntry.content, newEntry.mood,
            newEntry.attachments, newEntry.created_at, newEntry.updated_at
        ]);

        return newEntry;
    },

    update: async (id, updates) => {
        if (updates.attachments && typeof updates.attachments !== 'string') {
            updates.attachments = JSON.stringify(updates.attachments);
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), id];
        const sql = `UPDATE diary_entries SET ${fields}, updated_at = ? WHERE id = ?`;
        await dbQuery(sql, values);
        return { id, ...updates };
    },

    delete: async (id) => {
        await dbQuery('DELETE FROM diary_entries WHERE id = ?', [id]);
        return { success: true };
    }
};
