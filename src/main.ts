import { app, BrowserWindow, ipcMain, Notification, shell } from "electron";
import * as path from "path";

import { logger } from "./logger.js";
import { ScriptManager } from "./script-manager.js";
import { DiscordRPCManager } from "./discord-rpc.js";
// @ts-ignore LSP couldn't find the file :(
import mainStyles from "./css/style.css?raw";
import { setupMenu } from "./menu.js";

let mainWindow: BrowserWindow | null = null;
const scriptManager = new ScriptManager();
const discordRPC = new DiscordRPCManager();

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
    app.quit();
} else {
    app.on("second-instance", (_event, commandLine) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Protocol handler for Windows/Linux
            const url = commandLine.pop();
            if (url) {
                handleDeepLink(url);
            }
        }
    });

    // Protocol handler for macOS
    app.on("open-url", (_event, url) => {
        handleDeepLink(url);
    });
}

function handleDeepLink(url: string) {
    logger.debug("Handling deep link:", url);
    const id = url.replace("skribbl://", "").split(/[/?#]/)[0];
    if (id && /^[A-Za-z0-9]{8}$/.test(id)) {
        if (mainWindow) {
            mainWindow.loadURL(`https://skribbl.io/?${id}`);
        } else {
            // If window not yet created, we could store it for later
            // but app.whenReady() will create it soon.
            // For now, let's just make sure we load it.
            app.whenReady().then(() => {
                mainWindow?.loadURL(`https://skribbl.io/?${id}`);
            });
        }
    } else {
        logger.warn("Invalid deep link ID:", id);
    }
}

app.setAsDefaultProtocolClient("skribbl");

function createWindow() {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(app.getAppPath(), "dist", "preload.js"),
        },
    });

    const deepLinkUrl = process.argv.find((arg) =>
        arg.startsWith("skribbl://"),
    );
    if (deepLinkUrl) {
        const id = deepLinkUrl.replace("skribbl://", "").split(/[/?#]/)[0];
        if (id && /^[A-Za-z0-9]{8}$/.test(id)) {
            mainWindow.loadURL(`https://skribbl.io/?${id}`);
        } else {
            mainWindow.loadURL("https://skribbl.io/");
        }
    } else {
        mainWindow.loadURL("https://skribbl.io/");
    }

    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (!url.startsWith("https://skribbl.io")) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith("https://skribbl.io")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.webContents.on("did-finish-load", () => {
        if (!mainWindow) return;
        mainWindow.webContents.insertCSS(mainStyles).catch((err) => {
            logger.error("Failed to inject CSS:", err);
        });
        scriptManager.showUpdatePopup(mainWindow.webContents).catch((err) => {
            logger.error("Failed to show update popup:", err);
        });
    });
}

ipcMain.handle("get-script-bundle", async () => {
    return await scriptManager.getBundle();
});

ipcMain.on("update-script", async () => {
    try {
        const response = await fetch(
            "https://api.github.com/repos/toobeeh/skribbltypo/releases/latest",
            {
                headers: { "User-Agent": "skribbltypo-desktop" },
            },
        );
        const release = await response.json();
        const asset = release.assets.find(
            (a: any) => a.name === "skribbltypo.user.js",
        );
        if (asset) {
            await scriptManager.downloadScript(
                asset.browser_download_url,
                release.tag_name,
            );
            if (mainWindow) {
                mainWindow.reload();
            }
            logger.info("Updated script successfully");
        }
    } catch (err) {
        logger.error("Failed to update script from IPC:", err);
    }
});

ipcMain.on("show-notification", (_event, { title, body }) => {
    if (mainWindow && mainWindow.isFocused()) return;

    const notification = new Notification({
        title,
        body,
        silent: false,
    });

    notification.on("click", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    notification.show();
});

ipcMain.on("update-presence", (_event, data) => {
    discordRPC.updateActivity(data).catch((err) => {
        logger.error("Failed to update Discord presence:", err);
    });
});

app.whenReady().then(async () => {
    await scriptManager.checkForUpdates();
    await discordRPC.login();
    createWindow();

    setupMenu(mainWindow!, scriptManager);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
