import { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog } from "electron";
import { ScriptManager } from "./script-manager.js";
import { logger } from "./logger.js";
import * as path from "path";
import * as fs from "fs";
let mainWindow: BrowserWindow | null = null;
const scriptManager = new ScriptManager();

function createWindow() {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(app.getAppPath(), 'dist', 'preload.js')
        }
    });

    mainWindow.loadURL("https://skribbl.io/");

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) return;
        mainWindow.webContents.insertCSS(fs.readFileSync(path.join(app.getAppPath(), 'src', 'css', 'style.css'), 'utf-8')).catch(err => {
            logger.error('Failed to inject CSS:', err);
        });
        scriptManager.injectScript(mainWindow.webContents).catch(err => {
            logger.error('Failed to inject script:', err);
        });
        scriptManager.showUpdatePopup(mainWindow.webContents).catch(err => {
            logger.error('Failed to show update popup:', err);
        });
        // mainWindow.webContents.executeJavaScript(`
        //     setTimeout(() => {
        //         console.log("hello world!");

        //         const div = document.createElement('div');
        //         div.id = 'electron-banner';
        //         div.innerText = 'Hello from Electron!';
        //         div.style.position = 'fixed';
        //         div.style.top = '10px';
        //         div.style.right = '10px';
        //         div.style.padding = '10px';
        //         div.style.background = 'black';
        //         div.style.color = 'white';
        //         div.style.zIndex = '9999';

        //         document.body.appendChild(div);
        //     }, 3e3);
        // `).catch(err => {
        //     console.error('Failed to inject HTML:', err);
        // });
    });
}


ipcMain.on("update-script", async () => {
    try {
        const response = await fetch('https://api.github.com/repos/toobeeh/skribbltypo/releases/latest', {
            headers: { 'User-Agent': 'skribbltypo-desktop' }
        });
        const release = await response.json();
        const asset = release.assets.find((a: any) => a.name === 'skribbltypo.user.js');
        if (asset) {
            await scriptManager.downloadScript(asset.browser_download_url, release.tag_name);
            if (mainWindow) {
                mainWindow.reload();
            }
        }
    } catch (err) {
        logger.error('Failed to update script from IPC:', err);
    }
});

const mainMenu = new Menu();

if (process.platform === 'darwin') {
    const appMenu = new MenuItem({ role: 'appMenu' });
    mainMenu.append(appMenu);
}

const submenu = Menu.buildFromTemplate([
    {
        label: "Open DevTools",
        click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.openDevTools();
        },
        accelerator: "CmdOrCtrl+Shift+I",
    },
    {
        label: "Check for Updates",
        click: () => {
            if (!mainWindow) return;
            scriptManager.checkForUpdates().catch(err => {
                logger.error('Manual update check failed:', err);
            });
        },
    }
]);
mainMenu.append(new MenuItem({ label: "FXClient", submenu }));

Menu.setApplicationMenu(mainMenu);

app.whenReady().then(async () => {
    await scriptManager.checkForUpdates();
    createWindow();

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
