<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TV Publicidad | Certus</title>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        /* CSS Compatible con TVs antiguas */
        * {
            box-sizing: border-box;
            -webkit-box-sizing: border-box;
            user-select: none;
        }

        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: #000;
            overflow: hidden;
            font-family: 'Outfit', Arial, sans-serif;
            color: white;
        }

        /* Contenedores de Media */
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
            background-size: cover;
            background-position: center;
        }
        
        /* Efecto de fondo sin filtros complejos para TVs viejas */
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
            /* Usamos opacidad baja en lugar de blur si la TV es muy vieja */
            opacity: 0.3;
        }

        .media-container.active {
            opacity: 1;
            z-index: 2;
        }

        img, video, .content-holder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .content-holder {
            background-size: contain; /* Esto hace que la imagen toque los bordes sin salirse */
            background-repeat: no-repeat;
            background-position: center;
        }

        video {
            object-fit: contain;
        }

        /* Reloj Minimalista - Sin backdrop-filter (da problemas en TVs viejas) */
        #info-bar {
            position: absolute;
            bottom: 20px;
            right: 25px;
            z-index: 100;
            opacity: 0.6;
        }

        .glass-panel {
            background: rgba(0, 0, 0, 0.6); /* Fondo sólido semi-transparente */
            border-radius: 8px;
            padding: 5px 12px;
            text-align: right;
        }

        #clock {
            font-size: 1.4rem;
            font-weight: 300;
            line-height: 1;
            margin-bottom: 2px;
            letter-spacing: 1px;
            color: #fff;
        }

        #date {
            font-size: 0.75rem;
            font-weight: 300;
            opacity: 0.7;
            text-transform: capitalize;
            color: #fff;
        }

        /* Barra de progreso */
        #progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background: #00f2fe;
            opacity: 0.5;
            width: 0%;
            z-index: 110;
        }

        /* Pantalla de Reposo */
        #night-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: #000;
            z-index: 1000;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
    </style>
</head>
<body>

    <div id="container-a" class="media-container active">
        <div class="media-bg"></div>
        <div class="content-holder"></div>
    </div>
    <div id="container-b" class="media-container">
        <div class="media-bg"></div>
        <div class="content-holder"></div>
    </div>
    
    <div id="progress-bar"></div>

    <div id="info-bar">
        <div class="glass-panel">
            <div id="clock">00:00</div>
            <div id="date">Cargando...</div>
        </div>
    </div>

    <div id="night-overlay">
        <h1 style="font-weight: 300; color: #444;">Modo Reposo</h1>
    </div>

    <script>
        // JS compatible con Tizen 2014 / Navegadores viejos
        var elements = [];
        var currentIndex = -1;
        var isNightMode = false;
        var containerToggle = true;
        var timer = null;
        var progressTimer = null;

        var containerA = document.getElementById('container-a');
        var containerB = document.getElementById('container-b');
        var progressBar = document.getElementById('progress-bar');

        function updateClock() {
            var now = new Date();
            var hours = now.getHours();
            var minutes = now.getMinutes();
            if (hours < 10) hours = "0" + hours;
            if (minutes < 10) minutes = "0" + minutes;
            
            document.getElementById('clock').textContent = hours + ":" + minutes;
            if (now.getSeconds() % 30 === 0 || document.getElementById('date').textContent === "Cargando...") {
                var options = { weekday: 'long', day: 'numeric', month: 'long' };
                document.getElementById('date').textContent = now.toLocaleDateString('es-PE', options);
            }
            
            checkNightMode(now);
        }

        function fetchContent() {
            var xhr = new XMLHttpRequest();
            // Agregar timestamp para evitar cache en la TV antigua
            xhr.open('GET', 'get_content.php?t=' + new Date().getTime(), true); 
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data && data.length > 0) {
                            elements = data;
                            if (currentIndex === -1) {
                                currentIndex = 0;
                                renderCurrentItem();
                            }
                        }
                    } catch(e) {}
                }
            };
            xhr.send();
        }

        function showNext() {
            if (isNightMode) return;
            
            // Si llegamos al final de la lista de reproduccion, solicitar nuevos contenidos
            // Esto se hace asincronamente para NO interrumpir la reproduccion en pantalla
            if (currentIndex !== -1 && currentIndex + 1 >= elements.length) {
                fetchContent();
            }
            
            currentIndex = (currentIndex + 1) % elements.length;
            renderCurrentItem();
        }

        function renderCurrentItem() {
            var item = elements[currentIndex];
            
            var nextContainer = containerToggle ? containerB : containerA;
            var currentContainer = containerToggle ? containerA : containerB;
            
            var bgLayer = nextContainer.querySelector('.media-bg');
            var contentLayer = nextContainer.querySelector('.content-holder');
            contentLayer.innerHTML = '';

            if (item.tipo === 'imagen') {
                var img = new Image();
                img.onload = function() {
                    bgLayer.style.backgroundImage = "url('" + item.src + "')";
                    contentLayer.style.backgroundImage = "url('" + item.src + "')";
                    contentLayer.innerHTML = ''; 
                    transition(currentContainer, nextContainer, item.duracion);
                };
                img.onerror = function() {
                    showNext();
                };
                img.src = item.src;
            } else if (item.tipo === 'video') {
                var video = document.createElement('video');
                video.src = item.src;
                video.autoplay = true;
                video.muted = false;
                
                var videoEnded = false;

                video.onplaying = function() {
                    bgLayer.style.backgroundImage = "none";
                    transition(currentContainer, nextContainer, 0);
                };
                
                video.ontimeupdate = function() {
                    // Start next video 0.6s before current ends to mask loading freeze on old TVs
                    // Sin mostrar pantalla negra
                    if (video.duration > 0 && !videoEnded && (video.duration - video.currentTime) <= 0.6) {
                        videoEnded = true;
                        showNext();
                    }
                };
                
                video.onended = function() {
                    if (!videoEnded) {
                        videoEnded = true;
                        showNext();
                    }
                };
                
                video.onerror = function() {
                    if (!videoEnded) {
                        videoEnded = true;
                        showNext();
                    }
                };
                
                contentLayer.appendChild(video);
                
                // Forzamos catch en play
                var p = video.play();
                if (p !== undefined) {
                    p.catch(function() {});
                }
                
                // Fallback de audio 
                setTimeout(function() {
                    if (video.paused) {
                        video.muted = true;
                        var promisePlay = video.play();
                        if (promisePlay !== undefined) promisePlay.catch(function(){});
                    }
                }, 1000);
            }
        }

        function transition(current, next, duration) {
            current.style.opacity = "0";
            next.style.opacity = "1";
            containerToggle = !containerToggle;
            
            // Apagar los videos del contenedor viejo DESPUÉS de 1.5s (tiempo que dura la animación CSS)
            // Esto asegura que la transición sea fluida sin parpadeos ni pantallas negras
            setTimeout(function() {
                var viejos = current.querySelectorAll('video');
                for(var i=0; i<viejos.length; i++) {
                    try { viejos[i].pause(); } catch(e){}
                }
            }, 1500);

            // Limpiar SIEMPRE el temporizador anterior
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            
            if (duration > 0) {
                animateProgress(duration);
                timer = setTimeout(showNext, duration);
            } else {
                progressBar.style.width = "0%";
            }
        }

        function animateProgress(duration) {
            var start = new Date().getTime();
            if (progressTimer) clearInterval(progressTimer);
            
            progressTimer = setInterval(function() {
                var now = new Date().getTime();
                var perc = ((now - start) / duration) * 100;
                if (perc > 100) perc = 100;
                progressBar.style.width = perc + "%";
                if (perc >= 100) clearInterval(progressTimer);
            }, 50);
        }

        function checkNightMode(now) {
            var day = now.getDay();
            var totalMins = now.getHours() * 60 + now.getMinutes();
            var shouldBeOff = (day === 0 || totalMins >= 1380 || totalMins < 390);

            if (shouldBeOff && !isNightMode) {
                isNightMode = true;
                document.getElementById('night-overlay').style.display = 'flex';
            } else if (!shouldBeOff && isNightMode) {
                isNightMode = false;
                document.getElementById('night-overlay').style.display = 'none';
                showNext();
            }
        }

        // Inicio compatible
        setInterval(updateClock, 1000);
        updateClock();
        fetchContent();
        setInterval(function() { location.reload(); }, 12 * 3600 * 1000);

    </script>
</body>
</html>
