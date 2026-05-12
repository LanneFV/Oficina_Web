import asyncio
import websockets
import json
import time
from aiohttp import web
from processor import VoskProcessor

MODEL_PATH = "./models/vosk-model-small-pt-0.3"
SAMPLE_RATE = 16000
widget_client = None


def timestamp():
    return time.strftime("%H:%M:%S")


print(f"[{timestamp()}] Carregando modelo Vosk...")
engine = VoskProcessor(MODEL_PATH, SAMPLE_RATE)


async def serve_widget(request):
    return web.FileResponse('./widget.html')


async def start_http_server():
    app = web.Application()
    app.router.add_get('/widget.html', serve_widget)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()
    print(f"[{timestamp()}] Widget em http://localhost:8080/widget.html")


async def send_to_widget(text: str):
    global widget_client
    if widget_client is None:
        print(f"[{timestamp()}] Widget não conectado")
        return
    try:
        await widget_client.send(json.dumps({"text": text}))
    except Exception as e:
        print(f"[{timestamp()}] Erro ao enviar pro widget: {e}")
        widget_client = None


async def audio_handler(websocket):
    print(f"[{timestamp()}] Extensão conectada")
    try:
        async for message in websocket:
            chunk, full_text, is_final = engine.process_chunk(message)

            # Envia ao VLibras assim que tiver um chunk estável
            if chunk:
                tag = "Final" if is_final else "Parcial"
                print(f"[{timestamp()}] {tag} -> VLibras: {chunk}")
                await send_to_widget(chunk)

            # Continua mandando o texto cheio pra extensão (legenda)
            if full_text:
                await websocket.send(json.dumps({
                    "text": full_text,
                    "final": is_final
                }))
    except websockets.exceptions.ConnectionClosed:
        # Recupera o que sobrou no buffer do Vosk
        chunk, _ = engine.get_final()
        if chunk:
            print(f"[{timestamp()}] Resto final -> VLibras: {chunk}")
            await send_to_widget(chunk)
        print(f"[{timestamp()}] Extensão desconectada")


async def widget_handler(websocket):
    global widget_client
    widget_client = websocket
    print(f"[{timestamp()}] Widget conectado")
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