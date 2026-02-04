import { app, type WebContents } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "./logger.js";
import { gameObserverScript, updatePopupScript } from "./guest/bundles.ts";

export class ScriptManager {
    private readonly scriptPath = path.join(
        app.getPath("userData"),
        "skribbltypo.user.js",
    );
    private readonly versionPath = path.join(
        app.getPath("userData"),
        "version.json",
    );
    private readonly registryUrl =
        "https://api.github.com/repos/toobeeh/skribbltypo/releases/latest";
    private pendingUpdate: { latest: string; current: string } | null = null;

    private async getLocalVersion(): Promise<string | null> {
        try {
            const data = await fs.readFile(this.versionPath, "utf-8");
            return JSON.parse(data).version;
        } catch {
            return null;
        }
    }

    private async saveScript(content: string, version: string) {
        await fs.writeFile(this.scriptPath, content);
        await fs.writeFile(this.versionPath, JSON.stringify({ version }));
        this.pendingUpdate = null;
    }

    public async checkForUpdates(): Promise<{
        latest: string;
        current: string;
    } | null> {
        try {
            const response = await fetch(this.registryUrl, {
                headers: { "User-Agent": "skribbltypo-desktop" },
            });
            if (!response.ok) return null;

            const release: any = await response.json();
            const latestVersion = release.tag_name;
            const currentVersion = await this.getLocalVersion();

            const asset = release.assets.find(
                (a: any) => a.name === "skribbltypo.user.js",
            );
            if (!asset) return null;

            const downloadUrl = asset.browser_download_url;

            if (!currentVersion) {
                // First time download
                await this.downloadScript(downloadUrl, latestVersion);
                return null;
            } else if (currentVersion !== latestVersion) {
                logger.debug(
                    "New skribbltypo version available:",
                    latestVersion,
                );
                this.pendingUpdate = {
                    latest: latestVersion,
                    current: currentVersion,
                };
                return this.pendingUpdate;
            }
        } catch (err) {
            logger.error("Failed to check for updates:", err);
        }
        return null;
    }

    public async showUpdatePopup(webContents: WebContents) {
        if (!this.pendingUpdate) return;
        const { latest, current } = this.pendingUpdate;

        logger.info(`
            (${updatePopupScript})("${latest}", "${current}");
        `);

        await webContents.executeJavaScript(`
            (${updatePopupScript})("${latest}", "${current}");
        `);
    }

    public async downloadScript(url: string, version: string) {
        const scriptRes = await fetch(url);
        const content = await scriptRes.text();
        await this.saveScript(content, version);
    }

    public async getBundle(): Promise<string> {
        let bundle = "";

        // needs semicolon at the end
        bundle += `//# sourceURL=skribbltypo://scripts/game-observer.js\n${gameObserverScript};\n\n`;

        try {
            const userScript = await fs.readFile(this.scriptPath, "utf-8");
            bundle += `//# sourceURL=skribbltypo://scripts/skribbltypo.user.js\n${userScript}\n\n`;
        } catch (err) {
            logger.error("Failed to read skribbltypo.user.js from disk:", err);
        }

        return bundle;
    }
}
