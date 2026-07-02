const { io } = require('socket.io-client');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');


const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;
require('dotenv').config({ path: path.join(baseDir, '.env') });

const configPath = path.join(baseDir, 'config.json');
let clientId = 'unknown';
let SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000'; 

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.id) clientId = config.id;
    if (config.serverUrl) SERVER_URL = config.serverUrl;
  } catch(e) {}
}

const socket = io(SERVER_URL, {
  reconnectionDelayMax: 10000,
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

if (clientId === 'unknown') {
  clientId = getMacAddress();
  fs.writeFileSync(configPath, JSON.stringify({ 
    id: clientId,
    serverUrl: SERVER_URL
  }, null, 2));
}

const clientInfo = {
  id: clientId,
  hostname: os.hostname(),
  ip: getIPAddress(),
  version: '1.0.0',
  is_frozen: false 
};

socket.on('connect', () => {
  console.log('Conectado al servidor. Registrando cliente...');
  socket.emit('register_client', clientInfo);
});

socket.on('execute_command', (data) => {
  console.log('Comando recibido del servidor:', data.command);
  
  if (data.command === 'shutdown') {
    console.log('Ejecutando apagado...');
    
    exec('shutdown -s -t 0', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al apagar: ${error.message}`);
        return;
      }
    });
  } else if (data.command === 'reboot') {
    console.log('Ejecutando reinicio...');
    exec('shutdown -r -t 0');
  } else if (data.command === 'freeze') {
    console.log('Comando congelar recibido (UWF)');
    exec('uwfmgr filter enable', (err) => {
      if (!err) {
        clientInfo.is_frozen = true;
        socket.emit('register_client', clientInfo);
        exec('shutdown -r -t 0');
      } else {
        console.error('Error al congelar:', err.message);
      }
    });
  } else if (data.command === 'thaw') {
    console.log('Comando descongelar recibido (UWF)');
    exec('uwfmgr filter disable', (err) => {
      if (!err) {
        clientInfo.is_frozen = false;
        socket.emit('register_client', clientInfo);
        exec('shutdown -r -t 0');
      } else {
        console.error('Error al descongelar:', err.message);
      }
    });
  }
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});
