import { logger } from "../../logger.ts";

(() => {
    logger.debug("[skribbltypo-desktop] Join Popup initializing...");
    if (document.getElementById("skribbltypo-join-popup")) return;
    const container = document.createElement("div");
    container.id = "skribbltypo-join-popup";
    container.innerHTML = `
        <h2>Join Game</h2>
        <input type="text" id="skribbltypo-join-input" placeholder="Enter game code or URL" maxlength="28">
        <div class="popup-buttons">
            <button id="skribbltypo-join-btn">Join</button>
            <button id="skribbltypo-join-cancel-btn">Cancel</button>
        </div>
    `;
    document.body.appendChild(container);

    const input = document.getElementById("skribbltypo-join-input") as HTMLInputElement;
    const joinBtn = document.getElementById("skribbltypo-join-btn") as HTMLButtonElement;
    const cancelBtn = document.getElementById("skribbltypo-join-cancel-btn") as HTMLButtonElement;

    if (input) input.focus();

    const join = () => {
        if (!input) return;
        let val = input.value.trim();
        if (!val) return;

        // Basic cleanup: extract ID if full URL was pasted
        const match = val.match(/(?:[?&])?([A-Za-z0-9]{8})$/);
        const id = match ? match[1] : val;

        if (id.length === 8) {
            sessionStorage.setItem("skribbltypo-autoplay", "true");
            window.location.href = "https://skribbl.io/?" + id;
            container.remove();
        } else {
            input.style.borderColor = "var(--COLOR_BUTTON_DANGER_BG)";
        }
    };

    if (joinBtn) joinBtn.onclick = join;
    if (cancelBtn) cancelBtn.onclick = () => container.remove();

    if (input) {
        input.onkeydown = (e) => {
            if (e.key === "Enter") join();
            if (e.key === "Escape") container.remove();
        };
    }
})();
