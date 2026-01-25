import { PresenceData } from "./discord-rpc.js";

(function () {
    console.debug("[skribbltypo-desktop] Game Observer starting...");

    const observeGameEvents = () => {
        const overlay = document.querySelector(".overlay-content");
        if (!overlay) return;

        let lastNotificationText = "";

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList" || mutation.type === "characterData") {
                    const textDiv = overlay.querySelector("div.text");
                    if (!textDiv) continue;
                    let notificationText = "";
                    const firstSpan = textDiv.querySelector("span");
                    if (firstSpan) {
                        notificationText = firstSpan.textContent || "";
                    } else {
                        notificationText = textDiv.textContent || "";
                    }

                    notificationText = notificationText.trim();

                    if (notificationText.startsWith("Round")) continue;

                    if (notificationText && notificationText !== lastNotificationText) {
                        lastNotificationText = notificationText;
                        window.electronAPI.showNotification("skribbl.io", notificationText);
                    }
                }
            }
        });

        observer.observe(overlay, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.debug("[skribbltypo-desktop] Game Observer attached to .overlay-content");
    };

    const observePlayer = () => {
        const playerList = document.querySelector(".players-list");
        if (!playerList) return;

        let playerName: string = "";
        let round: string = "";
        let language: string = "";
        let rank: number = 0;
        let points: number = 0;
        let maxPlayers: number = 0;

        // Note for agent:
        // This should update reactively as its inner variables are updated
        // Sort of like references in C++
        let presenceData: PresenceData = {
            state: `${language} lobby`,
            details: `#${rank}, ${points} points`,
            largeImageText: playerName,
            partySize: playerList.children.length,
            partyMax: maxPlayers,
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList" || mutation.type === "characterData") {

                }
            }
        });

        observer.observe(playerList, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.debug("[skribbltypo-desktop] Game Observer attached to .overlay-content");
    };

    const rootObserver = new MutationObserver((mutations, observer) => {
        if (document.querySelector(".overlay-content")) {
            observeGameEvents();
        }
    });

    rootObserver.observe(document.body, { childList: true, subtree: true });
    if (document.querySelector(".overlay-content")) {
        observeGameEvents();
    }
})();
