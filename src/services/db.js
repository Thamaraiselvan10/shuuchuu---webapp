/**
 * Browser-compatible Database Manager using sql.js
 * Replaces the Electron-based database.cjs with an in-browser SQLite database.
 * Data is persisted to IndexedDB so it survives page refreshes.
 */

const DB_NAME = 'shuuchuu_db';
const DB_STORE = 'sqlitedb';
const DB_KEY = 'main';

let db = null;
let initPromise = null;

// ─── IndexedDB Helpers ───────────────────────────────────────────

function openIDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(DB_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIDB() {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const request = store.get(DB_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function saveToIDB(data) {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const request = store.put(data, DB_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ─── Database Initialization ─────────────────────────────────────

async function initDB() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // Dynamically import sql.js
        const initSqlJs = (await import('sql.js')).default;

        // Initialize sql.js with local WASM file (copied to public/ directory)
        const SQL = await initSqlJs({
            locateFile: (file) => `/${file}`,
        });

        // Try to load existing database from IndexedDB
        const savedData = await loadFromIDB();

        if (savedData) {
            db = new SQL.Database(new Uint8Array(savedData));
            console.log('[DB] Loaded existing database from IndexedDB');
        } else {
            db = new SQL.Database();
            console.log('[DB] Created new database');
        }

        // Create tables (IF NOT EXISTS, so safe to run always)
        createTables();
        migrate();
        await persist();

        return true;
    })();

    return initPromise;
}

// ─── Schema ──────────────────────────────────────────────────────

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            priority INTEGER DEFAULT 0,
            is_today_focus INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            due_at TEXT,
            estimated_minutes INTEGER,
            is_recurring INTEGER DEFAULT 0,
            recurrence_rule TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS subtasks (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            title TEXT NOT NULL,
            is_done INTEGER DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        );

        CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            start_at TEXT,
            end_at TEXT,
            duration_minutes INTEGER,
            interrupted INTEGER DEFAULT 0,
            type TEXT DEFAULT 'focus'
        );

        CREATE TABLE IF NOT EXISTS alarms (
            id TEXT PRIMARY KEY,
            label TEXT,
            time TEXT,
            recurrence TEXT,
            enabled INTEGER DEFAULT 1,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS diary_entries (
            id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            mood TEXT,
            attachments TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            priority INTEGER DEFAULT 0,
            deadline TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS goal_phases (
            id TEXT PRIMARY KEY,
            goal_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            start_date TEXT,
            deadline TEXT,
            status TEXT DEFAULT 'pending',
            order_index INTEGER,
            is_completed INTEGER DEFAULT 0,
            completion_comment TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT,
            max_streak INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS habit_logs (
            id TEXT PRIMARY KEY,
            habit_id TEXT,
            completed_at TEXT,
            FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            created_at TEXT,
            updated_at TEXT
        );
    `);
}

function migrate() {
    // Safe migration: try to add columns, ignore errors if they already exist
    const migrations = [
        'ALTER TABLE goal_phases ADD COLUMN description TEXT',
        'ALTER TABLE goal_phases ADD COLUMN start_date TEXT',
        'ALTER TABLE goal_phases ADD COLUMN status TEXT DEFAULT "pending"',
        'ALTER TABLE goal_phases ADD COLUMN completion_comment TEXT',
        'ALTER TABLE goal_phases ADD COLUMN created_at TEXT',
        'ALTER TABLE goal_phases ADD COLUMN updated_at TEXT',
        'ALTER TABLE tasks ADD COLUMN is_today_focus INTEGER DEFAULT 0',
        'ALTER TABLE diary_entries ADD COLUMN attachments TEXT',
        'ALTER TABLE habits ADD COLUMN max_streak INTEGER DEFAULT 0',
    ];

    for (const sql of migrations) {
        try {
            db.run(sql);
        } catch (e) {
            // Column likely already exists — ignore
        }
    }
}

// ─── Persistence ─────────────────────────────────────────────────

async function persist() {
    if (!db) return;
    const data = db.export();
    await saveToIDB(data);
}

// Debounced persist to avoid too-frequent IndexedDB writes
let persistTimeout = null;
function debouncedPersist() {
    if (persistTimeout) clearTimeout(persistTimeout);
    persistTimeout = setTimeout(() => persist(), 300);
}

// ─── Query Interface ─────────────────────────────────────────────

/**
 * Execute a SQL query. Returns rows for SELECT, or { success: true } for others.
 * Matches the interface of the old Electron dbManager.query()
 */
async function dbQuery(sql, params = []) {
    if (!db) {
        if (initPromise) {
            await initPromise;
        } else {
            throw new Error('Database not initialized. Call initDB() first.');
        }
    }

    const trimmed = sql.trim().toLowerCase();

    if (trimmed.startsWith('select')) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } else {
        db.run(sql, params);
        debouncedPersist();
        return { success: true };
    }
}

// ─── Export / Import for Settings page ───────────────────────────

async function exportToJson() {
    const tables = ['tasks', 'subtasks', 'pomodoro_sessions', 'goals', 'goal_phases', 'habits', 'habit_logs', 'notes', 'diary_entries', 'alarms'];
    const data = {};

    for (const table of tables) {
        try {
            data[table] = await dbQuery(`SELECT * FROM ${table}`);
        } catch (e) {
            console.warn(`Could not export table ${table}:`, e);
        }
    }

    return data;
}

async function importFromJson(data) {
    const tables = Object.keys(data);

    for (const table of tables) {
        const rows = data[table];
        if (!rows || rows.length === 0) continue;

        db.run(`DELETE FROM ${table}`);

        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const sql = `INSERT INTO ${table}(${columns.join(',')}) VALUES(${placeholders})`;

        rows.forEach(row => {
            db.run(sql, Object.values(row));
        });
    }

    await persist();
    return { success: true };
}

// ─── Public API ──────────────────────────────────────────────────

export { initDB, dbQuery, exportToJson, importFromJson, persist };
