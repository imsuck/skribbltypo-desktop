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
