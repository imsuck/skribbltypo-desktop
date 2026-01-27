import { contextBridge, ipcRenderer, webFrame } from "electron";
import type { SetActivity } from "@visoftware/discord-rpc";
import { parseSocketIO } from "./utils/socket-io.js";

export interface IElectronAPI {
    updateScript: () => void;
    showNotification: (title: string, body: string) => void;
    updatePresence: (data: SetActivity) => void;
    lobbyData: () => any | null;
}

// TODO: type this properly
let internalLobbyData: any | null = null;

window.addEventListener("message", (event: MessageEvent<any>) => {
    if (event.source === window && event.data?.type === "INTERCEPTED_DATA") {
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

        console.debug(`[skribbltypo-desktop] Parsed data:`, internalLobbyData);
    }
});

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
    showNotification: (title, body) =>
        ipcRenderer.send("show-notification", { title, body }),
    updatePresence: (data) => ipcRenderer.send("update-presence", data),
    lobbyData: () => internalLobbyData,
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
})();
`;
webFrame.executeJavaScript(script);
