const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    resizable: true,
    title: 'ProjectX — AI-Powered Student Team Formation',
    backgroundColor: '#0b0f19',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Gracefully show window once ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load dev server or production build
  if (isDev) {
    loadDevServerWithRetry(mainWindow, DEV_URL);
  } else {
    const prodPath = path.join(__dirname, '../apps/web/dist/index.html');
    mainWindow.loadFile(prodPath).catch((err) => {
      console.error('Failed to load production build:', err);
    });
  }

  // Open external links (GitHub, LinkedIn, Portfolios) in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // If navigation is to external domain, open externally
    if (!url.startsWith(DEV_URL) && !url.startsWith('file:') && !url.includes('localhost:5173')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadDevServerWithRetry(window, url, retries = 10, delay = 1000) {
  window.loadURL(url).catch((err) => {
    if (retries > 0) {
      console.log(`[Electron] Waiting for Vite dev server at ${url}... (${retries} attempts left)`);
      setTimeout(() => {
        if (!window.isDestroyed()) {
          loadDevServerWithRetry(window, url, retries - 1, delay);
        }
      }, delay);
    } else {
      console.error(`[Electron] Could not connect to dev server at ${url}:`, err);
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
