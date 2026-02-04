import { app, BrowserWindow } from "electron";
import { logger } from "./logger.js";
import { ScriptManager } from "./script-manager.js";
import { DiscordRPCManager } from "./discord-rpc.js";
// @ts-ignore
import mainStyles from "./css/style.css?raw";
import { setupMenu } from "./menu.js";
import { WindowManager } from "./managers/window-manager.js";
import { IPCManager } from "./managers/ipc-manager.js";

const scriptManager = new ScriptManager();
const discordRPC = new DiscordRPCManager();
const windowManager = new WindowManager(mainStyles);
const ipcManager = new IPCManager(windowManager, scriptManager, discordRPC);

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
    app.quit();
} else {
    app.on("second-instance", (_event, commandLine) => {
        const mainWindow = windowManager.getWindow();
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const url = commandLine.pop();
            if (url) {
                windowManager.handleDeepLink(url);
            }
        }
    });

    app.on("open-url", (_event, url) => {
        windowManager.handleDeepLink(url);
    });
}

app.setAsDefaultProtocolClient("skribbl");

app.whenReady().then(async () => {
    await scriptManager.checkForUpdates();
    await discordRPC.login();

    const mainWindow = windowManager.createMainWindow();

    const deepLinkUrl = process.argv.find((arg) =>
        arg.startsWith("skribbl://"),
    );
    if (deepLinkUrl) {
        windowManager.handleDeepLink(deepLinkUrl);
    } else {
        windowManager.loadGame();
    }

    ipcManager.registerHandlers();
    setupMenu(mainWindow, scriptManager);

    mainWindow.webContents.on("did-finish-load", () => {
        scriptManager.showUpdatePopup(mainWindow.webContents).catch((err) => {
            logger.error("Failed to show update popup:", err);
        });
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            windowManager.createMainWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
