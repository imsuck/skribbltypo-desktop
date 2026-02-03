import { Client, type SetActivity } from "@visoftware/discord-rpc";
import { logger } from "./logger.js";
import { hashObject } from "./utils/hashing.js";

export class DiscordRPCManager {
    private client: Client;
    private readonly clientId: string = "1464612778244571177";
    private ready: boolean = false;
    private prevActivityHash: string | null = null;

    constructor() {
        this.client = new Client({
            clientId: this.clientId,
        });

        this.client.on("ready", () => {
            this.ready = true;
            logger.info("Discord RPC started");
        });

        this.client.on("disconnected", () => {
            this.ready = false;
            logger.warn("Discord RPC disconnected");
        });
    }

    public async login(): Promise<boolean> {
        if (this.ready) return true;

        try {
            await this.client.login();
            return true;
        } catch (err) {
            logger.error("Failed to login to Discord RPC:", err);
            return false;
        }
    }

    public async updateActivity(data: SetActivity) {
        if (!(await this.login()) || !this.client.user) return;

        const newHash = hashObject(data);
        if (this.prevActivityHash === newHash) return;

        try {
            await this.client.user.setActivity(data);
            this.prevActivityHash = newHash;
        } catch (err) {
            logger.error("Failed to set Discord activity:", err);
        }
    }

    public async clearActivity() {
        if (!(await this.login()) || !this.client.user) return;

        try {
            await this.client.user.clearActivity();
        } catch (err) {
            logger.error("Failed to clear Discord activity:", err);
        }
    }
}
