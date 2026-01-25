const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
    showNotification: (title: string, body: string) => ipcRenderer.send("show-notification", { title, body }),
    updatePresence: (data: any) => ipcRenderer.send("update-presence", data),
});
