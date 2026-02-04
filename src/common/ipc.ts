import type { SetActivity } from "@visoftware/discord-rpc";

export enum IPCChannel {
    UPDATE_SCRIPT = "update-script",
    SHOW_NOTIFICATION = "show-notification",
    UPDATE_PRESENCE = "update-presence",
    GET_SCRIPT_BUNDLE = "get-script-bundle",
}

export interface NotificationPayload {
    title: string;
    body: string;
}

export interface IElectronAPI {
    updateScript: () => void;
    showNotification: (title: string, body: string) => void;
    updatePresence: (data: SetActivity) => void;
    lobbyData: () => any | null;
    getScriptBundle: () => Promise<string>;
    isGameLoaded: () => boolean;
    onGameLoaded: (callback: () => void) => void;
}
