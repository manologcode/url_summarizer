# URL Summarizer

URL Summarizer es una aplicación que extrae el contenido de una URL, lo envía a un servicio externo de LLM para generar un resumen y lo muestra en pantalla. Además, ofrece la opción de generar un audio del resumen utilizando otro servicio externo.

## Características
- Extrae el contenido de una URL y lo resume utilizando un servicio externo de LLM.
- Permite generar un audio del resumen mediante un servicio de conversión de texto a voz.
- Diseñado para ejecutarse en un entorno local (self-hosted).
- Se ejecuta con Docker para facilitar su despliegue.

## Requisitos
- Docker y Docker Compose instalados en el sistema.
- Claves de API para los servicios de LLM y generación de audio.

## Instalación y Ejecución
1. Clona el repositorio:
   ```sh
   git clone https://github.com/tuusuario/url-summarizer.git
   cd url-summarizer
   ```

2. En el docker-compose esta la variables que apuntan a los servicio,puede ser el nombre del servicio docker o la direccion de red:
   ```sh
      - URL_XTTS=http://192.168.1.69:5008
      - LLM_MODEL=mistral
      - LLM_URL=http://ollama:11434/api/generate
   ```

3. correr directamente la aplicacion con docker:
   ```sh
   docker run -d \
  --name url_summarizer \
  -p 5001:5088 \
  -e URL_XTTS=http://192.168.1.69:5008 \
  -e LLM_MODEL=mistral \
  -e LLM_URL=http://192.168.1.69:11434/api/generate \
  manologcode/url_summarizer
   ```

4. Accede a la aplicación en tu navegador en `http://localhost:5001`.


## Tecnologías utilizadas
- Python
- FastAPI (o el framework que uses)
- Docker
- Servicios externos para LLM y generación de audio

## Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

