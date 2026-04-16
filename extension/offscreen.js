// Variáveis globais para podermos acessá-las na hora de parar
let audioContext;
let ws;
let mediaStream;
let processor;
let source;

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target === 'offscreen') {
        if (message.type === 'PROCESSAR_AUDIO') {
            conectarVosk();
            capturarEProcessar(message.streamId);
        } else if (message.type === 'PARAR_AUDIO') {
            pararTudo();
        }
    }
});

function conectarVosk() {
    ws = new WebSocket('ws://localhost:2700'); 
    ws.onopen = () => console.log("Conectado ao Vosk!");
    ws.onmessage = (event) => {
        const resultado = JSON.parse(event.data);
        
        if (resultado.text) {
            if (resultado.final) {
                console.log("%c FINAL: " + resultado.text, "color: green; font-weight: bold; font-size: 14px;");
            } else {
                console.log("Parcial:", resultado.text);
            }
        }
    };
}

async function capturarEProcessar(streamId) {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
            video: false
        });

        audioContext = new AudioContext({ sampleRate: 16000 }); 
        source = audioContext.createMediaStreamSource(mediaStream);
        
        source.connect(audioContext.destination);

        processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                ws.send(convertFloat32ToInt16(inputData));
            }
        };
    } catch (error) {
        console.error('Erro na captura:', error);
    }
}

// NOVA FUNÇÃO AQUI:
function pararTudo() {
    console.log("Parando captura e encerrando conexões...");

    // 1. Fecha a conexão com o servidor Python
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }

    // 2. Desconecta os processadores de áudio
    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
    }
    if (source) {
        source.disconnect();
    }

    // 3. Desliga o motor de áudio
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }

    // 4. IMPORTANTE: Para a captura da aba no Chrome (some o ícone azul da aba)
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
}
function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
        let s = Math.max(-1, Math.min(1, buffer[l]));
        buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf.buffer;
}