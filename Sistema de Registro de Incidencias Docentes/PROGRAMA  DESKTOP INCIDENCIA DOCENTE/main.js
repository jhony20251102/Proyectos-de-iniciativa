const { app, BrowserWindow, Tray, Menu, screen, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

// Usamos un directorio compartido en ProgramData para que la config sea global para todos los usuarios
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
  // Intentar leer de userData primero (donde se guarda el cambio del usuario)
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      return config.supportURL || config.url || '';
    } catch (err) {
      console.error("Error reading config:", err);
    }
  }

  // Fallback a config.json local (útil para pre-configurar el instalador)
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

  // CREAMOS UNA VENTANA PADRE "FANTASMA" ANCLADA AL ESCRITORIO
  // Esto es un truco avanzado para Windows 10: las ventanas hijas de una ventana 'desktop'
  // heredan la inmunidad al comando Win+D y se quedan pegadas al fondo.
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
    alwaysOnTop: false, // Importante: False para que Chrome lo tape
    parent: parentWin,  // Clave: Ser hijo de la ventana desktop
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // --- SCRIPT DE AUTO-APERTURA (WIN+D) ---

  // Este script vigila la ventana cada 100ms. Si se minimiza o esconde por Windows,
  // la vuelve a abrir automáticamente en el fondo del escritorio.
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Si la ventana no es visible o fue minimizada por el sistema
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
        mainWindow.restore();
        mainWindow.showInactive();

        // Refuerzo: Lo anclamos al nivel de fondo de pantalla para que no tape a Chrome/Word
        mainWindow.setAlwaysOnTop(true, 'desktop');
      }
    }
  }, 100);

  // --- BLOQUEADOR DE COMANDOS DE MINIMIZAR ---
  if (process.platform === 'win32') {
    mainWindow.hookWindowMessage(0x0112, (wParam) => {
      const command = wParam.readUInt32LE(0) & 0xFFF0;
      // 0xF020 = SC_MINIMIZE, 0xF030 = SC_MAXIMIZE
      if (command === 0xF020 || command === 0xF030) {
        return true; // Bloquea físicamente la orden de Windows
      }
    });
  }

  // Evitar cierre accidental
  mainWindow.on('close', (e) => e.preventDefault());
  // Asegurar visibilidad en todos los espacios
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

const ADMIN_PASSWORD = '..studioworks';

// IPC para verificar contraseña
ipcMain.handle('check-password', async (event, password) => {
  return password === ADMIN_PASSWORD;
});

function showUrlPrompt() {
  const urlWindow = new BrowserWindow({
    width: 750, // Aumentado para una vista más imponente
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

  // Escuchar redimensionamiento dinámico
  ipcMain.on('resize-window', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setSize(width, height);
      win.center(); // Re-centramos al agrandar
    }
  });

  // Enviamos la URL actual cuando cargue
  urlWindow.webContents.on('did-finish-load', () => {
    urlWindow.webContents.send('set-url', readConfig());
  });
}

app.whenReady().then(() => {
  createMainWindow();

  // Tray icon
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
        showUrlPrompt(); // Obligamos a pasar por la validación de password
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Verificar URL al inicio
  let supportURL = readConfig();

  mainWindow.webContents.on('did-finish-load', () => {
    if (supportURL) {
      mainWindow.webContents.send('set-url', supportURL);
    }
  });

  // IPC para obtener la URL bajo demanda
  ipcMain.handle('get-support-url', async () => {
    return readConfig();
  });

  if (!supportURL) {
    setTimeout(showUrlPrompt, 1500);
  }
});

// IPC para recibir la URL
ipcMain.on('save-url', (event, url) => {
  writeConfig(url);
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('set-url', url);
    }
  });
});

// IPC para abrir enlaces externos de forma segura
ipcMain.on('open-external', (event, url) => {
  if (url) {
    shell.openExternal(url);
  }
});

// IPC para cerrar la aplicación (solo después de validar pass en el front)
ipcMain.on('quit-app', () => {
  if (mainWindow) mainWindow.destroy();
  app.quit();
});
