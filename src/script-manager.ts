import { app, WebContents } from "electron";
import * as path from "path";
import * as fs from "fs/promises";

import { logger } from "./logger.js";

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
    private readonly observerPath = path.join(
        path.dirname(import.meta.dirname),
        "dist",
        "game-observer.js",
    );
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

            const release = await response.json();
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

        const script = `
            const updatePopup = () => {
                if (document.getElementById("skribbltypo-update-popup")) return;
                const container = document.createElement("div");
                container.id = "skribbltypo-update-popup";
                container.innerHTML = \`
                    <div class="update-content">
                        <h2>🔔 Update Available</h2>
                        <p>A new version of skribbltypo (${latest}) is available.</p>
                        <p>Current: ${current}</p>
                        <button id="skribbltypo-update-btn">Update</button>
                        <button id="skribbltypo-close-btn">Later</button>
                    </div>
                \`;
                document.body.appendChild(container);

                document.getElementById("skribbltypo-update-btn").onclick = () => {
                    window.electronAPI.updateScript();
                    container.remove();
                };
                document.getElementById("skribbltypo-close-btn").onclick = () => {
                    container.remove();
                };
            };
            window.electronAPI.onGameLoaded(updatePopup);
        `;
        await webContents.executeJavaScript(script);
    }

    public async downloadScript(url: string, version: string) {
        const scriptRes = await fetch(url);
        const content = await scriptRes.text();
        await this.saveScript(content, version);
    }

    public async getBundle(): Promise<string> {
        const scripts = [
            { path: this.scriptPath, name: "skribbltypo.user.js" },
            { path: this.observerPath, name: "game-observer.js" },
        ];

        let bundle = "";
        for (const script of scripts) {
            try {
                const content = await fs.readFile(script.path, "utf-8");
                bundle += `//# sourceURL=skribbltypo://scripts/${script.name}\n${content}\n\n`;
            } catch (err) {
                logger.error(`Failed to read script ${script.name}:`, err);
            }
        }
        return bundle;
    }
}
