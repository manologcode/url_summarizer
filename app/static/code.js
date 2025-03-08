// Elementos del DOM
const urlInput = document.getElementById('urlInput');
const ultraSummaryToggle = document.getElementById('ultraSummaryToggle');
const audioToggle = document.getElementById('audioToggle');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const summarySection = document.getElementById('summarySection');
const summaryDate = document.getElementById('summaryDate');
const summaryUrl = document.getElementById('summaryUrl');
const urlLink = document.getElementById('urlLink');
const summaryContent = document.getElementById('summaryContent');
const audioPlayer = document.getElementById('audioPlayer');
const audioElement = document.getElementById('audioElement');
const errorAlert = document.getElementById('errorAlert');

// Configuración de la API
const SUMMARY_ENDPOINT = '/summary';

// Comprobar si la URL tiene formato válido
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Formatear la fecha actual
function formatDate() {
    const now = new Date();
    return now.toLocaleString();
}

// Mostrar mensaje de error
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

// Actualizar interfaz de carga
function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="spinner"></div> Generando...';
        loadingIndicator.style.display = 'block';
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg> Generar Resumen';
        loadingIndicator.style.display = 'none';
    }
}

// Generar resumen
async function generateSummary() {
    const url = urlInput.value.trim();
    const ultraSummary = ultraSummaryToggle.checked;
    const createAudio = audioToggle.checked;
    
    // Validar URL
    if (!url) {
        showError('Por favor, introduce una URL válida');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('La URL introducida no es válida');
        return;
    }
    
    // Preparar UI para carga
    setLoading(true);
    audioPlayer.style.display = 'none';
    
    try {
        // Hacer solicitud al endpoint de resumen
        const response = await fetch(`${SUMMARY_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                create_audio: createAudio,
                ultra_summary: ultraSummary
            }),
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Actualizar UI con el resumen
        summaryContent.textContent = data.summary || "No se pudo generar un resumen";
        summaryDate.textContent = `Generado el: ${formatDate()}`;
        urlLink.textContent = url;
        urlLink.href = url;
        summarySection.style.display = 'block';
        
        // Gestionar audio si está disponible
        if (createAudio && data.audio_url) {
            await checkAudioStatus(data.audio_url);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error al generar el resumen: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// Verificar el estado del audio
async function checkAudioStatus(audioUrl) {
    try {
        // Si la URL ya es completa
        if (audioUrl.startsWith('http')) {
            loadAudio(audioUrl);
            return;
        }
        
        // Si es solo un ID o path relativo
        const statusUrl = audioUrl.startsWith('/') 
            ? `${audioUrl}` 
            : `/status/${audioUrl}`;
        
        const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Error al verificar estado del audio: ${response.status}`);
        }
        
        const statusData = await response.json();
        
        if (statusData.status === 'completed') {
            // Cargar audio si está listo
            const audioFileUrl = statusData.audio_url || statusData.output_file || audioUrl;
            loadAudio(audioFileUrl.startsWith('/') ? `${audioFileUrl}` : audioFileUrl);
        } else if (statusData.status === 'failed') {
            showError(`Error al generar el audio: ${statusData.error_message || 'Error desconocido'}`);
        } else {
            // Continuar verificando si está en proceso
            setTimeout(() => checkAudioStatus(audioUrl), 2000);
        }
        
    } catch (error) {
        console.error('Error al verificar estado del audio:', error);
        showError(`Error al cargar el audio: ${error.message}`);
    }
}

// Cargar y mostrar el reproductor de audio
function loadAudio(audioUrl) {
    audioElement.src = audioUrl;
    audioPlayer.style.display = 'block';
    
    audioElement.addEventListener('error', () => {
        showError('No se pudo cargar el audio. Intente nuevamente más tarde.');
        audioPlayer.style.display = 'none';
    });
}

// Evento para generar resumen automáticamente al pegar una URL
urlInput.addEventListener('paste', (e) => {
    // Esperar un momento para que el valor se actualice
    setTimeout(() => {
        const url = urlInput.value.trim();
        if (isValidUrl(url)) {
            generateSummary();
        }
    }, 100);
});

// Evento principal para botón de generación
generateBtn.addEventListener('click', generateSummary);
