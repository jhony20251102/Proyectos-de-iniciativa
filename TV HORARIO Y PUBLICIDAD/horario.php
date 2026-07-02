<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horario y Publicidad Certus | Ate</title>
  <link rel="icon" type="image/png" href="favicon.png">

  <!-- Importar Fuente Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet">
  <style>
    /* === IMPORTAR FUENTE PROFESIONAL === */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    /* === RESET === */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-box-sizing: border-box;
      user-select: none;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100%;
      width: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
    }

    body {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
    }

    /* === HEADER CORPORATIVO === */
    .header {
      background: #ffffff;
      border-bottom: 3px solid #0047AB;
      padding: 20px 0 18px 0;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 100%;
      margin: 0;
      padding: 0 50px;
    }

    .logo-section {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
    }

    .logo-gif {
      height: 75px;
      width: auto;
      margin-right: 22px;
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
      display: block;
    }

    .brand-text {
      display: -webkit-box !important;
      display: -webkit-flex !important;
      display: flex !important;
      -webkit-box-orient: vertical !important;
      -webkit-flex-direction: column !important;
      flex-direction: column !important;
      -webkit-flex-shrink: 0 !important;
      flex-shrink: 0 !important;
      visibility: visible !important;
      opacity: 1 !important;
      text-align: left !important;
    }

    .institution-name {
      font-family: 'Inter', Arial, sans-serif !important;
      font-size: 32px !important;
      font-weight: 800 !important;
      color: #0047AB !important;
      letter-spacing: -0.5px !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .tagline {
      font-family: 'Inter', Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      color: #555 !important;
      letter-spacing: 0.8px !important;
      text-transform: uppercase !important;
      white-space: nowrap !important;
      display: block !important;
      margin-top: 2px !important;
    }

    .day-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
      flex-shrink: 0;
      margin-left: auto;
    }

    .current-day {
      font-size: 32px;
      font-weight: 700;
      color: #0047AB;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .date-time {
      font-size: 13px;
      font-weight: 500;
      color: #666;
      white-space: nowrap;
    }

    /* === BARRA DE ESTADO === */
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
      border-left: 4px solid #0047AB;
      padding: 12px 50px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .status-label {
      color: #666;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-right: 6px;
    }

    .status-value {
      color: #0047AB;
      font-weight: 700;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #ffffff;
      border: 2px solid #0047AB;
      border-radius: 2px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #0047AB;
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {

      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }

      50% {
        opacity: 0.4;
        transform: scale(0.8);
      }
    }

    .live-text {
      font-size: 12px;
      font-weight: 700;
      color: #0047AB;
      letter-spacing: 1px;
    }

    /* === CONTENEDOR PRINCIPAL === */
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1900px;
      margin: 0 auto;
      padding: 25px 50px 30px 50px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.5s ease-in-out;
    }

    /* === CONTENEDOR DE TABLA / PUBLICIDAD === */
    .table-wrapper {
      background: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 1800px;
      transition: all 0.5s ease-in-out;
    }

    /* === TABLA DE HORARIOS (VISTA CLASES) === */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
    }

    table thead {
      background: #0047AB;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    table th {
      color: #ffffff;
      text-align: center;
      padding: 18px 20px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-right: 1px solid rgba(255, 255, 255, 0.15);
    }

    table th:last-child {
      border-right: none;
    }

    table tbody tr {
      border-bottom: 1px solid #e8e8e8;
      transition: background-color 0.2s ease;
    }

    table tbody tr:hover {
      background: #f8f9fa;
    }

    table tbody tr:last-child {
      border-bottom: none;
    }

    table tbody td {
      padding: 18px 20px;
      color: #2c2c2c;
      font-size: 16px;
      font-weight: 500;
      vertical-align: middle;
      text-align: center;
    }

    /* Columnas específicas del Horario */
    td:nth-child(1) {
      font-weight: 700;
      color: #0047AB;
      font-size: 17px;
    }

    td:nth-child(2) {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }

    td:nth-child(3),
    td:nth-child(4) {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 16px;
    }

    td:nth-child(5) {
      background: #e6f0ff;
      font-weight: 700;
      color: #0047AB;
      border-left: 3px solid #0047AB;
      border-right: 3px solid #0047AB;
      font-size: 17px;
    }

    td:nth-child(6) {
      color: #444;
      font-weight: 500;
      font-size: 16px;
    }

    /* === VISTA PUBLICIDAD (FUSIÓN MOTOR SEAMLESS) === */
    #vista-publicidad {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
      z-index: 100;
    }

    .media-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      display: -webkit-flex;
      justify-content: center;
      -webkit-justify-content: center;
      align-items: center;
      -webkit-align-items: center;
      transition: opacity 1.5s ease-in-out;
      -webkit-transition: opacity 1.5s ease-in-out;
      opacity: 0;
      z-index: 1;
    }

    .media-container.active {
      opacity: 1;
      z-index: 2;
    }

    .media-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      background-size: cover;
      background-position: center;
      background-color: #111;
      opacity: 0.3;
    }

    img,
    video,
    .content-holder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* Excepción para el logo del header */
    .logo-gif {
      position: relative !important;
      width: auto !important;
      height: 75px !important;
      top: auto !important;
      left: auto !important;
      z-index: 10 !important;
    }

    .content-holder {
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    video {
      object-fit: contain;
    }

    /* Barra de progreso de Publicidad */
    #progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: #00f2fe;
      opacity: 0.8;
      width: 0%;
      z-index: 110;
      transition: width 0.05s linear;
    }

    /* Mensaje de estado en Publicidad */
    .no-clases-banner {
      position: absolute;
      bottom: 12px;
      right: 20px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      z-index: 105;
      display: flex;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }

    .no-clases-banner::before {
      content: "";
      width: 8px;
      height: 8px;
      background: #00f2fe;
      /* Color a juego con la barra de progreso */
      border-radius: 50%;
      margin-right: 10px;
      box-shadow: 0 0 5px #00f2fe;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0% {
        opacity: 1;
        transform: scale(1);
      }

      50% {
        opacity: 0.4;
        transform: scale(0.8);
      }

      100% {
        opacity: 1;
        transform: scale(1);
      }
    }


    /* === REGLAS DE ACOPLE DINÁMICO === */
    /* Cuando se muestran las clases */
    body.vista-clases-activa .container {
      overflow-y: auto;
    }

    body.vista-clases-activa .table-wrapper {
      height: auto;
      background: #ffffff;
    }

    body.vista-clases-activa #vista-horario {
      display: block !important;
    }

    body.vista-clases-activa #vista-publicidad {
      display: none !important;
    }

    /* Cuando NO hay clases y se muestra Publicidad */
    body.vista-publicidad-activa {
      overflow: hidden;
    }

    body.vista-publicidad-activa .container {
      overflow: hidden;
      flex: 1;
      height: auto;
    }

    body.vista-publicidad-activa .table-wrapper {
      flex: 1;
      height: 100%;
      position: relative;
      background: #000;
      /* Fondo negro elegante para el reproductor */
      border: 1px solid #333;
    }

    body.vista-publicidad-activa #vista-horario {
      display: none !important;
    }

    body.vista-publicidad-activa #vista-publicidad {
      display: block !important;
    }



    /* === ANIMACIONES DE FILAS === */
    .fila-entrando {
      animation: fadeInSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
      transform: translateY(-10px);
    }

    @keyframes fadeInSlide {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fila-saliendo {
      animation: fadeOutSlide 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      opacity: 1;
    }

    @keyframes fadeOutSlide {
      from {
        opacity: 1;
        transform: translateY(0);
      }

      to {
        opacity: 0;
        transform: translateY(10px);
      }
    }

    /* === ESTADO VACÍO (CARGA/FALLBACK) === */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      color: #888;
    }

    .empty-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 25px;
      background: #f0f4ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 35px;
    }

    .empty-title {
      font-size: 22px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }

    .empty-subtitle {
      font-size: 15px;
      font-weight: 500;
      color: #666;
      line-height: 1.6;
    }

    /* === FOOTER CORPORATIVO === */
    footer {
      background: transparent;
      color: #0047AB;
      text-align: center;
      padding: 18px 0;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      width: 100%;
      margin-top: auto;
      flex-shrink: 0;
    }

    .footer-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 18px;
      color: #0047AB;
    }

    .footer-separator {
      width: 2px;
      height: 14px;
      background: rgba(0, 71, 171, 0.3);
    }

    /* === OVERLAY MODO NOCTURNO / REPOSO === */
    #overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      color: white;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .overlay-icon {
      font-size: 100px;
      margin-bottom: 40px;
      opacity: 0.6;
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {

      0%,
      100% {
        transform: translateY(0);
      }

      50% {
        transform: translateY(-15px);
      }
    }

    .overlay-text {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 3px;
      opacity: 0.9;
    }

    /* === RESPONSIVE === */
    @media (max-width: 1600px) {
      .container {
        padding: 20px 40px 25px 40px;
      }

      .header-content {
        padding: 0 40px;
      }

      table th,
      table tbody td {
        padding: 16px 18px;
      }
    }

    @media (max-width: 1200px) {
      .institution-name {
        font-size: 28px;
      }

      .current-day {
        font-size: 26px;
      }

      table th,
      table tbody td {
        padding: 14px 16px;
        font-size: 14px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 15px;
        align-items: center;
      }

      .logo-section {
        width: 100%;
        justify-content: center;
      }

      .day-display {
        align-items: center;
        width: 100%;
      }

      .status-bar {
        flex-direction: column;
        gap: 12px;
        padding: 12px 20px;
      }
    }
  </style>
</head>

<body class="vista-clases-activa"> <!-- Por defecto mostramos la estructura del horario -->

  <!-- Cabecera Institucional -->
  <div class="header">
    <div class="header-content">
      <div class="logo-section">
        <img src="giftvcertus.gif" alt="Logo Certus" class="logo-gif">
        <div class="brand-text">
          <div class="institution-name">CERTUS</div>
          <div class="tagline">Licenciado por MINEDU</div>
        </div>
      </div>
      <div class="day-display">
        <div class="current-day" id="dia-actual">CARGANDO...</div>
        <div class="date-time" id="fecha-completa">Cargando fecha...</div>
      </div>
    </div>
  </div>

  <!-- Barra de Estado Dinámica -->
  <div class="status-bar">
    <div class="status-item">
      <span class="status-label">Campus:</span>
      <span class="status-value">Ate - Lima</span>
    </div>
    <div class="live-indicator">
      <div class="live-dot"></div>
      <span class="live-text">EN VIVO</span>
    </div>
    <div class="status-item">
      <span class="status-label">Hora Actual:</span>
      <span class="status-value" id="hora-actual">00:00:00</span>
    </div>
  </div>

  <!-- Área de Contenido Central -->
  <div class="container">
    <div class="table-wrapper">

      <!-- VISTA A: Tabla de Horarios de Clases -->
      <div id="vista-horario">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">Cargando Horarios</div>
          <div class="empty-subtitle">Conectando con la hoja de cálculo de Certus en vivo...</div>
        </div>
      </div>

      <!-- VISTA B: Reproductor Seamless de Publicidad -->
      <div id="vista-publicidad">
        <div id="container-a" class="media-container active">
          <div class="media-bg"></div>
          <div class="content-holder"></div>
        </div>
        <div id="container-b" class="media-container">
          <div class="media-bg"></div>
          <div class="content-holder"></div>
        </div>
        <div id="progress-bar"></div>
        <div class="no-clases-banner">Sin clases programadas ahora</div>
      </div>

    </div>
  </div>

  <!-- Pie de Página Institucional -->
  <footer>
    <div class="footer-content">
      <span id="footer-year">© 2026 CERTUS</span>
      <div class="footer-separator"></div>
      <span>30 Años Formando Profesionales de Excelencia</span>
    </div>
  </footer>

  <!-- Pantalla Protectora de Reposo (Modo Nocturno) -->
  <div id="overlay">
    <div class="overlay-icon">🌙</div>
    <div class="overlay-text">TV EN REPOSO</div>
  </div>

  <script>
    // === CONFIGURACIÓN DE HORARIOS ===
    const spreadsheetId = "1i00ezJti99BTx3I4ldb5eOz276MlkBG4urVth1bM6WA";
    const baseUrl = `https://opensheet.elk.sh/${spreadsheetId}/`;

    // === VARIABLES DEL REPRODUCTOR DE PUBLICIDAD ===
    var elements = [];
    var currentIndex = -1;
    var isNightMode = false;
    var containerToggle = true;
    var timer = null;
    var progressTimer = null;
    var audioUnlocked = false; // Flag para rastrear si el audio ha sido habilitado por interacción

    // Controladores de estado unificados
    var adsEngineActive = false;
    var vistaActual = 'clases'; // 'clases' | 'publicidad'

    function getCurrentDayName() {
      const days = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
      const dayIndex = new Date().getDay();
      return days[dayIndex];
    }

    function parseTime(str) {
      const [time, meridian] = str.trim().split(" ");
      let [hours, minutes, seconds] = time.split(":").map(Number);
      if (meridian && meridian.toLowerCase().includes("p") && hours < 12) hours += 12;
      if (meridian && meridian.toLowerCase().includes("a") && hours === 12) hours = 0;
      const now = new Date();
      now.setHours(hours, minutes, seconds || 0, 0);
      return now;
    }

    function isNowInClassRange(startStr, endStr) {
      const now = new Date();
      const start = parseTime(startStr);
      // Muestra la clase en pantalla desde 60 minutos antes de comenzar
      start.setMinutes(start.getMinutes() - 60);
      const end = parseTime(endStr);
      return now >= start && now <= end;
    }

    // === RELOJ Y FECHA EN TIEMPO REAL ===
    function actualizarFechaHora() {
      const ahora = new Date();
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      const dia = dias[ahora.getDay()];
      const diaMes = ahora.getDate();
      const mes = meses[ahora.getMonth()];
      const año = ahora.getFullYear();

      document.getElementById('dia-actual').textContent = getCurrentDayName();
      document.getElementById('fecha-completa').textContent = `${dia}, ${diaMes} de ${mes} de ${año}`;

      const horaFormateada = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      document.getElementById('hora-actual').textContent = horaFormateada;
      document.getElementById('footer-year').textContent = `© ${año} CERTUS`;
    }

    // === ALTERNANCIA DE VISTAS (HORARIO <-> PUBLICIDAD) ===
    function cambiarVista(nuevaVista) {
      if (vistaActual === nuevaVista) return;
      vistaActual = nuevaVista;

      if (nuevaVista === 'clases') {
        document.body.classList.remove('vista-publicidad-activa');
        document.body.classList.add('vista-clases-activa');

        // Pausar y limpiar motor de publicidad
        adsEngineActive = false;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }
        document.getElementById('progress-bar').style.width = "0%";

        // Pausar todos los videos de publicidad activos para ahorrar CPU
        var videos = document.querySelectorAll('#vista-publicidad video');
        for (var i = 0; i < videos.length; i++) {
          try {
            videos[i].pause();
          } catch (e) { }
        }
      } else {
        document.body.classList.remove('vista-clases-activa');
        document.body.classList.add('vista-publicidad-activa');

        // Iniciar / Reanudar motor de publicidad
        adsEngineActive = true;

        if (elements.length === 0) {
          fetchPublicidadContent();
        } else {
          if (currentIndex === -1) {
            currentIndex = 0;
          }
          renderCurrentItem();
        }
      }
    }

    // === CARGAR HORARIOS DESDE GOOGLE SHEET ===
    async function cargarHorario() {
      const dia = getCurrentDayName();

      if (dia === "DOMINGO") {
        cambiarVista('publicidad'); // El domingo se muestra publicidad al no haber clases
        return;
      }

      try {
        const url = baseUrl + dia;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status} al cargar día ${dia}`);
        }
        
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.warn("Los datos recibidos no son un array:", data);
          // Si no es un array, probablemente es un error de la hoja o está vacía
          cambiarVista('publicidad');
          return;
        }

        const clasesActivas = data.filter(row =>
          row && row["Curso"] && row["Hr Ini Cls"] && row["Hr Fin Cls"] &&
          isNowInClassRange(row["Hr Ini Cls"], row["Hr Fin Cls"])
        );

        if (clasesActivas.length === 0) {
          // Si no hay clases activas, cambiamos a publicidad
          cambiarVista('publicidad');
          return;
        }

        // Si hay clases, aseguramos que la vista activa sea 'clases'
        cambiarVista('clases');

        const contenedor = document.getElementById("vista-horario");
        let table = contenedor.querySelector("table");

        if (!table) {
          contenedor.innerHTML = ''; // Limpiar empty states
          table = document.createElement("table");

          const thead = document.createElement("thead");
          const headerRow = thead.insertRow();
          ["Curso", "Sección", "Hr Inicio", "Hr Fin", "Ambiente", "Docente"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
          });
          table.appendChild(thead);

          const tbody = document.createElement("tbody");
          table.appendChild(tbody);
          contenedor.appendChild(table);
        }

        const tbody = table.querySelector("tbody");
        const filasAnteriores = [...tbody.querySelectorAll("tr[data-id]")];
        const nuevasKeys = new Set();

        clasesActivas.forEach(row => {
          const id = row["Curso"] + row["Sección"] + row["Hr Ini Cls"];
          nuevasKeys.add(id);

          let fila = tbody.querySelector(`tr[data-id="${id}"]`);

          if (!fila) {
            fila = tbody.insertRow();
            fila.dataset.id = id;
            fila.classList.add("fila-entrando");

            ["Curso", "Sección", "Hr Ini Cls", "Hr Fin Cls", "Ambiente", "Docente"].forEach(key => {
              const td = fila.insertCell();
              td.textContent = row[key] || "";
            });
          }
        });

        // Eliminar filas de clases que ya terminaron con animación
        filasAnteriores.forEach(fila => {
          const id = fila.dataset.id;
          if (!nuevasKeys.has(id)) {
            fila.classList.add("fila-saliendo");
            setTimeout(() => fila.remove(), 400);
          }
        });

      } catch (error) {
        console.error("Error cargando horario:", error);
        // Si hay un error, nos mantenemos en la vista de horarios con indicador de reconexión
        var wrapper = document.getElementById("vista-horario");
        if (!wrapper.querySelector('table')) {
          wrapper.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <div class="empty-title">Reconectando con Horarios...</div>
              <div class="empty-subtitle">Reintentando conexión. Los horarios y publicidad se sincronizarán pronto.</div>
            </div>
          `;
        }
      }
    }

    // === MOTOR SEAMLESS DE PUBLICIDAD LOCAL ===
    function fetchPublicidadContent() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'get_content.php?t=' + new Date().getTime(), true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.length > 0) {
              elements = data;
              if (adsEngineActive && currentIndex === -1) {
                currentIndex = 0;
                renderCurrentItem();
              }
            }
          } catch (e) { }
        }
      };
      xhr.send();
    }

    function showNext() {
      if (isNightMode || !adsEngineActive) return;

      // Solicitar nuevos contenidos al llegar al final (asíncrono)
      if (currentIndex !== -1 && currentIndex + 1 >= elements.length) {
        fetchPublicidadContent();
      }

      currentIndex = (currentIndex + 1) % elements.length;
      renderCurrentItem();
    }

    function renderCurrentItem() {
      if (!adsEngineActive || isNightMode) return;

      var item = elements[currentIndex];
      if (!item) return;

      var containerA = document.getElementById('container-a');
      var containerB = document.getElementById('container-b');


      var nextContainer = containerToggle ? containerB : containerA;
      var currentContainer = containerToggle ? containerA : containerB;

      var bgLayer = nextContainer.querySelector('.media-bg');
      var contentLayer = nextContainer.querySelector('.content-holder');
      contentLayer.innerHTML = '';

      if (item.tipo === 'imagen') {
        var img = new Image();
        img.onload = function () {
          if (!adsEngineActive) return;
          bgLayer.style.backgroundImage = "url('" + item.src + "')";
          contentLayer.style.backgroundImage = "url('" + item.src + "')";
          contentLayer.innerHTML = '';
          transition(currentContainer, nextContainer, item.duracion);
        };
        img.onerror = function () {
          showNext();
        };
        img.src = item.src;
      } else if (item.tipo === 'video') {
        var video = document.createElement('video');
        video.src = item.src;
        video.autoplay = true;
        video.muted = !audioUnlocked; // Iniciar silenciado si no se ha desbloqueado el audio
        video.volume = 1.0;
        video.playsInline = true; // Necesario para algunos navegadores móviles/TVs

        var videoEnded = false;
        var loadTimeout = setTimeout(function() {
          if (!videoEnded && video.paused) {
            console.warn("Video demoró demasiado en cargar o está pausado, saltando...");
            videoEnded = true;
            showNext();
          }
        }, 10000); // 10 segundos de margen para carga

        video.onplaying = function () {
          clearTimeout(loadTimeout);
          if (!adsEngineActive) {
            video.pause();
            return;
          }

          // Warm-up delay de 800ms para evitar congelamiento en TVs antiguas
          setTimeout(function() {
            if (!adsEngineActive) return;
            // Solo intentar quitar el silencio si el audio está desbloqueado para evitar pausas forzadas
            if (audioUnlocked) {
               video.muted = false;
            }
            bgLayer.style.backgroundImage = "none";
            transition(currentContainer, nextContainer, 0);
          }, 800);
        };

        video.ontimeupdate = function () {
          if (!adsEngineActive) return;
          if (video.duration > 0 && !videoEnded && (video.duration - video.currentTime) <= 0.6) {
            videoEnded = true;
            showNext();
          }
        };

        video.onended = function () { 
          if (!videoEnded) { 
            videoEnded = true; 
            showNext(); 
          } 
        };

        video.onerror = function () {
          clearTimeout(loadTimeout);
          if (!videoEnded) { 
            videoEnded = true; 
            showNext(); 
          }
        };

        contentLayer.appendChild(video);

        var p = video.play();
        if (p !== undefined) {
          p.catch(function (e) {
            console.warn("Autoplay bloqueado por el navegador, reproduciendo silenciado...");
            video.muted = true;
            video.play().catch(err => {
               console.error("Error fatal al intentar reproducir video:", err);
               showNext();
            });
          });
        }
      }
    }

    // Transición fluida entre contenedores (cross-fade)
    function transition(current, next, duration) {
      current.style.opacity = "0";
      next.style.opacity = "1";
      containerToggle = !containerToggle;


      // Detener videos viejos tras la animación de cross-fade de 1.5s
      setTimeout(function () {
        var viejos = current.querySelectorAll('video');
        for (var i = 0; i < viejos.length; i++) {
          try { viejos[i].pause(); } catch (e) { }
        }
      }, 1500);

      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (duration > 0) {
        animateProgress(duration);
        timer = setTimeout(showNext, duration);
      } else {
        document.getElementById('progress-bar').style.width = "0%";
      }
    }

    function animateProgress(duration) {
      var start = new Date().getTime();
      if (progressTimer) clearInterval(progressTimer);

      progressTimer = setInterval(function () {
        if (!adsEngineActive || isNightMode) {
          clearInterval(progressTimer);
          return;
        }
        var now = new Date().getTime();
        var perc = ((now - start) / duration) * 100;
        if (perc > 100) perc = 100;
        document.getElementById('progress-bar').style.width = perc + "%";
        if (perc >= 100) clearInterval(progressTimer);
      }, 50);
    }

    // === MODO NOCTURNO / REPOSO INTELIGENTE ===
    function modoNocturno() {
      const ahora = new Date();
      const dia = ahora.getDay();
      const horas = ahora.getHours();
      const minutos = ahora.getMinutes();
      const totalMin = horas * 60 + minutos;

      const overlay = document.getElementById("overlay");
      let mostrarNegro = false;

      if (dia === 0) {
        mostrarNegro = true; // Domingo cerrado todo el día
      } else if (dia >= 1 && dia <= 6) {
        // Apagado de 11:00 PM (23:00) a 6:00 AM (06:00)
        if (totalMin >= 1380 || totalMin < 360) {
          mostrarNegro = true;
        }
      }

      if (mostrarNegro && !isNightMode) {
        isNightMode = true;
        overlay.style.display = "flex";

        // Pausar y silenciar toda publicidad
        if (timer) { clearTimeout(timer); timer = null; }
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        document.getElementById('progress-bar').style.width = "0%";
        var videos = document.querySelectorAll('#vista-publicidad video');
        for (var i = 0; i < videos.length; i++) {
          try { videos[i].pause(); } catch (e) { }
        }
      } else if (!mostrarNegro && isNightMode) {
        isNightMode = false;
        overlay.style.display = "none";

        // Reactivar motor
        if (adsEngineActive) {
          showNext();
        }
      }
    }

    // === INICIALIZACIÓN DE LA APLICACIÓN ===
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Desbloquear audio con el primer click en cualquier parte (necesario para Smart TVs)
    document.body.addEventListener('click', function () {
      console.log("Audio desbloqueado por usuario");
      audioUnlocked = true;
      var videos = document.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        videos[i].muted = false;
        videos[i].volume = 1.0;
      }
    }, { once: true });


    // Cargar Horario inicialmente y luego cada 5 segundos
    cargarHorario();
    setInterval(cargarHorario, 5000);

    // Cargar listado de publicidad inicialmente
    fetchPublicidadContent();

    // Modo nocturno inicial y chequeo cada minuto
    modoNocturno();
    setInterval(modoNocturno, 60000);

    // Auto-recarga cada 12 horas para prevenir fatiga de memoria en TVs viejas
    setInterval(() => location.reload(), 12 * 3600 * 1000);



  </script>
</body>

</html>