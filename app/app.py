from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import os
from goose3 import Goose
import requests

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

URL_XTTL = os.getenv('URL_XTTL', "http://192.168.1.69:5008")
LLM_URL = os.getenv('LLM_URL', "mistral")
LLM_MODEL = os.getenv('LLM_MODEL', "http://192.168.1.69:11434/api/generate")

class SummaryRequest(BaseModel):
    url: str
    create_audio: bool = False
    ultra_summary: bool = False

@app.get("/", response_class=HTMLResponse)
async def html_ini():
    try:
        with open(os.path.join("static", "index.html"), "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")

@app.post("/summary/") 
def summarize(request: SummaryRequest):

    data_url = get_text_url(request.url)
    text_url = "'" + data_url['title'] + "\n" + data_url['text'] + "'"

    type_prompt=data_url['type']
    if request.ultra_summary:
        type_prompt += "-min"

    prompt_text = prepared_prompt_(type_prompt, text_url)
    summary = call_llms_api(prompt_text)

    audio_url = None
    if request.create_audio:
        job_id = text_to_speech(summary)
        audio_url=f"{URL_XTTL}/audio/{job_id}"

    return {
        "title": data_url['title'],
        "summary": summary,
        "audio_url": audio_url
    }
    

def text_to_speech(text):
    """Envía una solicitud a la API para convertir texto a voz."""
    url = f"{URL_XTTL}/text-to-speech"
    payload = {"text": text}

    response = requests.post(url, json=payload)
    if response.status_code == 200:
        job_id = response.json()["job_id"]
        print(f"Tarea enviada con éxito. Job ID: {job_id}")
        return job_id
    else:
        print(f"Error: {response.text}")
        return None 

def get_text_url(url):
    response_url = get_text_of_web(url)
    response_url['type'] = 'web'
    return response_url


def prepared_prompt_(type_prompt, text_prompt):
        return prompts[type_prompt]['pre_prompt'] + text_prompt + prompts[type_prompt]['post_prompt']

def call_llms_api(prompt):
    # url = "http://ser_llms:5010/responset"
    # data = { "question": prompt}

    url = LLM_URL
    data = { "model": LLM_MODEL,"prompt": prompt, "stream": False}

    response = call_api_post(url,data)
    result = response["response"]
    return result

def get_text_of_web(url):
    g = Goose()
    article = g.extract(url=url)
    response ={ 
          "title": f"""{article.title.replace('"', "'")}""",
          "text": f"""{article.cleaned_text.replace('"', "'")}"""
          }
    return response

def call_api_post(url,data):
    print(f"call_ser({url})")

    response = requests.post(url, json=data)
    # print(response)
    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=response.status_code, detail="Error calling API")
def normalize_name(text):
    nfkd_form = unicodedata.normalize('NFKD', text)
    only_ascii = nfkd_form.encode('ASCII', 'ignore').decode('ASCII')
    normalized = re.sub(r'[^a-zA-Z0-9\s]', '', only_ascii)
    final_filename = normalized.replace(' ', '_')
    final_filename = final_filename.lower()
    return final_filename

prompts={
    'web' : {
         'pre_prompt':
"""
Te paso el siguiente texto que corresponde un articulo de una web hagas un resumen
extrayendo las ideas principales de la misma y sintetizando al máximo pero sin omitir nada de la información relevante.
el texto es el siguiente:
" """
,
'post_prompt':""" "
Quiero que la respuesta sea en español, sin añadidos de consejos ni comentarios sobre el mismo,
no quiero que haga referencia al documento original, quiero que sea una redacción como un nuevo articulo sintetizado.
"""
    },


    'web-min' : {
         'pre_prompt':
"""
Te paso el siguiente texto que corresponde un articulo de una web hagas un resumen
extrayendo las ideas principales de la misma y sintetizando al máximo.
el texto es el siguiente:
" """
,
'post_prompt':""" "
Quiero que la respuesta sea en español, sin añadidos de consejos ni comentarios sobre el mismo,
no quiero que haga referencia al documento original, quiero que resumas lo máximo que puedas
y el resultado final tenga en numero mínimo de palabras posibles.
"""
    },
}



if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, log_level="info")

