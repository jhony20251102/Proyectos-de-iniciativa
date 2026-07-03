require('dotenv').config();
const { app, BrowserWindow, Tray, Menu, screen, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

const sharedConfigDir = process.env.ProgramData ? path.join(process.env.ProgramData, 'SoporteTI') : app.getPath('userData');
if (!fs.existsSync(sharedConfigDir)) {
  try {
    fs.mkdirSync(sharedConfigDir, { recursive: true });
  } catch (e) {
    console.error("Error creating config directory:", e);
  }
}
const configPath = path.join(sharedConfigDir, 'config.json');
const localConfigPath = path.join(__dirname, 'config.json');

function readConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      return config.supportURL || config.url || '';
    } catch (err) {
      console.error("Error reading config:", err);
    }
  }

  if (fs.existsSync(localConfigPath)) {
    try {
      const data = fs.readFileSync(localConfigPath, 'utf8');
      const config = JSON.parse(data);
      return config.supportURL || config.url || '';
    } catch (err) {
      console.error("Error reading local config:", err);
    }
  }
  return '';
}

function writeConfig(url) {
  const config = { supportURL: url };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const parentWin = new BrowserWindow({
    show: false,
    type: 'desktop',
    webPreferences: { nodeIntegration: false }
  });

  mainWindow = new BrowserWindow({
    width: 200,
    height: 110,
    x: width - 210,
    y: height - 120,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    closable: false,
    minimizable: false,
    maximizable: false,
    focusable: false,
    alwaysOnTop: false, 
    parent: parentWin,  
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
        mainWindow.restore();
        mainWindow.showInactive();

        mainWindow.setAlwaysOnTop(true, 'desktop');
      }
    }
  }, 100);

  if (process.platform === 'win32') {
    mainWindow.hookWindowMessage(0x0112, (wParam) => {
      const command = wParam.readUInt32LE(0) & 0xFFF0;
      if (command === 0xF020 || command === 0xF030) {
        return true; 
      }
    });
  }

  mainWindow.on('close', (e) => e.preventDefault());
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

ipcMain.handle('check-password', async (event, password) => {
  return password === ADMIN_PASSWORD;
});

function showUrlPrompt() {
  const urlWindow = new BrowserWindow({
    width: 750, 
    height: 750,
    frame: true,
    alwaysOnTop: true,
    center: true,
    title: "Administración - Soporte TI",
    resizable: true,
    minWidth: 700,
    minHeight: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  urlWindow.loadFile('urlPrompt.html');
  urlWindow.setMenuBarVisibility(false);

  ipcMain.on('resize-window', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setSize(width, height);
      win.center(); 
    }
  });

  urlWindow.webContents.on('did-finish-load', () => {
    urlWindow.webContents.send('set-url', readConfig());
  });
}

app.whenReady().then(() => {
  createMainWindow();

  const iconPath = path.join(__dirname, 'logo.png');
  tray = new Tray(iconPath);
  tray.setToolTip("Soporte TI Certus");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir Soporte", click: () => {
        let url = readConfig();
        if (url) shell.openExternal(url);
      }
    },
    { type: 'separator' },
    {
      label: "Configurar URL / Administrar", click: () => {
        showUrlPrompt();
      }
    },
    {
      label: "Mostrar en Escritorio", click: () => {
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: "Cerrar Aplicación (T.I.)", click: () => {
        showUrlPrompt(); 
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  let supportURL = readConfig();

  mainWindow.webContents.on('did-finish-load', () => {
    if (supportURL) {
      mainWindow.webContents.send('set-url', supportURL);
    }
  });

  ipcMain.handle('get-support-url', async () => {
    return readConfig();
  });

  if (!supportURL) {
    setTimeout(showUrlPrompt, 1500);
  }
});

ipcMain.on('save-url', (event, url) => {
  writeConfig(url);
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('set-url', url);
    }
  });
});

ipcMain.on('open-external', (event, url) => {
  if (url) {
    shell.openExternal(url);
  }
});

ipcMain.on('quit-app', () => {
  if (mainWindow) mainWindow.destroy();
  app.quit();
});
