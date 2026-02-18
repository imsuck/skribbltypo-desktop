import { logger } from "../../logger.ts";

export default (latest: string, current: string) => {
    logger.debug(
        `[skribbltypo-desktop] Update Popup initializing (latest: ${latest})...`,
    );
    if (document.getElementById("skribbltypo-update-popup")) return;
    const container = document.createElement("div");
    container.id = "skribbltypo-update-popup";
    container.innerHTML = `
        <div class="update-content">
            <h2>🔔 Update Available</h2>
            <p>A new version of skribbltypo (${latest}) is available.</p>
            <p>Current: ${current}</p>
            <button id="skribbltypo-update-btn">Update</button>
            <button id="skribbltypo-close-btn">Later</button>
        </div>
    `;
    document.body.appendChild(container);

    const updateBtn = document.getElementById("skribbltypo-update-btn");
    const closeBtn = document.getElementById("skribbltypo-close-btn");

    if (updateBtn) {
        updateBtn.onclick = () => {
            (window as any).electronAPI.updateScript();
            container.remove();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            container.remove();
        };
    }
};
