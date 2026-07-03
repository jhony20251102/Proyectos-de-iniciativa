const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const memoryService = require('./src/services/memoryService');
const dbService = require('./src/services/dbService');
const ragService = require('./src/services/ragService');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  try {
    await dbService.init();
    await ragService.init();
    await memoryService.cargarMemoria();
    console.log(`
╔════════════════════════════════════════╗
║  🚀 SERVIDOR NOVA.IA INICIADO          ║
║                                        ║
║  Puerto: ${PORT}                          ║
║  URL: http://localhost:${PORT}            ║
║  Modo: Desarrollo                      ║
║  Estado: Operacional ✓                 ║
╚════════════════════════════════════════╝
        `);
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
});