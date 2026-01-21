import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    updateScript: () => ipcRenderer.send("update-script"),
});
