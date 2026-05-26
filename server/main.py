import asyncio
import websockets
import json
import time
from aiohttp import web
from processor import VoskProcessor

MODEL_PATH = "./models/vosk-model-small-pt-0.3"
SAMPLE_RATE = 16000

widget_client = None
pending_queue = []  # textos aguardando o widget conectar

def timestamp():
    return time.strftime("%H:%M:%S")

print(f"[{timestamp()}] Carregando modelo Vosk...")
engine = VoskProcessor(MODEL_PATH, SAMPLE_RATE)


async def serve_widget(request):
    with open('./widget.html', 'r', encoding='utf-8') as f:
        html = f.read()
    return web.Response(
        text=html,
        content_type='text/html',
        headers={
            'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
        }
    )

async def start_http_server():
    app = web.Application()
    app.router.add_get('/widget.html', serve_widget)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()
    print(f"[{timestamp()}] Widget em http://localhost:8080/widget.html")

async def send_to_widget(text: str):
    global widget_client, pending_queue
    if widget_client is None:
        pending_queue.append(text)
        print(f"[{timestamp()}] Widget não conectado — texto enfileirado ({len(pending_queue)} pendentes)")
        return
    try:
        await widget_client.send(json.dumps({"text": text}))
    except Exception as e:
        print(f"[{timestamp()}] Erro ao enviar pro widget: {e}")
        widget_client = None
        pending_queue.append(text)

async def flush_pending():
    """Envia todos os textos pendentes assim que o widget conecta."""
    global widget_client, pending_queue
    if not pending_queue:
        return
    print(f"[{timestamp()}] Enviando {len(pending_queue)} texto(s) pendente(s) ao widget...")
    for text in list(pending_queue):
        if widget_client is None:
            break
        try:
            await widget_client.send(json.dumps({"text": text}))
            pending_queue.pop(0)
        except Exception as e:
            print(f"[{timestamp()}] Erro ao liberar fila: {e}")
            widget_client = None
            break

async def audio_handler(websocket):
    print(f"[{timestamp()}] Extensão conectada")
    try:
        async for message in websocket:
            text, is_final = engine.process_chunk(message)
            if text:
                if is_final:
                    print(f"[{timestamp()}] Final: {text}")
                    await send_to_widget(text)
                await websocket.send(json.dumps({
                    "text": text,
                    "final": is_final
                }))
    except websockets.exceptions.ConnectionClosed:
        print(f"[{timestamp()}] Extensão desconectada")

async def widget_handler(websocket):
    global widget_client
    widget_client = websocket
    print(f"[{timestamp()}] Widget conectado")
    await flush_pending()
    try:
        await websocket.wait_closed()
    finally:
        widget_client = None
        print(f"[{timestamp()}] Widget desconectado")

async def main():
    await start_http_server()
    print(f"[{timestamp()}] Áudio em ws://localhost:8765")
    print(f"[{timestamp()}] Widget WS em ws://localhost:8766")
    async with (
        websockets.serve(audio_handler, "localhost", 8765),
        websockets.serve(widget_handler, "localhost", 8766)
    ):
        await asyncio.Future()
        
if __name__ == "__main__":
    asyncio.run(main())