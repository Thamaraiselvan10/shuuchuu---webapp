import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, Notification, shell } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import dbManager from './database.cjs'; // Keep CJS for these if they use require
import alarmService from './alarmService.cjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbManagerCJS = dbManager;
let alarmServiceCJS = alarmService;

// Adjust for CJS/ESM interop if default import fails
if (dbManager.default) dbManagerCJS = dbManager.default;
if (alarmService.default) alarmServiceCJS = alarmService.default;

// Mini Mode State
let isMiniMode = false;
let previousBounds = { width: 1200, height: 800, x: undefined, y: undefined };

let mainWindow;

function toggleMiniMode(shouldEnter) {
    if (!mainWindow) return;

    if (shouldEnter) {
        if (!isMiniMode) {
            // Save state if normal
            if (!mainWindow.isMinimized()) {
                previousBounds = mainWindow.getBounds();
            }

            isMiniMode = true;

            // Ensure window is ready for resizing
            if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            if (mainWindow.isMinimized()) mainWindow.restore();

            // Apply Mini Mode settings
            mainWindow.setMinimumSize(300, 350);
            mainWindow.setMaximumSize(300, 350); // Lock max size
            mainWindow.setSize(300, 350);
            mainWindow.setResizable(false); // Disable manual resizing
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
            mainWindow.setMaximizable(false);
            mainWindow.setFullScreenable(false);

            mainWindow.webContents.send('mini-mode-change', true);
        }
    } else {
        if (isMiniMode) {
            isMiniMode = false;

            // Restore Normal Mode settings
            mainWindow.setMaximumSize(9999, 9999); // Unset max size
            mainWindow.setMinimumSize(800, 600);
            mainWindow.setResizable(true);
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setMaximizable(true);
            mainWindow.setFullScreenable(true);

            // 1. Force a standard size first to reset internal window constraints
            mainWindow.setSize(1200, 800);
            mainWindow.center();

            // 2. Then maximize to ensure full desktop coverage
            mainWindow.maximize();

            mainWindow.webContents.send('mini-mode-change', false);
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.setMenu(null);
    mainWindow.maximize();

    const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Fix path for production loading
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Native Minimize Interception
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        if (!isMiniMode) {
            toggleMiniMode(true);
        }
    });
}

// IPC Handlers using the helper
ipcMain.handle('mini-mode-toggle', (event, shouldEnter) => {
    toggleMiniMode(shouldEnter);
});

ipcMain.handle('toggle-always-on-top', (event, shouldBeOnTop) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(shouldBeOnTop, 'screen-saver');
    }
});

console.time('Startup Duration');
app.whenReady().then(async () => {
    console.time('Create Window');
    createWindow();
    console.timeEnd('Create Window');

    console.time('DB Init');
    // Using CJS require for these modules as they are still CJS
    // Re-requiring purely to ensure instance consistency if needed, but imported instances above work
    await dbManagerCJS.init();
    console.timeEnd('DB Init');

    console.time('Alarm Service Start');
    alarmServiceCJS.start();
    console.timeEnd('Alarm Service Start');

    // Listen for alarms from the service
    alarmServiceCJS.on('alarm-triggered', (alarm) => {
        if (mainWindow) {
            mainWindow.webContents.send('alarm-triggered', alarm);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    console.timeEnd('Startup Duration');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('db-query', (event, sql, params) => {
    return dbManagerCJS.query(sql, params);
});

ipcMain.handle('db-backup', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Database',
        defaultPath: 'focus-bro-backup.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        return dbManagerCJS.exportToJson(filePath);
    }
    return null;
});

ipcMain.handle('db-restore', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Restore Database',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        return dbManagerCJS.importFromJson(filePaths[0]);
    }
    return null;
});

// Alarm IPC
ipcMain.handle('alarm-create', (event, alarm) => alarmServiceCJS.createAlarm(alarm));
ipcMain.handle('alarm-get', () => alarmServiceCJS.getAlarms());
ipcMain.handle('alarm-delete', (event, id) => alarmServiceCJS.deleteAlarm(id));
ipcMain.handle('alarm-toggle', (event, { id, enabled }) => alarmServiceCJS.toggleAlarm(id, enabled));

// Notification IPC
ipcMain.handle('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
});
