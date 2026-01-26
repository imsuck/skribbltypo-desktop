import { contextBridge, ipcRenderer, webFrame } from "electron";
import type { SetActivity } from "@visoftware/discord-rpc";

export interface IElectronAPI {
    updateScript: () => void;
    showNotification: (title: string, body: string) => void;
    updatePresence: (data: SetActivity) => void;
    readonly lobbyData: unknown | null;
}

// TODO: type this properly
let internalLobbyData: unknown | null = null;

window.addEventListener("message", (event: MessageEvent<any>) => {
    if (event.source === window && event.data?.type === "INTERCEPTED_DATA") {
        const payload = event.data.data;

        internalLobbyData = payload;

        console.debug(`[skribbltypo-desktop] Intercepted data: ${event.data}`);
    }
});

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
    showNotification: (title, body) =>
        ipcRenderer.send("show-notification", { title, body }),
    updatePresence: (data) => ipcRenderer.send("update-presence", data),
    get lobbyData() {
        return internalLobbyData;
    },
} as IElectronAPI);

const script: string = `
(() => {
    const NativeWS = window.WebSocket;

    function PatchedWebSocket(...args) {
        const ws = Reflect.construct(NativeWS, args, PatchedWebSocket);

        ws.addEventListener("message", (event) => {
            console.debug(
                "[skribbltypo-desktop] Intercepted message",
                event.data
            );

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
