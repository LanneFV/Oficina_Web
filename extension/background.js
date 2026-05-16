let isListening = false;

chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "INICIAR_CAPTURA") {
        isListening = true;
        iniciarCapturaDaAba();
    } else if (request.action === "PARAR_CAPTURA") {
        isListening = false;
        pararCaptura();
    } else if (request.action === "GET_STATUS") {
        sendResponse({ listening: isListening });
    }
    return true;
});

async function iniciarCapturaDaAba() {
    // Busca a aba ativa que seja uma página normal (não chrome:// ou extensão)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs.find(t => t.url && t.url.startsWith('http'));
    if (!tab) {
        // Fallback: busca a aba http mais recente em qualquer janela
        const allTabs = await chrome.tabs.query({ currentWindow: false });
        const httpTab = allTabs.filter(t => t.url && t.url.startsWith('http')).pop();
        if (!httpTab) { console.error('Nenhuma aba de vídeo encontrada'); return; }
        return iniciarCapturaNaAba(httpTab);
    }
    return iniciarCapturaNaAba(tab);
}

async function iniciarCapturaNaAba(tab) {

    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length === 0) {
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Capturar áudio do YouTube para transcrição via Vosk'
        });
    }

    chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
        chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'PROCESSAR_AUDIO',
            streamId: streamId
        });
    });
}

async function pararCaptura() {
    chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'PARAR_AUDIO'
    });

    setTimeout(async () => {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        if (existingContexts.length > 0) {
            await chrome.offscreen.closeDocument();
        }
    }, 500);
}