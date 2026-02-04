import { ipcMain, Notification } from "electron";
import { IPCChannel, NotificationPayload } from "../common/ipc.js";
import { WindowManager } from "./window-manager.js";
import { ScriptManager } from "../script-manager.js";
import { DiscordRPCManager } from "../discord-rpc.js";
import { logger } from "../logger.js";

export class IPCManager {
    constructor(
        private windowManager: WindowManager,
        private scriptManager: ScriptManager,
        private discordRPC: DiscordRPCManager,
    ) { }

    public registerHandlers() {
        ipcMain.handle(IPCChannel.GET_SCRIPT_BUNDLE, async () => {
            return await this.scriptManager.getBundle();
        });

        ipcMain.on(IPCChannel.UPDATE_SCRIPT, async () => {
            try {
                const response = await fetch(
                    "https://api.github.com/repos/toobeeh/skribbltypo/releases/latest",
                    {
                        headers: { "User-Agent": "skribbltypo-desktop" },
                    },
                );
                const release: any = await response.json();
                const asset = release.assets.find(
                    (a: any) => a.name === "skribbltypo.user.js",
                );
                if (asset) {
                    await this.scriptManager.downloadScript(
                        asset.browser_download_url,
                        release.tag_name,
                    );
                    this.windowManager.getWindow()?.reload();
                    logger.info("Updated script successfully");
                }
            } catch (err) {
                logger.error("Failed to update script from IPC:", err);
            }
        });

        ipcMain.on(IPCChannel.SHOW_NOTIFICATION, (_event, { title, body }: NotificationPayload) => {
            const mainWindow = this.windowManager.getWindow();
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

        ipcMain.on(IPCChannel.UPDATE_PRESENCE, (_event, data) => {
            this.discordRPC.updateActivity(data).catch((err) => {
                logger.error("Failed to update Discord presence:", err);
            });
        });
    }
}
