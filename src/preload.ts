const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
});
