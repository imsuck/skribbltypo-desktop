const { contextBridge, ipcRenderer } = require("electron");

export interface IElectronAPI {
    updateScript: () => void;
    showNotification: (title: string, body: string) => void;
    updatePresence: (data: any) => void;
}

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
    showNotification: (title: string, body: string) =>
        ipcRenderer.send("show-notification", { title, body }),
    updatePresence: (data: any) => ipcRenderer.send("update-presence", data),
} as IElectronAPI);
