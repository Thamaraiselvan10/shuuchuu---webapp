import { v4 as uuidv4 } from 'uuid';

const dbQuery = async (sql, params = []) => {
    if (window.electronAPI) {
        return await window.electronAPI.dbQuery(sql, params);
    }
    return [];
};

export const noteService = {
    getAll: async () => {
        return await dbQuery('SELECT * FROM notes ORDER BY updated_at DESC');
    },

    create: async (note) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        await dbQuery(
            'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [id, note.title, note.content, now, now]
        );
        return id;
    },

    update: async (id, note) => {
        const now = new Date().toISOString();
        await dbQuery(
            'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?',
            [note.title, note.content, now, id]
        );
    },

    delete: async (id) => {
        await dbQuery('DELETE FROM notes WHERE id = ?', [id]);
    }
};
