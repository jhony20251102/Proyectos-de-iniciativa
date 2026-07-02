const { app, BrowserWindow, Tray, Menu, ipcMain, desktopCapturer } = require('electron');
const { io } = require('socket.io-client');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


let previousCpuInfo = getCpuInfo();

function getCpuInfo() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (let cpu in cpus) {
    if (!cpus.hasOwnProperty(cpu)) continue;
    for (let type in cpus[cpu].times) {
      total += cpus[cpu].times[type];
    }
    idle += cpus[cpu].times.idle;
  }
  return { idle, total };
}

let currentRealCpuLoad = null;
let currentWifiSignal = 100;

const psCpu = require('child_process').spawn('powershell', ['-NoProfile', '-Command', 'while($true) { Get-CimInstance Win32_PerfFormattedData_Counters_ProcessorInformation | Where-Object Name -eq "_Total" | Select-Object -ExpandProperty PercentProcessorUtility; Start-Sleep -Seconds 2 }']);

psCpu.stdout.on('data', (data) => {
   const val = parseInt(data.toString().trim(), 10);
   if (!isNaN(val)) {
     currentRealCpuLoad = val;
   }
});

setInterval(() => {
  if (getConnectionType() === 'wifi') {
    exec('netsh wlan show interfaces', (err, stdout) => {
      if (!err && stdout) {
        const match = stdout.match(/(?:Señal|Signal)\s*:\s*(\d+)%/i);
        if (match) {
          currentWifiSignal = parseInt(match[1], 10);
        }
      }
    });
  }
}, 10000);

function getCpuLoad() {
  if (currentRealCpuLoad !== null) return currentRealCpuLoad;
  const currentCpuInfo = getCpuInfo();
  const idleDiff = currentCpuInfo.idle - previousCpuInfo.idle;
  const totalDiff = currentCpuInfo.total - previousCpuInfo.total;
  previousCpuInfo = currentCpuInfo;
  if (totalDiff === 0) return 0;
  return 100 - ~~(100 * idleDiff / totalDiff);
}

function getRamLoad() {
  return Math.round((1 - os.freemem() / os.totalmem()) * 100);
}

function getActiveUser() {
  try {
    const username = os.userInfo().username;
    
    return username.includes('\\') ? username.split('\\')[1] : username;
  } catch (e) {
    return 'Desconocido';
  }
}


const runPowerShell = (cmd, callback) => {
  const tmpFile = path.join(os.tmpdir(), `ice_cmd_${crypto.randomBytes(4).toString('hex')}.ps1`);
  fs.writeFileSync(tmpFile, cmd, { encoding: 'utf8' });
  exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, (err, stdout, stderr) => {
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    callback(err, stdout, stderr);
  });
};

require('dotenv').config({ path: path.join(__dirname, '.env') });

let tray = null;
let window = null;
let socket = null;


const configPath = path.join(app.getPath('userData'), 'config.json');
let clientId = 'unknown';
const frozenFlagPath = path.join('C:', 'ProgramData', 'ICE_FROZEN_STATE.txt');
let SERVER_URL = process.env.SERVER_URL || 'https://ice-backend-dkrm.onrender.com';

let persistedFrozen = false;
if (fs.existsSync(frozenFlagPath)) {
  try {
    const flag = fs.readFileSync(frozenFlagPath, 'utf8').trim();
    persistedFrozen = flag.toLowerCase() === 'true';
  } catch(e) {}
}

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.id) clientId = config.id;
    if (config.serverUrl) SERVER_URL = config.serverUrl;
    
    if (typeof config.isFrozen === 'boolean') persistedFrozen = config.isFrozen;
  } catch(e) {}
}

runPowerShell('Enable-ComputerRestore -Drive "C:"', (err) => {
  if (err) {
    console.error('Failed to enable System Restore on C:, it may already be enabled or the feature is unavailable.', err);
  } else {
    console.log('System Restore enabled on C:');
  }
});

const getMacAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  return 'unknown-' + Math.random().toString(36).substr(2, 9);
};

const getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const getConnectionType = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('wireless')) {
          return 'wifi';
        }
        return 'ethernet';
      }
    }
  }
  return 'unknown';
};

if (clientId === 'unknown') {
  clientId = getMacAddress();
  fs.writeFileSync(configPath, JSON.stringify({ id: clientId, serverUrl: SERVER_URL, isFrozen: false }, null, 2));
}

let extendedSystemInfo = {
  os_version: os.release(),
  mac: getMacAddress(),
  ram_total: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
  cpu_model: os.cpus()[0] ? os.cpus()[0].model : 'Unknown',
  brand: 'Unknown',
  model: 'Unknown',
  serial_number: 'Unknown',
  disk_capacity: 'Unknown',
  disk_used: 'Unknown',
  boot_time: Date.now() - (os.uptime() * 1000)
};

let clientInfo = {
  id: clientId,
  hostname: os.hostname(),
  ip: getIPAddress(),
  version: app.getVersion(),
  is_frozen: persistedFrozen,
  network_type: getConnectionType(),
  extended: extendedSystemInfo
};

const fetchExtendedInfo = () => {
  const psScript = `
    $cs = Get-CimInstance Win32_ComputerSystem
    $bios = Get-CimInstance Win32_BIOS
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $physDisk = Get-PhysicalDisk | Select-Object -First 1
    $diskType = $physDisk.MediaType
    if ([string]::IsNullOrWhiteSpace($diskType) -or $diskType -eq 'Unspecified') { $diskType = 'HDD' }
    
    $brand = $cs.Manufacturer
    $model = $cs.Model
    $serial = $bios.SerialNumber
    $diskTotal = [math]::Round($disk.Size / 1GB, 2)
    $diskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
    $diskUsed = $diskTotal - $diskFree
    $diskUsedPct = 0
    if ($diskTotal -gt 0) { $diskUsedPct = [math]::Round(($diskUsed / $diskTotal) * 100, 1) }
    
    $result = @{
      brand = $brand
      model = $model
      serial = $serial
      diskTotal = "$diskTotal GB"
      diskUsedPct = "$diskUsedPct%"
      diskType = $diskType
    }
    $result | ConvertTo-Json -Compress
  `;
  runPowerShell(psScript, (err, stdout) => {
    if (!err && stdout) {
      try {
        const data = JSON.parse(stdout);
        extendedSystemInfo.brand = data.brand || 'Unknown';
        extendedSystemInfo.model = data.model || 'Unknown';
        extendedSystemInfo.serial_number = data.serial || 'Unknown';
        extendedSystemInfo.disk_capacity = data.diskTotal;
        extendedSystemInfo.disk_used = data.diskUsedPct;
        extendedSystemInfo.disk_type = data.diskType || 'HDD';
        
        clientInfo.extended = extendedSystemInfo;
        if (socket && socket.connected) {
          socket.emit('register_client', clientInfo);
        }
      } catch (e) {}
    }
  });
};


const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    });

    createTray();
    
    
    createWindow();

    setupSocket();
    
    
    if (app.dock) app.dock.hide();

    checkRestoreStatus();
    fetchExtendedInfo();
  });

  function checkRestoreStatus() {
    const statusFilePath = path.join('C:', 'ProgramData', 'ICE_RESTORE_STATUS.txt');
    if (fs.existsSync(statusFilePath)) {
      try {
        const status = fs.readFileSync(statusFilePath, 'utf8').trim();
        if (status === 'RUNNING') {
          showLoadingWindow(statusFilePath);
        }
      } catch(e) {}
    }
  }

  function showLoadingWindow(statusFilePath) {
    let loadingWindow = new BrowserWindow({
      fullscreen: true,
      alwaysOnTop: true,
      frame: false,
      transparent: false,
      backgroundColor: '#0f172a',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    loadingWindow.loadFile('loading.html');
    loadingWindow.setAlwaysOnTop(true, 'screen-saver');

    let secondsPassed = 0;
    const interval = setInterval(() => {
      secondsPassed++;
      try {
        const status = fs.readFileSync(statusFilePath, 'utf8').trim();
        
        if (status === 'DONE' || secondsPassed > 60) {
          clearInterval(interval);
          if (loadingWindow) {
            loadingWindow.close();
            loadingWindow = null;
          }
        }
      } catch(e) {}
    }, 1000);
  }
}

function createTray() {
  const { nativeImage } = require('electron');
  const iconPath = path.join(__dirname, 'icon.ico');
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
    
  } else {
    
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  tray.setToolTip('Ice Client - Sistema de Congelamiento');
  
  tray.on('click', () => {
    toggleWindow();
  });

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir Panel', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Salir', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  tray.setContextMenu(contextMenu);
}

function toggleWindow() {
  if (!window) {
    createWindow();
  } else {
    if (window.isVisible()) {
      window.hide();
    } else {
      window.show();
      window.focus();
    }
  }
}

function createWindow() {
  window = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, 
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false
    }
  });

  window.loadFile('index.html');

  window.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      window.hide();
    }
    return false;
  });
}

function showFreezingWindow() {
  let freezeWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  freezeWindow.loadFile('freezing.html');
  freezeWindow.setAlwaysOnTop(true, 'screen-saver');
  return freezeWindow;
}

function setupSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  
  socket = io(SERVER_URL, {
    reconnectionDelayMax: 10000,
    transports: ['websocket']
  });

  let metricsInterval = null;

  socket.on('connect', () => {
    socket.emit('register_client', clientInfo);
    if(window) window.webContents.send('status', 'online');
    
    if (metricsInterval) clearInterval(metricsInterval);
    metricsInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('client_metrics', {
          id: clientId,
          cpu: getCpuLoad(),
          ram: getRamLoad(),
          user: getActiveUser(),
          uptime: os.uptime(),
          wifiSignal: currentWifiSignal
        });
      }
    }, 10000);
  });
  
  socket.on('disconnect', () => {
    if (metricsInterval) clearInterval(metricsInterval);
  });

  socket.on('execute_command', (data) => {
    if (data.command === 'shutdown') {
      if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Completado' });
      exec('shutdown -s -t 0');
    } else if (data.command === 'reboot') {
      if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Completado' });
      exec('shutdown -r -t 0');
    } else if (data.command === 'freeze') {
      showFreezingWindow();
      const taskScript = `
$statusPath = "C:\\ProgramData\\ICE_RESTORE_STATUS.txt"
Set-Content -Path $statusPath -Value "RUNNING" -Force
$logPath = "C:\\ProgramData\\ICE_FROZEN_LOG.txt"
Add-Content -Path $logPath -Value "$(Get-Date): Iniciando restauracion automatica..."

# Lógica de auto-reparación de registro para perfiles .bak (TEMP profiles)
$regPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList"
if (Test-Path $regPath) {
    $profKeys = Get-ChildItem -Path $regPath
    foreach ($prof in $profKeys) {
        if ($prof.PSChildName -match "\\.bak$") {
            $cleanLeaf = $prof.PSChildName -replace "\\.bak$", ""
            $cleanPath = Join-Path $regPath $cleanLeaf
            if (Test-Path $cleanPath) {
                Add-Content -Path $logPath -Value "Eliminando llave de perfil TEMP: $cleanPath"
                Remove-Item -Path $cleanPath -Recurse -Force
            }
            Add-Content -Path $logPath -Value "Restaurando perfil .bak: $($prof.PSChildName)"
            Rename-Item -Path $prof.PSPath -NewName $cleanLeaf -Force
            Set-ItemProperty -Path $cleanPath -Name "State" -Value 0 -Force
            Set-ItemProperty -Path $cleanPath -Name "RefCount" -Value 0 -Force
        }
    }
}

$backupRoot = "C:\\ProgramData\\ICE_PROFILE_BACKUP"
if (Test-Path $backupRoot) {
    $profiles = Get-ChildItem -Path $backupRoot -Directory
    foreach ($profile in $profiles) {
        $src = $profile.FullName
        $dst = Join-Path "C:\\Users" $profile.Name
        Add-Content -Path $logPath -Value "Restaurando perfil: $dst"
        & robocopy $src $dst /MIR /B /COPY:DATSO /XJ /R:1 /W:1 | Out-Null
    }
}
Add-Content -Path $logPath -Value "$(Get-Date): Restauracion completada con exito."

# ═══════════════════════════════════════════════════════════════
# RE-CONFIGURAR AUTO-INICIO DEL ICE CLIENT
# Después de restaurar, el auto-inicio puede haberse perdido.
# Creamos un acceso directo en la carpeta Startup de todos los
# usuarios y re-registramos la tarea programada.
# ═══════════════════════════════════════════════════════════════
$iceExePath = "C:\\Program Files\\IceClient\\iceclient.exe"
if (Test-Path $iceExePath) {
    Add-Content -Path $logPath -Value "$(Get-Date): Re-configurando auto-inicio de Ice Client..."

    # 1) Crear acceso directo en carpeta Startup de todos los usuarios
    $startupFolder = "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
    $shortcutPath = Join-Path $startupFolder "IceClient.lnk"
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = $iceExePath
        $Shortcut.WorkingDirectory = "C:\\Program Files\\IceClient"
        $Shortcut.Description = "Ice Client - Sistema de Congelamiento"
        $Shortcut.Save()
        Add-Content -Path $logPath -Value "Acceso directo creado en Startup: $shortcutPath"
    } catch {
        Add-Content -Path $logPath -Value "Error creando acceso directo: $_"
    }

    # 2) Re-registrar tarea programada (onlogon para contexto de usuario con escritorio)
    $iceTaskName = "IceClientService"
    $existingTask = Get-ScheduledTask -TaskName $iceTaskName -ErrorAction SilentlyContinue
    if (-not $existingTask) {
        try {
            schtasks /create /f /tn $iceTaskName /tr "\`"$iceExePath\`"" /sc onlogon /rl HIGHEST
            Add-Content -Path $logPath -Value "Tarea programada IceClientService re-creada."
        } catch {
            Add-Content -Path $logPath -Value "Error re-creando tarea programada: $_"
        }
    }

    Add-Content -Path $logPath -Value "$(Get-Date): Auto-inicio de Ice Client configurado."
}

Set-Content -Path $statusPath -Value "DONE" -Force
`.trim();
      const encodedScript = Buffer.from(taskScript, 'utf16le').toString('base64');
      const freezeCmd = `
$backupRoot = "C:\\ProgramData\\ICE_PROFILE_BACKUP"
if (!(Test-Path $backupRoot)) { New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null }
$exclude = @("Administrador", "Administrator", "SOPORTE", "Public", "Default", "Default User", "All Users", "desktop.ini")
$users = Get-ChildItem -Path "C:\\Users" -Directory | Where-Object { $exclude -notcontains $_.Name }
foreach ($u in $users) {
    $src = $u.FullName
    $dst = Join-Path $backupRoot $u.Name
    & robocopy $src $dst /MIR /B /COPY:DATSO /XJ /R:1 /W:1 | Out-Null
}
$taskName = "ICE_Profile_Restore"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand ${encodedScript}"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Checkpoint-Computer -Description 'ICE Freeze' -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue
exit 0
`;
      
      runPowerShell(freezeCmd, (err) => {
            if (!err) {
              clientInfo.is_frozen = true;
              
              try {
                const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                cfg.isFrozen = true;
                fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
              } catch(e) {}
              
              try { fs.writeFileSync(frozenFlagPath, 'true', { encoding: 'utf8' }); } catch(e) {}
              socket.emit('register_client', clientInfo);
              if (window) window.webContents.send('frozen_state', true);
              
              if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Completado' });
              exec('shutdown -r -t 0');
            } else {
              console.error('Error creating freeze point:', err);
              if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Fallido' });
              if (window) window.webContents.send('uwf_error', 'Error al congelar: ' + err.message);
            }
          });
    } else if (data.command === 'thaw') {
      
      const thawCmd = `
$taskName = "ICE_Profile_Restore"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
$rp = Get-ComputerRestorePoint | Where-Object {$_.Description -eq 'ICE Freeze'} | Sort-Object -Property SequenceNumber -Descending | Select-Object -First 1
if ($rp) { Restore-Computer -RestorePoint $rp.SequenceNumber -Confirm:$false -ErrorAction SilentlyContinue }
exit 0
`;
      runPowerShell(thawCmd, (err) => {
            if (!err) {
              clientInfo.is_frozen = false;
              
              try {
                const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                cfg.isFrozen = false;
                fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
              } catch(e) {}
              
              try { fs.writeFileSync(frozenFlagPath, 'false', { encoding: 'utf8' }); } catch(e) {}
              socket.emit('register_client', clientInfo);
              if (window) window.webContents.send('frozen_state', false);
              
              if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Completado' });
              exec('shutdown -r -t 0');
            } else {
              console.error('Error restoring system:', err);
              if (data.historyId) socket.emit('command_result', { historyId: data.historyId, status: 'Fallido' });
              if (window) window.webContents.send('uwf_error', 'Error al descongelar el sistema: ' + err.message);
            }
          });
    }
  });

  
  
  
  
  
  let streamInterval = null;
  let isCapturing = false;
  let currentRequesterId = null;

  socket.on('disconnect', () => {
    if(window) window.webContents.send('status', 'offline');
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    isCapturing = false;
    currentRequesterId = null;
  });

  socket.on('webrtc_offer', async (data) => {
    currentRequesterId = data.requesterId;
    
    try {
      
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      if (sources && sources.length > 0 && window) {
        
        window.webContents.send('start_webrtc', {
          sourceId: sources[0].id,
          offer: data.offer,
          requesterId: currentRequesterId
        });
      }
    } catch (e) {
      console.error('Error al obtener sources para WebRTC:', e);
    }
  });

  socket.on('webrtc_ice_candidate', (data) => {
    if (window) {
      window.webContents.send('webrtc_ice_candidate', data);
    }
  });

  socket.on('stop_stream', () => {
    if (window) {
      window.webContents.send('stop_webrtc');
    }
    currentRequesterId = null;
  });

  
  ipcMain.on('webrtc_answer', (event, data) => {
    if (socket && currentRequesterId) {
      socket.emit('webrtc_answer', {
        requesterId: currentRequesterId,
        answer: data.answer
      });
    }
  });

  ipcMain.on('webrtc_ice_candidate', (event, data) => {
    if (socket && currentRequesterId) {
      socket.emit('webrtc_ice_candidate', {
        requesterId: currentRequesterId,
        candidate: data.candidate
      });
    }
  });

  
  
  
  
  
  const filesDir = path.join('C:', 'ICE_Archivos');

  socket.on('receive_file', (data) => {
    try {
      
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }

      
      const safeName = path.basename(data.fileName);
      let destPath = path.join(filesDir, safeName);

      
      if (fs.existsSync(destPath)) {
        const ext = path.extname(safeName);
        const base = path.basename(safeName, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        destPath = path.join(filesDir, `${base}_${timestamp}${ext}`);
      }

      
      const base64Data = data.fileData.includes(',') ? data.fileData.split(',')[1] : data.fileData;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(destPath, fileBuffer);

      console.log(`Archivo recibido y guardado: ${destPath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

      
      socket.emit('file_received', {
        senderId: data.senderId,
        fileName: safeName,
        historyId: data.historyId
      });
    } catch (e) {
      console.error('Error al guardar archivo recibido:', e.message);
    }
  });

  
  
  
  const { mouse, keyboard, Point, screen, Button, Key } = require('@nut-tree-fork/nut-js');
  
  mouse.config.autoDelayMs = 0;
  keyboard.config.autoDelayMs = 0;

  socket.on('remote_mouse_move', async (data) => {
    try {
      
      const screenW = await screen.width();
      const screenH = await screen.height();
      
      
      const targetX = Math.round(data.x * screenW);
      const targetY = Math.round(data.y * screenH);
      
      
      await mouse.setPosition(new Point(targetX, targetY));
    } catch (e) {
      console.error('Error en mouse_move:', e.message);
    }
  });

  socket.on('remote_mouse_click', async (data) => {
    try {
      if (data.button === 'left') {
        await mouse.click(Button.LEFT);
      } else if (data.button === 'right') {
        await mouse.click(Button.RIGHT);
      }
    } catch (e) {
      console.error('Error en mouse_click:', e.message);
    }
  });

  socket.on('remote_key_press', async (data) => {
    try {
      
      const keyMap = {
        'Enter': Key.Enter,
        'Backspace': Key.Backspace,
        'Tab': Key.Tab,
        'Escape': Key.Escape,
        'Space': Key.Space,
        'Shift': Key.LeftShift,
        'Control': Key.LeftControl,
        'Alt': Key.LeftAlt,
        'Meta': Key.LeftSuper,
        'ArrowUp': Key.Up,
        'ArrowDown': Key.Down,
        'ArrowLeft': Key.Left,
        'ArrowRight': Key.Right
      };

      if (data.key.length === 1) {
        
        await keyboard.type(data.key);
      } else if (keyMap[data.key]) {
        
        await keyboard.pressKey(keyMap[data.key]);
        await keyboard.releaseKey(keyMap[data.key]);
      }
    } catch (e) {
      console.error('Error en key_press:', e.message);
    }
  });
}


ipcMain.on('verify-password', (event, password) => {
  if (password === '..studioworks') {
    event.reply('password-result', { success: true });
  } else {
    event.reply('password-result', { success: false });
  }
});

ipcMain.on('set-freeze-state', (event, state) => {
  
  if (state) {
    
    socket.emit('execute_command', { command: 'freeze' });
  } else {
    socket.emit('execute_command', { command: 'thaw' });
  }
  
  event.reply('frozen_state', state);
});

ipcMain.handle('get-initial-state', () => {
  return {
    isFrozen: clientInfo.is_frozen,
    status: socket && socket.connected ? 'online' : 'offline'
  };
});
