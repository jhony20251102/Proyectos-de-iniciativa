/*
 * Copyright (c) 2026 RICKY SEDANO REYES. Todos los derechos reservados.
 * Código compartido de buena fe exclusivamente para revisión y evaluación.
 * Su implementación o uso requiere un acuerdo previo con el autor.
 */
const express = require('express');
const http = require('http');
const cron = require('node-cron');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50e6,       
  pingTimeout: 60000,           
  pingInterval: 25000,          
  transports: ['websocket', 'polling']  
});

app.use(cors());
app.use(express.json());


const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, where, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "ice-console-b8d22.firebaseapp.com",
  projectId: "ice-console-b8d22",
  storageBucket: "ice-console-b8d22.firebasestorage.app",
  messagingSenderId: "224282019714",
  appId: "1:224282019714:web:37c40b192eb326c101f19b"
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

let db = { clients: [] };

async function loadDb() {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "clients"));
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push(doc.data());
    });
    
    db.clients = clients.map(c => ({...c, status: 'offline'}));
    console.log(`Cargados ${db.clients.length} clientes desde Firebase`);
  } catch (e) {
    console.error("Error leyendo desde Firebase", e);
  }
}

async function saveClientToDb(clientData) {
  try {
    await setDoc(doc(firestoreDb, "clients", clientData.id), clientData);
  } catch (e) {
    console.error("Error guardando cliente en Firebase", e);
  }
}

loadDb();

async function saveHistoryLog(action, userEmail, targetId, details, targetList = [], status = 'Pendiente') {
  try {
    const logData = {
      action,
      userEmail: userEmail || "Desconocido",
      targetId,
      details,
      targetList,
      status: status,
      timestamp: new Date().toISOString()
    };
    if (status === 'Completado') {
      logData.completedAt = new Date().toISOString();
    }
    const docRef = await addDoc(collection(firestoreDb, "history"), logData);
    return docRef.id;
  } catch (e) {
    console.error("Error guardando historial:", e);
    return null;
  }
}


function upsertClient(clientData) {
  const index = db.clients.findIndex(c => c.id === clientData.id);
  if (index >= 0) {
    db.clients[index] = { ...db.clients[index], ...clientData, last_seen: new Date().toISOString() };
  } else {
    db.clients.push({ 
      ...clientData, 
      last_seen: new Date().toISOString(), 
      directiva: 'Sin Asignar',
      grupo: 'Sin Asignar',
      etiquetas: ''
    });
  }
  const updatedClient = db.clients.find(c => c.id === clientData.id);
  saveClientToDb(updatedClient);
  return updatedClient;
}

// API REST

// Obtener todos los clientes
app.get('/api/clients', (req, res) => {
  res.json(db.clients);
});


app.get('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const client = db.clients.find(c => c.id === id);
  if (client) {
    res.json(client);
  } else {
    res.status(404).json({ error: "Cliente no encontrado" });
  }
});


app.get('/api/structure', (req, res) => {
  const directivas = [...new Set(db.clients.map(c => c.directiva))].filter(Boolean);
  const grupos = [...new Set(db.clients.map(c => c.grupo))].filter(Boolean);
  res.json({ directivas, grupos });
});


app.patch('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { userEmail, ...updates } = req.body;
  
  const client = db.clients.find(c => c.id === id);
  if (client) {
    let details = [];
    if (updates.directiva !== undefined) { client.directiva = updates.directiva; details.push(`Directiva a ${updates.directiva}`); }
    if (updates.grupo !== undefined) { client.grupo = updates.grupo; details.push(`Grupo a ${updates.grupo}`); }
    if (updates.etiquetas !== undefined) { client.etiquetas = updates.etiquetas; details.push(`Etiquetas a ${updates.etiquetas}`); }
    
    saveClientToDb(client);
    io.emit('client_updated', client);
    
    saveHistoryLog("Modificación de equipo", userEmail, client.hostname, details.join(', '), [], 'Completado');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Cliente no encontrado" });
  }
});


app.post('/api/clients/:id/command', async (req, res) => {
  const { id } = req.params;
  const { command, userEmail } = req.body; 
  
  const client = db.clients.find(c => c.id === id);
  const hostname = client ? client.hostname : id;

  const socketId = activeClients.get(id);
  if (socketId) {
    const isPowerCommand = command === 'shutdown' || command === 'reboot';
    const initialStatus = isPowerCommand ? 'Completado' : 'Pendiente';
    const historyId = await saveHistoryLog("Comando enviado", userEmail, hostname, `Ejecutó: ${command}`, [], initialStatus);
    io.to(socketId).emit('execute_command', { command, historyId });
    res.json({ success: true, message: `Comando ${command} enviado` });
  } else {
    res.status(404).json({ error: 'Cliente no está conectado (offline)' });
  }
});


app.post('/api/clients/batch-command', async (req, res) => {
  const { ids, command, userEmail } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "IDs inválidos" });
  }

  const targetId = `${ids.length} equipo(s)`;
  const details = `Comando ejecutado en lote: ${command}`;
  
  const targetList = ids.map(id => {
    const client = db.clients.find(c => c.id === id);
    if (client) {
      const sede = client.directiva || 'Sin Sede';
      const grupo = client.grupo || 'Sin Grupo';
      return `${client.hostname} (Sede: ${sede}, Grupo: ${grupo})`;
    }
    return id;
  });

  const isPowerCommand = command === 'shutdown' || command === 'reboot';
  const initialStatus = isPowerCommand ? 'Completado' : 'Pendiente';
  const historyId = await saveHistoryLog("Comandos en lote", userEmail, targetId, details, targetList, initialStatus);

  let successCount = 0;
  for (const id of ids) {
    const socketId = activeClients.get(id);
    if (socketId) {
      io.to(socketId).emit('execute_command', { command, historyId });
      successCount++;
    }
  }

  res.json({ success: true, message: `Comando enviado a ${successCount} de ${ids.length} equipos` });
});


app.get('/api/history', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "history"));
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (e) {
    console.error("Error", e);
    res.status(500).json({ error: "Error leyendo historial" });
  }
});




app.get('/api/users', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "allowed_users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Error leyendo usuarios" });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, role, addedBy } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    
    
    const querySnapshot = await getDocs(collection(firestoreDb, "allowed_users"));
    let exists = false;
    querySnapshot.forEach((doc) => {
      if (doc.data().email === email) exists = true;
    });
    
    if (exists) return res.status(400).json({ error: "Usuario ya existe" });

    const docRef = await addDoc(collection(firestoreDb, "allowed_users"), {
      email,
      role: role || "admin",
      addedBy: addedBy || "Desconocido",
      createdAt: new Date().toISOString()
    });
    res.json({ id: docRef.id, email, role });
  } catch (e) {
    res.status(500).json({ error: "Error guardando usuario" });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(firestoreDb, "allowed_users", id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});


app.post('/api/clients/batch-delete', async (req, res) => {
  try {
    const { ids, userEmail } = req.body;
    if (userEmail !== 'agregarcorreoaqui@aaaa.com') {
      return res.status(403).json({ error: "No autorizado. Solo el Superadmin puede eliminar equipos." });
    }
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }

    console.log(`Eliminando ${ids.length} clientes solicitado por ${userEmail}`);
    
    
    for (const id of ids) {
      await deleteDoc(doc(firestoreDb, "clients", id));
    }

    
    db.clients = db.clients.filter(c => !ids.includes(c.id));

    
    io.emit('clients_deleted', ids);

    
    await saveHistoryLog("Eliminación de equipos", userEmail, "Varios equipos", `Se eliminaron permanentemente ${ids.length} equipo(s)`, [], 'Completado');

    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando clientes en batch:", e);
    res.status(500).json({ error: "Error al eliminar los equipos" });
  }
});


app.post('/api/history/batch-delete', async (req, res) => {
  try {
    const { ids, userEmail } = req.body;
    if (userEmail !== 'rickysedano1@gmail.com') {
      return res.status(403).json({ error: "No autorizado. Solo el Superadmin puede eliminar historial." });
    }
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }

    console.log(`Eliminando ${ids.length} registros de historial solicitado por ${userEmail}`);
    
    for (const id of ids) {
      await deleteDoc(doc(firestoreDb, "history", id));
    }

    res.json({ success: true });
  } catch (e) {
    console.error("Error al eliminar historial:", e);
    res.status(500).json({ error: "Error al eliminar registros de historial" });
  }
});


app.post('/api/history/clear-all', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (userEmail !== 'rickysedano1@gmail.com') {
      return res.status(403).json({ error: "No autorizado. Solo el Superadmin puede vaciar el historial." });
    }

    console.log(`Borrando TODO el historial solicitado por ${userEmail}`);

    const querySnapshot = await getDocs(collection(firestoreDb, "history"));
    for (const d of querySnapshot.docs) {
      await deleteDoc(doc(firestoreDb, "history", d.id));
    }

    
    await saveHistoryLog("Limpieza de historial", userEmail, "Sistema", "Se vació por completo el historial de auditoría", [], 'Completado');

    res.json({ success: true });
  } catch (e) {
    console.error("Error al limpiar historial completo:", e);
    res.status(500).json({ error: "Error al limpiar el historial" });
  }
});






async function runEnergySnapshot() {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); 
    const now = new Date().toISOString();

    
    db.clients.forEach(c => {
      if (c.status === 'online' && c.extended?.boot_time && c.extended.boot_time > 0) {
        const currentUptimeHours = (Date.now() - c.extended.boot_time) / (1000 * 60 * 60);
        c.daily_max_uptime = Math.max(c.daily_max_uptime || 0, currentUptimeHours);
      }
    });

    
    const snapshotClients = db.clients
      .filter(c => c.daily_max_uptime && c.daily_max_uptime > 0)
      .map(c => ({
          id: c.id,
          hostname: c.hostname,
          ip: c.ip || '',
          sede: c.directiva || 'Sin Asignar',
          grupo: c.grupo || 'Sin Asignar',
          uptimeHours: parseFloat(c.daily_max_uptime.toFixed(2)),
          bootTime: c.extended?.boot_time || 0,
          status: c.status
      }));

    if (snapshotClients.length === 0) {
      console.log(`Energy snapshot omitido: No hay equipos con datos de uptime hoy.`);
      return { success: true, message: 'No hay equipos con datos de uptime hoy', count: 0 };
    }

    
    const snapshotDoc = {
      date: today,
      timestamp: now,
      totalOnline: db.clients.filter(c => c.status === 'online').length,
      totalRegistered: db.clients.length,
      clients: snapshotClients
    };

    await setDoc(doc(firestoreDb, 'energy_snapshots', today), snapshotDoc);
    console.log(`Energy snapshot guardado: ${today} con ${snapshotClients.length} equipos`);
    
    
    db.clients.forEach(c => {
      if (c.daily_max_uptime) {
        c.daily_max_uptime = 0;
        saveClientToDb(c);
      }
    });

    return { success: true, date: today, count: snapshotClients.length };
  } catch (e) {
    console.error('Error guardando energy snapshot:', e);
    throw e;
  }
}


cron.schedule('50 23 * * *', async () => {
  console.log('Ejecutando tarea programada: Energy Snapshot diario');
  try {
    await runEnergySnapshot();
  } catch (error) {
    console.error('Error en tarea programada (Energy Snapshot):', error);
  }
});


app.post('/api/energy/snapshot', async (req, res) => {
  try {
    const result = await runEnergySnapshot();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar snapshot de energía' });
  }
});


app.get('/api/energy/history', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); 
    const startDate = `${month}-01`;
    
    const [year, mon] = month.split('-').map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    
    const q = query(
      collection(firestoreDb, 'energy_snapshots'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const snapshots = [];
    querySnapshot.forEach((d) => {
      snapshots.push({ id: d.id, ...d.data() });
    });

    
    const sedeMap = {};
    snapshots.forEach(snap => {
      (snap.clients || []).forEach(client => {
        const sede = client.sede || 'Sin Asignar';
        if (!sedeMap[sede]) {
          sedeMap[sede] = {
            sede,
            totalReadings: 0,
            sumUptimeHours: 0,
            maxUptimeHours: 0,
            maxUptimeHostname: '',
            equiposSet: new Set(),
            alertCounts: { normal: 0, review: 0, warning: 0, critical: 0 }
          };
        }
        const s = sedeMap[sede];
        s.totalReadings++;
        s.sumUptimeHours += client.uptimeHours;
        s.equiposSet.add(client.id);
        if (client.uptimeHours > s.maxUptimeHours) {
          s.maxUptimeHours = client.uptimeHours;
          s.maxUptimeHostname = client.hostname;
        }
        // Classify alert level
        const h = client.uptimeHours;
        if (h >= 24) s.alertCounts.critical++;
        else if (h >= 12) s.alertCounts.warning++;
        else if (h >= 8) s.alertCounts.review++;
        else s.alertCounts.normal++;
      });
    });

    // Convert to array, replacing Sets with counts
    const sedeMetrics = Object.values(sedeMap).map(s => ({
      sede: s.sede,
      totalEquipos: s.equiposSet.size,
      totalReadings: s.totalReadings,
      avgUptimeHours: s.totalReadings > 0 ? parseFloat((s.sumUptimeHours / s.totalReadings).toFixed(2)) : 0,
      maxUptimeHours: parseFloat(s.maxUptimeHours.toFixed(2)),
      maxUptimeHostname: s.maxUptimeHostname,
      alertCounts: s.alertCounts
    }));

    res.json({
      month,
      snapshotCount: snapshots.length,
      snapshots,
      sedeMetrics: sedeMetrics.sort((a, b) => b.avgUptimeHours - a.avgUptimeHours)
    });
  } catch (e) {
    console.error('Error leyendo energy history:', e);
    res.status(500).json({ error: 'Error al leer historial de energía' });
  }
});


const activeClients = new Map();


io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  
  socket.on('register_client', (data) => {
    const { id, hostname, ip, version, is_frozen, network_type, extended } = data;
    console.log(`Cliente registrado: ${hostname} (${id}) [${network_type || 'unknown'}]`);
    
    activeClients.set(id, socket.id);

    const updatedClient = upsertClient({
      id, hostname, ip, version, is_frozen: is_frozen ? 1 : 0, status: 'online', network_type: network_type || 'unknown', extended: extended || {}
    });

    io.emit('client_updated', updatedClient);
  });

  
  socket.on('client_metrics', (data) => {
    const { id, cpu, ram, user, uptime } = data;
    const client = db.clients.find(c => c.id === id);
    if (client) {
      if (!client.metrics) client.metrics = {};
      client.metrics.cpu = cpu;
      client.metrics.ram = ram;
      client.metrics.user = user;
      client.metrics.uptimeHours = uptime ? (uptime / 3600) : 0;
      client.last_seen = new Date().toISOString();
      
      
      io.emit('client_updated', client);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedClientId = null;
    for (const [clientId, sockId] of activeClients.entries()) {
      if (sockId === socket.id) {
        disconnectedClientId = clientId;
        activeClients.delete(clientId);
        break;
      }
    }

    if (disconnectedClientId) {
      console.log(`Cliente desconectado: ${disconnectedClientId}`);
      
      
      const client = db.clients.find(c => c.id === disconnectedClientId);
      if (client && client.extended?.boot_time) {
        const currentUptimeHours = (Date.now() - client.extended.boot_time) / (1000 * 60 * 60);
        client.daily_max_uptime = Math.max(client.daily_max_uptime || 0, currentUptimeHours);
        saveClientToDb(client);
      }

      const updatedClient = upsertClient({ id: disconnectedClientId, status: 'offline' });
      io.emit('client_updated', updatedClient);
    }
  });

  socket.on('command_result', async (data) => {
    try {
      if (data.historyId) {
        await setDoc(doc(firestoreDb, "history", data.historyId), {
          status: data.status,
          completedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch(e) {
      console.error("Error updating history status", e);
    }
  });

  
  socket.on('start_stream', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('start_stream', { requesterId: socket.id });
    } else {
      socket.emit('stream_error', { error: 'El equipo no está conectado.' });
    }
  });

  socket.on('stop_stream', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('stop_stream');
    }
  });

  socket.on('stream_frame', (data) => {
    if (data.requesterId) {
      
      io.to(data.requesterId).volatile.emit('stream_frame', { image: data.image });
    }
  });

  
  
  
  
  socket.on('webrtc_offer', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc_offer', { 
        requesterId: socket.id, 
        offer: data.offer 
      });
    } else {
      socket.emit('stream_error', { error: 'El equipo no está conectado.' });
    }
  });

  socket.on('webrtc_answer', (data) => {
    if (data.requesterId) {
      io.to(data.requesterId).emit('webrtc_answer', { answer: data.answer });
    }
  });

  socket.on('webrtc_ice_candidate', (data) => {
    
    if (data.clientId) {
      const targetSocketId = activeClients.get(data.clientId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_ice_candidate', { 
          candidate: data.candidate,
          requesterId: socket.id 
        });
      }
    } 
    
    else if (data.requesterId) {
      io.to(data.requesterId).emit('webrtc_ice_candidate', { 
        candidate: data.candidate 
      });
    }
  });

  
  socket.on('send_file', async (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      
      const client = db.clients.find(c => c.id === data.clientId);
      const hostname = client ? client.hostname : data.clientId;
      const historyId = await saveHistoryLog("Archivo enviado", data.userEmail || "Admin", hostname, `Archivo: ${data.fileName}`);

      io.to(targetSocketId).emit('receive_file', {
        fileName: data.fileName,
        fileData: data.fileData,
        senderId: socket.id,
        historyId: historyId 
      });
    } else {
      socket.emit('file_error', { error: 'El equipo no está conectado.' });
    }
  });

  
  socket.on('remote_mouse_move', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      
      io.to(targetSocketId).volatile.emit('remote_mouse_move', data);
    }
  });

  socket.on('remote_mouse_click', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('remote_mouse_click', data);
    }
  });

  socket.on('remote_key_press', (data) => {
    const targetSocketId = activeClients.get(data.clientId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('remote_key_press', data);
    }
  });

  socket.on('file_received', async (data) => {
    if (data.senderId) {
      io.to(data.senderId).emit('file_received', { fileName: data.fileName, success: true });
    }
    
    if (data.historyId) {
      try {
        await setDoc(doc(firestoreDb, "history", data.historyId), {
          status: 'Completado',
          completedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Error al actualizar estado del archivo:", e);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ICE Backend corriendo en http://localhost:${PORT}`);
});
