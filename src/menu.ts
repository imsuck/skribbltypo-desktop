import { BrowserWindow, clipboard, Menu, MenuItem } from "electron";

import { ScriptManager } from "./script-manager";
import { logger } from "./logger.js";

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
                    // Match full URL, partial URL, or raw code
                    const regex =
                        /^(?:https?:\/\/)?(?:www\.)?skribbl\.io\/\?\s*([A-Za-z0-9]{8})$|^([A-Za-z0-9]{8})$/;

                    const match = str.match(regex);

                    if (!match) return null;

                    // Code may be in group 1 (URL) or group 2 (raw)
                    return match[1] || match[2] || null;
                };
                const id: string | null = getId(cbContent);
                if (id) {
                    mainWindow.loadURL(`https://skribbl.io/?${id}`);
                } else {
                    mainWindow.webContents.executeJavaScript(`
                        (() => {
                            if (document.getElementById("skribbltypo-join-popup")) return;
                            const container = document.createElement("div");
                            container.id = "skribbltypo-join-popup";
                            container.innerHTML = \`
                                <h2>Join Game</h2>
                                <input type="text" id="skribbltypo-join-input" placeholder="Enter game code or URL" maxlength="28">
                                <div class="popup-buttons">
                                    <button id="skribbltypo-join-btn">Join</button>
                                    <button id="skribbltypo-join-cancel-btn">Cancel</button>
                                </div>
                            \`;
                            document.body.appendChild(container);

                            const input = document.getElementById("skribbltypo-join-input");
                            const joinBtn = document.getElementById("skribbltypo-join-btn");
                            const cancelBtn = document.getElementById("skribbltypo-join-cancel-btn");

                            input.focus();

                            const join = () => {
                                let val = input.value.trim();
                                if (!val) return;
                                
                                // Basic cleanup: extract ID if full URL was pasted
                                const match = val.match(/(?:[?&])?([A-Za-z0-9]{8})$/);
                                const id = match ? match[1] : val;

                                if (id.length === 8) {
                                    window.location.href = "https://skribbl.io/?" + id;
                                    container.remove();
                                } else {
                                    input.style.borderColor = "var(--COLOR_BUTTON_DANGER_BG)";
                                }
                            };

                            joinBtn.onclick = join;
                            cancelBtn.onclick = () => container.remove();
                            
                            input.onkeydown = (e) => {
                                if (e.key === "Enter") join();
                                if (e.key === "Escape") container.remove();
                            };
                        })();
                    `);
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

    Menu.setApplicationMenu(mainMenu);
}
