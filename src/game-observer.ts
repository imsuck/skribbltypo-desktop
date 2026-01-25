import { PresenceData } from "./discord-rpc.js";
import { type IElectronAPI } from "./preload.js";

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}

const LANGUAGE_CODES: Record<string, string> = {
    English: "us",
    German: "de",
    Bulgarian: "bg",
    Czech: "cz",
    Danish: "dk",
    Dutch: "nl",
    Finnish: "fi",
    French: "fr",
    Estonian: "ee",
    Greek: "gr",
    Hebrew: "il",
    Hungarian: "hu",
    Italian: "it",
    Japanese: "jp",
    Korean: "kr",
    Latvian: "lv",
    Macedonian: "mk",
    Norwegian: "no",
    Portuguese: "pt",
    Polish: "pl",
    Romanian: "ro",
    Russian: "ru",
    Serbian: "rs",
    Slovakian: "sk",
    Spanish: "es",
    Swedish: "se",
    Tagalog: "ph",
    Turkish: "tr",
};

(function () {
    console.debug("[skribbltypo-desktop] Game Observer starting...");

    const observeGameEvents = () => {
        const overlay = document.querySelector(".overlay-content");
        if (!overlay) return;

        let lastNotificationText = "";

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type === "childList" ||
                    mutation.type === "characterData"
                ) {
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

                    if (
                        notificationText &&
                        notificationText !== lastNotificationText
                    ) {
                        lastNotificationText = notificationText;
                        window.electronAPI.showNotification(
                            "skribbl.io",
                            notificationText,
                        );
                    }
                }
            }
        });

        observer.observe(overlay, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        console.debug(
            "[skribbltypo-desktop] Game Observer attached to .overlay-content",
        );
    };

    const observeGameState = () => {
        let playerName: string = "";
        let round: string = "";
        let language: string = "English";
        let rank: number = 0;
        let points: number = 0;
        let maxPlayers: number = 0;
        let gameMode: string = "Normal";

        let startTime: number | null = null;

        let updateTimeout: NodeJS.Timeout | null = null;

        const syncPresence = () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                const gameDiv = document.getElementById("game");
                if (!gameDiv) return;
                let presenceData: PresenceData = {};
                if (gameDiv.style.display === "none") {
                    console.debug("In menus");
                    startTime = null;
                    presenceData = {
                        details: "In menus",
                        largeImageKey: "in_menus",
                        largeImageText: playerName || "skribbl.io",
                        endTimestamp: 0,
                    };
                } else {
                    console.debug("In game");
                    if (!startTime) {
                        startTime = Date.now();
                    }
                    presenceData = {
                        state: `#${rank}, ${points} points`,
                        details: `${round}`,
                        largeImageKey: "in_game",
                        largeImageText: playerName || "skribbl.io",
                        smallImageKey: "flag_" + LANGUAGE_CODES[language],
                        smallImageText: language,
                        startTimestamp: startTime,
                        partySize:
                            document.querySelector(".players-list")?.children
                                .length || 0,
                        partyMax: maxPlayers || 0,
                    };
                }

                window.electronAPI.updatePresence(presenceData);
            }, 500);
        };

        const updateLobbySettings = () => {
            const slotsSelect = document.querySelector(
                "#item-settings-slots",
            ) as HTMLSelectElement;
            const langSelect = document.querySelector(
                "#item-settings-language",
            ) as HTMLSelectElement;
            const modeSelect = document.querySelector(
                "#item-settings-mode",
            ) as HTMLSelectElement;

            if (slotsSelect) {
                maxPlayers = parseInt(slotsSelect.value) || 0;
            }
            if (langSelect) {
                language =
                    langSelect.options[langSelect.selectedIndex]?.text ||
                    "English";
            }
            if (modeSelect) {
                gameMode =
                    modeSelect.options[modeSelect.selectedIndex]?.text ||
                    "Normal";
            }
        };

        const updateRoundInfo = () => {
            const roundDiv = document.querySelector("#game-round .text");
            if (roundDiv) {
                round = roundDiv.textContent?.trim() || "";
            }
        };

        const updatePlayerStats = () => {
            const me = document.querySelector(".player-name.me");
            const gameDiv = document.getElementById("game");
            const nameInput = document.querySelector(
                ".input-name",
            ) as HTMLInputElement;
            if (me && gameDiv?.style.display !== "none") {
                playerName = (me.textContent || "")
                    .replace(" (You)", "")
                    .trim();
                const playerEntry = me.closest(".player");
                if (playerEntry) {
                    const rankDiv = playerEntry.querySelector(".player-rank");
                    const scoreDiv = playerEntry.querySelector(".player-score");
                    if (rankDiv)
                        rank = parseInt(
                            rankDiv.textContent?.replace("#", "") || "0",
                        );
                    if (scoreDiv)
                        points = parseInt(
                            scoreDiv.textContent?.replace(" points", "") || "0",
                        );
                }
            } else if (nameInput) {
                playerName = nameInput.value.trim();
            }
        };

        const handleChanges = () => {
            updateLobbySettings();
            updateRoundInfo();
            updatePlayerStats();
            syncPresence();
        };

        const observer = new MutationObserver(() => {
            handleChanges();
        });

        observer.observe(document.querySelector("#game-wrapper")!, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
        });

        // Initial update
        handleChanges();

        console.debug(
            "[skribbltypo-desktop] Game Observer active and syncing presence",
        );
    };

    const rootObserver = new MutationObserver((mutations, observer) => {
        if (document.querySelector(".overlay-content")) {
            observeGameEvents();
        }
        if (
            document.querySelector(".players-list") ||
            document.querySelector(".group-settings")
        ) {
            observer.disconnect(); // Stop root observer once we started game state observation
            observeGameState();
        }
    });

    rootObserver.observe(document.body, { childList: true, subtree: true });

    // Initial check in case elements are already there
    if (document.querySelector(".overlay-content")) {
        observeGameEvents();
    }
    if (
        document.querySelector(".players-list") ||
        document.querySelector(".group-settings")
    ) {
        observeGameState();
    }
})();
