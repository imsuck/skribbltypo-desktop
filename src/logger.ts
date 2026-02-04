export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/** ANSI codes for Node/terminal (main process). */
const Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgCyan: "\x1b[36m",
};

/** CSS for browser DevTools (preload/renderer). See https://stackoverflow.com/a/13017382 */
const BrowserStyles = {
    dim: "color: #666;",
    debug: "color: #0e7490; font-weight: bold;",
    info: "color: #15803d; font-weight: bold;",
    warn: "color: #a16207; font-weight: bold;",
    error: "color: #b91c1c; font-weight: bold;",
    reset: "color: inherit; font-weight: normal;",
};

function isBrowserContext(): boolean {
    return typeof window !== "undefined";
}

function formatArgs(...args: unknown[]): string {
    return args
        .map((arg) =>
            typeof arg === "object" && arg !== null
                ? JSON.stringify(arg, null, 2)
                : String(arg),
        )
        .join(" ");
}

class Logger {
    private formatMessageNode(level: string, color: string): string {
        const timestamp = new Date().toLocaleTimeString("en-GB", {
            hour12: false,
        });
        const levelTag = `[${color}${level}${Colors.Reset}]`;
        const prefix = `${Colors.Dim}${timestamp}${Colors.Reset} ${levelTag}`;
        return `${prefix}`;
    }

    private formatMessageBrowser(
        level: string,
        levelStyle: string,
        method: "debug" | "info" | "warn" | "error",
        ...args: unknown[]
    ): void {
        const timestamp = new Date().toLocaleTimeString("en-GB", {
            hour12: false,
        });
        // Prefix only in the template so we can pass raw args; objects stay collapsible in DevTools
        const template = `%c${timestamp} [%c${level}%c] `;
        const styles = [BrowserStyles.dim, levelStyle, BrowserStyles.reset];
        (console[method] as typeof console.log)(template, ...styles, ...args);
    }

    public debug(...args: unknown[]) {
        if (isBrowserContext()) {
            this.formatMessageBrowser(
                "DEBUG",
                BrowserStyles.debug,
                "debug",
                ...args,
            );
        } else {
            console.debug(
                this.formatMessageNode("DEBUG", Colors.FgCyan),
                ...args,
            );
        }
    }

    public info(...args: unknown[]) {
        if (isBrowserContext()) {
            this.formatMessageBrowser(
                "INFO",
                BrowserStyles.info,
                "info",
                ...args,
            );
        } else {
            console.info(
                this.formatMessageNode("INFO", Colors.FgGreen),
                ...args,
            );
        }
    }

    public warn(...args: unknown[]) {
        if (isBrowserContext()) {
            this.formatMessageBrowser(
                "WARN",
                BrowserStyles.warn,
                "warn",
                ...args,
            );
        } else {
            console.warn(
                this.formatMessageNode("WARN", Colors.FgYellow),
                ...args,
            );
        }
    }

    public error(...args: unknown[]) {
        if (isBrowserContext()) {
            this.formatMessageBrowser(
                "ERROR",
                BrowserStyles.error,
                "error",
                ...args,
            );
        } else {
            console.error(
                this.formatMessageNode("ERROR", Colors.FgRed),
                ...args,
            );
        }
    }
}

export const logger = new Logger();
