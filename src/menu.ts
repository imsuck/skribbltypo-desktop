import { BrowserWindow, clipboard, Menu, MenuItem } from "electron";
import { ScriptManager } from "./script-manager.js";
import { logger } from "./logger.js";
import { joinPopupScript } from "./guest/bundles.ts";

const mainMenu = new Menu();

if (process.platform === "darwin") {
    const appMenu = new MenuItem({ role: "appMenu" });
    mainMenu.append(appMenu);
}

export function setupMenu(
    mainWindow: BrowserWindow,
    scriptManager: ScriptManager,
) {
    const submenu = Menu.buildFromTemplate([
        {
            label: "Join game",
            click: () => {
                const cbContent = clipboard.readText();
                const getId = (str: string): string | null => {
                    str = str.trim();
                    const regex =
                        /^(?:https?:\/\/)?(?:www\.)?skribbl\.io\/\?\s*([A-Za-z0-9]{8})$|^([A-Za-z0-9]{8})$/;

                    const match = str.match(regex);
                    if (!match) return null;
                    return match[1] || match[2] || null;
                };
                const id: string | null = getId(cbContent);
                if (id) {
                    mainWindow.webContents.executeJavaScript(`
                        sessionStorage.setItem("skribbltypo-autoplay", "true");
                        window.location.href = "https://skribbl.io/?${id}";
                    `);
                } else {
                    mainWindow.webContents.executeJavaScript(joinPopupScript);
                }
            },
            accelerator: "F4",
        },
        {
            label: "Reload",
            click: () => {
                if (!mainWindow) return;
                mainWindow.reload();
            },
            accelerator: "CmdOrCtrl+R",
        },
        {
            label: "Force Reload",
            click: () => {
                if (!mainWindow) return;
                mainWindow.webContents.reloadIgnoringCache();
            },
            accelerator: "CmdOrCtrl+Shift+R",
        },
        {
            label: "Open DevTools",
            click: () => {
                if (!mainWindow) return;
                mainWindow.webContents.openDevTools();
            },
            accelerator: "CmdOrCtrl+Shift+I",
        },
        { type: "separator" },
        { role: "zoomIn", label: "Zoom In", accelerator: "CmdOrCtrl+=" },
        { role: "zoomOut", label: "Zoom Out", accelerator: "CmdOrCtrl+-" },
        { role: "resetZoom", label: "Reset Zoom", accelerator: "CmdOrCtrl+0" },
        { type: "separator" },
        {
            label: "Check for Updates",
            click: () => {
                if (!mainWindow) return;
                scriptManager.checkForUpdates().catch((err) => {
                    logger.error("Manual update check failed:", err);
                });
            },
        },
    ]);
    mainMenu.append(new MenuItem({ label: "Skribbl.io Desktop", submenu }));
    mainMenu.append(
        new MenuItem({
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "selectAll" },
            ],
        }),
    );

    Menu.setApplicationMenu(mainMenu);
}
