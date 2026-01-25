import { Client } from "@visoftware/discord-rpc";
import { logger } from "./logger.js";

export interface PresenceData {
    details?: string;
    state?: string;
    startTimestamp?: number;
    endTimestamp?: number;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
    partyId?: string;
    partySize?: number;
    partyMax?: number;
}

export class DiscordRPCManager {
    private client: Client;
    private readonly clientId: string = "1464612778244571177";
    private isReady: boolean = false;

    constructor() {
        this.client = new Client({
            clientId: this.clientId,
        });

        this.client.on("ready", () => {
            this.isReady = true;
            logger.info("Discord RPC started");
        });

        this.client.on("disconnected", () => {
            this.isReady = false;
            logger.warn("Discord RPC disconnected");
        });
    }

    public async login() {
        try {
            await this.client.login();
        } catch (err) {
            logger.error("Failed to login to Discord RPC:", err);
        }
    }

    public async updateActivity(data: PresenceData) {
        if (!this.isReady || !this.client.user) return;

        try {
            await this.client.user.setActivity(data);
        } catch (err) {
            logger.error("Failed to set Discord activity:", err);
        }
    }

    public async clearActivity() {
        if (!this.isReady || !this.client.user) return;

        try {
            await this.client.user.clearActivity();
        } catch (err) {
            logger.error("Failed to clear Discord activity:", err);
        }
    }
}