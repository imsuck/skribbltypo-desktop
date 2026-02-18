import { logger } from "../logger.ts";

const NativeWS = window.WebSocket;

function PatchedWebSocket(this: any, ...args: any[]) {
    const ws = Reflect.construct(NativeWS, args, PatchedWebSocket);

    ws.addEventListener("message", (event: MessageEvent) => {
        window.postMessage({ type: "INTERCEPTED_DATA", data: event.data }, "*");
    });

    return ws;
}

PatchedWebSocket.prototype = NativeWS.prototype;

Object.assign(PatchedWebSocket, {
    CONNECTING: NativeWS.CONNECTING,
    OPEN: NativeWS.OPEN,
    CLOSING: NativeWS.CLOSING,
    CLOSED: NativeWS.CLOSED,
});

(window as any).WebSocket = PatchedWebSocket;

logger.debug("[skribbltypo-desktop] WebSocket Overwritten");

// Fallback timer
const fallback = setTimeout(() => {
    window.postMessage({ type: "GAME_LOADED" }, "*");
    window.dispatchEvent(new CustomEvent("skribbltypo:game-loaded"));
}, 10000);

const onLoaded = () => {
    clearTimeout(fallback);
    window.postMessage({ type: "GAME_LOADED" }, "*");
    window.dispatchEvent(new CustomEvent("skribbltypo:game-loaded"));
};

const setupBodyObserver = () => {
    if (document.body.dataset["typo_loaded"] === "true") {
        onLoaded();
        return;
    }

    const observer = new MutationObserver(() => {
        if (document.body.dataset["typo_loaded"] === "true") {
            onLoaded();
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-typo_loaded"],
    });
};

if (document.body) {
    setupBodyObserver();
} else {
    const root = document.documentElement || document;
    const bodyWatcher = new MutationObserver(() => {
        if (document.body) {
            bodyWatcher.disconnect();
            setupBodyObserver();
        }
    });
    bodyWatcher.observe(root, { childList: true });
}
