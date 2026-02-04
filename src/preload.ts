import { contextBridge, ipcRenderer, webFrame } from "electron";
import { IPCChannel, type IElectronAPI } from "./common/ipc.js";
import { logger } from "./logger.js";
import { parseSocketIO } from "./utils/socket-io.js";

import { interceptorScript } from "./guest/bundles.ts";

let internalLobbyData: any | null = null;
let gameLoaded: boolean = false;

window.addEventListener("message", (event: MessageEvent<any>) => {
    if (event.source === window) {
        if (event.data?.type === "INTERCEPTED_DATA") {
            let payload: any = event.data.data;

            const parsed = parseSocketIO(payload);
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
                !payload.hasOwnProperty("users") ||
                !payload.hasOwnProperty("id") ||
                payload.id.length !== 8
            ) {
                return;
            }

            internalLobbyData = payload;
            logger.debug("[skribbltypo-desktop] Parsed data:", internalLobbyData);
        } else if (event.data?.type === "GAME_LOADED") {
            gameLoaded = true;
            logger.debug("[skribbltypo-desktop] Game Loaded");
        }
    }
});

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send(IPCChannel.UPDATE_SCRIPT),
    showNotification: (title, body) =>
        ipcRenderer.send(IPCChannel.SHOW_NOTIFICATION, { title, body }),
    updatePresence: (data) => ipcRenderer.send(IPCChannel.UPDATE_PRESENCE, data),
    lobbyData: () => internalLobbyData,
    getScriptBundle: () => ipcRenderer.invoke(IPCChannel.GET_SCRIPT_BUNDLE),
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

webFrame.executeJavaScript(interceptorScript);

ipcRenderer.invoke(IPCChannel.GET_SCRIPT_BUNDLE).then((bundle: string) => {
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
