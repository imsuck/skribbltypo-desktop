import { app, BrowserWindow, clipboard, WebContents } from "electron";
import * as path from "path";
import { logger } from "../logger.js";

export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private heldKeys = new Set<string>();
    private potentialToggle = false;

    constructor(private readonly mainStyles: string) { }

    public createMainWindow(): BrowserWindow {
        this.mainWindow = new BrowserWindow({
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(app.getAppPath(), "dist", "preload.js"),
            },
        });

        this.mainWindow.on("blur", () => {
            this.heldKeys.clear();
            this.potentialToggle = false;
        });

        this.setupNavigationHandlers();
        this.setupInputHandlers();
        this.setupLoadHandlers();

        this.mainWindow.on("closed", () => {
            this.mainWindow = null;
        });

        return this.mainWindow;
    }

    public getWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    public loadGame(id?: string) {
        if (!this.mainWindow) return;
        const url = id ? `https://skribbl.io/?${id}` : "https://skribbl.io/";
        this.mainWindow.loadURL(url);
    }

    private setupNavigationHandlers() {
        if (!this.mainWindow) return;

        this.mainWindow.webContents.on("will-navigate", (event, url) => {
            if (!url.startsWith("https://skribbl.io")) {
                event.preventDefault();
            }
        });

        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (!url.startsWith("https://skribbl.io")) {
                return { action: "deny" };
            }
            return { action: "allow" };
        });
    }

    private setupInputHandlers() {
        if (!this.mainWindow) return;

        this.mainWindow.webContents.on("before-input-event", (event, input) => {
            if (input.type === "keyDown") {
                this.heldKeys.add(input.code);
                if (input.key === "Alt") {
                    this.potentialToggle = this.heldKeys.size === 1;
                } else if (input.key !== "Alt") {
                    this.potentialToggle = false;
                }
            } else if (input.type == "keyUp") {
                if (input.key === "Alt") {
                    event.preventDefault();
                    if (this.potentialToggle) {
                        this.mainWindow?.setMenuBarVisibility(
                            !this.mainWindow.isMenuBarVisible(),
                        );
                    }
                }
                this.heldKeys.delete(input.code);
                this.potentialToggle = false;
            }

            if (
                input.type === "keyDown" &&
                input.key.toLowerCase() === "c" &&
                (process.platform === "darwin" ? input.meta : input.control)
            ) {
                this.mainWindow?.webContents
                    .executeJavaScript("window.getSelection().toString()")
                    .then((selection) => {
                        if (selection) {
                            clipboard.writeText(selection);
                        }
                    });
            }
        });
    }

    private setupLoadHandlers() {
        if (!this.mainWindow) return;

        this.mainWindow.webContents.on("did-finish-load", () => {
            if (!this.mainWindow) return;
            this.mainWindow.webContents.insertCSS(this.mainStyles).catch((err) => {
                logger.error("Failed to inject CSS:", err);
            });
        });
    }

    public handleDeepLink(url: string) {
        logger.debug("Handling deep link:", url);
        const id = url.replace("skribbl://", "").split(/[/?#]/)[0];
        if (id && /^[A-Za-z0-9]{8}$/.test(id)) {
            if (this.mainWindow) {
                this.loadGame(id);
            } else {
                app.whenReady().then(() => {
                    this.loadGame(id);
                });
            }
        } else {
            logger.warn("Invalid deep link ID:", id);
        }
    }
}
