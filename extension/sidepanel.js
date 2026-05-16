// ── Estado ──────────────────────────────────────────────
const queue = [];
let paused = false;
let listening = false;
let wsVlibras = null;
let iframeReady = false;
let avatarIframe = null;

// ── Elementos ────────────────────────────────────────────
const connBadge   = document.getElementById('conn-badge') || { className: '' };
const connLabel   = document.getElementById('conn-label') || { textContent: '' };
const nowText     = document.getElementById('now-text');
const bars        = document.getElementById('bars');
const statusMsg   = document.getElementById('status-msg');
const pauseBtn    = document.getElementById('pause-btn');
const pauseIcon   = document.getElementById('pause-icon');
const pauseLabel  = document.getElementById('pause-label');
const clearBtn    = document.getElementById('clear-btn');
const queueList   = document.getElementById('queue-list') || { innerHTML: '' };
const qCount      = document.getElementById('q-count') || { textContent: '' };
const listenBtn   = document.getElementById('listen-btn');
const listenIcon  = document.getElementById('listen-icon');
const listenLabel = document.getElementById('listen-label');
const avatarWrap  = document.getElementById('avatar-wrap');
const placeholder = document.getElementById('avatar-placeholder');

// ── Iframe do avatar ──────────────────────────────────────
function criarIframe() {
    if (avatarIframe) {
        avatarIframe.style.display = 'block';
        placeholder.style.display = 'none';
        return;
    }
    avatarIframe = document.createElement('iframe');
    avatarIframe.src = 'http://localhost:8080/widget.html';
    avatarIframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    avatarIframe.onload = () => { iframeReady = true; };
    placeholder.style.display = 'none';
    avatarWrap.appendChild(avatarIframe);
}

function removerIframe() {
    if (avatarIframe) {
        avatarIframe.style.display = 'none';
    }
    placeholder.style.display = 'flex';
}

function enviarParaAvatar(text) {
    if (!avatarIframe || !iframeReady) return;
    avatarIframe.contentWindow.postMessage({ type: 'TRADUZIR', text }, '*');
}

// Escuta quando o avatar termina a animação
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ANIMACAO_FIM') {
        if (!paused && queue.length > 0) {
            setTimeout(processQueue, 300);
        } else if (queue.length === 0) {
            setIdle();
        }
    }
});

// ── WebSocket para o servidor Python (porta 8766) ─────────
function conectarVlibras() {
    wsVlibras = new WebSocket('ws://localhost:8766');
    wsVlibras.onopen = () => {
        setConn(true);
        statusMsg.textContent = 'Conectado · aguardando texto';
    };
    wsVlibras.onerror = () => setConn(false);
    wsVlibras.onclose = () => {
        setConn(false);
        setTimeout(conectarVlibras, 3000);
    };
    wsVlibras.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (!data.text) return;
        enqueue(data.text);
    };
}

// ── Helpers de UI ─────────────────────────────────────────
function setConn(online) {
    connBadge.className = 'conn-badge ' + (online ? 'on' : 'off');
    connLabel.textContent = online ? 'Online' : 'Offline';
}

function renderQueue() {
    const count = queue.length;
    qCount.textContent = count > 0 ? `${count} pendente${count > 1 ? 's' : ''}` : '0 pendentes';
    clearBtn.disabled = count === 0;
    if (count === 0) {
        queueList.innerHTML = '<div class="queue-empty">Nenhum texto na fila</div>';
        return;
    }
    queueList.innerHTML = queue.map((txt, i) => `
        <div class="queue-item">
            <span class="q-num">${i + 1}</span>
            <span class="q-text">${escHtml(txt)}</span>
            <button class="q-del" data-index="${i}" title="Remover">
                <i class="ti ti-x" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setPlaying(text) {
    nowText.textContent = text;
    nowText.classList.remove('now-idle');
    bars.classList.remove('hidden');
    pauseBtn.disabled = false;
    clearBtn.disabled = false;
    statusMsg.textContent = `Traduzindo · ${queue.length} na fila`;
}

function setIdle() {
    nowText.textContent = 'Aguardando texto...';
    nowText.classList.add('now-idle');
    bars.classList.add('hidden');
    pauseBtn.disabled = true;
    statusMsg.textContent = queue.length > 0 ? `${queue.length} item(s) na fila` : 'Parado';
}

// ── Fila ──────────────────────────────────────────────────
function enqueue(text) {
    queue.push(text);
    renderQueue();
    if (!paused) processQueue();
}

function processQueue() {
    if (queue.length === 0) { setIdle(); return; }
    const text = queue.shift();
    renderQueue();
    setPlaying(text);
    enviarParaAvatar(text);
}

function removeItem(index) {
    queue.splice(index, 1);
    renderQueue();
    if (queue.length === 0) setIdle();
}

// ── Controles ─────────────────────────────────────────────
function togglePause() {
    paused = !paused;
    if (paused) {
        pauseBtn.classList.add('paused');
        pauseIcon.className = 'ti ti-player-play';
        pauseLabel.textContent = 'Retomar';
        statusMsg.textContent = 'Pausado';
        bars.style.opacity = '0.3';
    } else {
        pauseBtn.classList.remove('paused');
        pauseIcon.className = 'ti ti-player-pause';
        pauseLabel.textContent = 'Pausar';
        bars.style.opacity = '1';
        processQueue();
    }
}

function clearQueue() {
    queue.length = 0;
    renderQueue();
    setIdle();
}

// ── Captura ───────────────────────────────────────────────
function toggleCaptura() {
    listening = !listening;
    if (listening) {
        listenBtn.classList.add('listening');
        listenIcon.className = 'ti ti-player-stop';
        listenLabel.textContent = 'Parar captura';
        criarIframe();
        chrome.runtime.sendMessage({ action: 'INICIAR_CAPTURA' });
    } else {
        listenBtn.classList.remove('listening');
        listenIcon.className = 'ti ti-microphone';
        listenLabel.textContent = 'Ouvir vídeo';
        chrome.runtime.sendMessage({ action: 'PARAR_CAPTURA' });
        removerIframe();
        clearQueue();
    }
}

// ── Escuta textos do offscreen ────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'TEXTO_TRANSCRITO' && msg.text) {
        enqueue(msg.text);
    }
});

// ── Event listeners ───────────────────────────────────────
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('clear-btn').addEventListener('click', clearQueue);
document.getElementById('listen-btn').addEventListener('click', toggleCaptura);
document.getElementById('queue-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.q-del');
    if (btn) removeItem(Number(btn.dataset.index));
});

// ── Init ──────────────────────────────────────────────────
conectarVlibras();
renderQueue();

chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (res) => {
    if (res && res.listening) {
        listening = true;
        listenBtn.classList.add('listening');
        listenIcon.className = 'ti ti-player-stop';
        listenLabel.textContent = 'Parar captura';
        criarIframe();
    }
});