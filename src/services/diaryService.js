import { v4 as uuidv4 } from 'uuid';

const db = window.electronAPI;

// LocalStorage Fallback Helper
const getLocalEntries = () => {
    const entries = localStorage.getItem('diary_entries');
    return entries ? JSON.parse(entries) : [];
};

const saveLocalEntries = (entries) => {
    localStorage.setItem('diary_entries', JSON.stringify(entries));
};

export const diaryService = {
    getAll: async () => {
        if (db) {
            return await db.dbQuery('SELECT * FROM diary_entries ORDER BY created_at DESC');
        } else {
            const entries = getLocalEntries();
            return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    },

    search: async (query) => {
        if (db) {
            return await db.dbQuery(`
        SELECT * FROM diary_entries 
        WHERE title LIKE ? OR content LIKE ? 
        ORDER BY created_at DESC
      `, [`%${query}%`, `%${query}%`]);
        } else {
            const entries = getLocalEntries();
            const lowerQuery = query.toLowerCase();
            return entries.filter(entry =>
                (entry.title && entry.title.toLowerCase().includes(lowerQuery)) ||
                (entry.content && entry.content.toLowerCase().includes(lowerQuery))
            ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
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

        if (db) {
            const sql = `
        INSERT INTO diary_entries (id, title, content, mood, attachments, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            await db.dbQuery(sql, [
                newEntry.id, newEntry.title, newEntry.content, newEntry.mood,
                newEntry.attachments, newEntry.created_at, newEntry.updated_at
            ]);
        } else {
            const entries = getLocalEntries();
            entries.push(newEntry);
            saveLocalEntries(entries);
        }

        return newEntry;
    },

    update: async (id, updates) => {
        if (updates.attachments && typeof updates.attachments !== 'string') {
            updates.attachments = JSON.stringify(updates.attachments);
        }

        if (db) {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), new Date().toISOString(), id];
            const sql = `UPDATE diary_entries SET ${fields}, updated_at = ? WHERE id = ?`;
            await db.dbQuery(sql, values);
        } else {
            const entries = getLocalEntries();
            const index = entries.findIndex(e => e.id === id);
            if (index !== -1) {
                entries[index] = { ...entries[index], ...updates, updated_at: new Date().toISOString() };
                saveLocalEntries(entries);
            }
        }
        return { id, ...updates };
    },

    delete: async (id) => {
        if (db) {
            await db.dbQuery('DELETE FROM diary_entries WHERE id = ?', [id]);
        } else {
            const entries = getLocalEntries();
            const filtered = entries.filter(e => e.id !== id);
            saveLocalEntries(filtered);
        }
        return { success: true };
    }
};
