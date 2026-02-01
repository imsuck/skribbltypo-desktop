import { contextBridge, ipcRenderer, webFrame } from "electron";
import type { SetActivity } from "@visoftware/discord-rpc";
import { parseSocketIO } from "./utils/socket-io.js";

export interface IElectronAPI {
    updateScript: () => void;
    showNotification: (title: string, body: string) => void;
    updatePresence: (data: SetActivity) => void;
    lobbyData: () => any | null;
    getScriptBundle: () => Promise<string>;
    isGameLoaded: () => boolean;
    onGameLoaded: (callback: () => void) => void;
}

// TODO: type this properly
let internalLobbyData: any | null = null;
let gameLoaded: boolean = false;

window.addEventListener("message", (event: MessageEvent<any>) => {
    if (event.source === window) {
        if (event.data?.type === "INTERCEPTED_DATA") {
            let payload: any = event.data.data;

            const parsed = parseSocketIO(payload);
            // We want to intercept only messages
            if (!parsed || parsed.engineType !== 4 || parsed.socketType !== 2) {
                return;
            }
            if (!parsed.data || parsed.data.event !== "data") {
                return;
            }
            payload = parsed.data.args[0].data;
            if (
                !payload ||
                !payload.hasOwnProperty("owner") ||
                !payload.hasOwnProperty("me") ||
                !payload.hasOwnProperty("users")
            ) {
                return;
            }

            // Maybe I should clean this up some day
            internalLobbyData = payload;

            console.debug(
                `[skribbltypo-desktop] Parsed data:`,
                internalLobbyData,
            );
        } else if (event.data?.type === "GAME_LOADED") {
            gameLoaded = true;
            console.debug(
                "[skribbltypo-desktop] Game Loaded detected in preload context",
            );
        }
    }
});

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
    showNotification: (title, body) =>
        ipcRenderer.send("show-notification", { title, body }),
    updatePresence: (data) => ipcRenderer.send("update-presence", data),
    lobbyData: () => internalLobbyData,
    getScriptBundle: () => ipcRenderer.invoke("get-script-bundle"),
    isGameLoaded: () => gameLoaded,
    onGameLoaded: (callback) => {
        if (gameLoaded) {
            callback();
            return;
        }
        window.addEventListener("skribbltypo:game-loaded", () => callback(), {
            once: true,
        });
    },
} as IElectronAPI);

const script: string = `
(() => {
    const NativeWS = window.WebSocket;

    function PatchedWebSocket(...args) {
        const ws = Reflect.construct(NativeWS, args, PatchedWebSocket);

        ws.addEventListener("message", (event) => {
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

    window.WebSocket = PatchedWebSocket;

    console.debug("[skribbltypo-desktop] WebSocket Overwritten");

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
        const bodyWatcher = new MutationObserver(() => {
            if (document.body) {
                bodyWatcher.disconnect();
                setupBodyObserver();
            }
        });
        bodyWatcher.observe(document.documentElement, { childList: true });
    }
})();
`;
webFrame.executeJavaScript(script);

ipcRenderer.invoke("get-script-bundle").then((bundle: string) => {
    webFrame.executeJavaScript(bundle);
});

window.addEventListener(
    "wheel",
    (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const currentZoom = webFrame.getZoomLevel();
            if (e.deltaY < 0) {
                webFrame.setZoomLevel(currentZoom + 0.5);
            } else {
                webFrame.setZoomLevel(currentZoom - 0.5);
            }
        }
    },
    { passive: false },
);
