export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

const Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
};

class Logger {
    private formatMessage(level: string, color: string, ...args: any[]): string {
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const levelTag = `${color}[${level}]${Colors.Reset}`;
        const prefix = `${Colors.Dim}${timestamp}${Colors.Reset} ${levelTag}`;
        return `${prefix} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')}`;
    }

    public debug(...args: any[]) {
        console.debug(this.formatMessage("DEBUG", Colors.FgCyan, ...args));
    }

    public info(...args: any[]) {
        console.info(this.formatMessage("INFO", Colors.FgGreen, ...args));
    }

    public warn(...args: any[]) {
        console.warn(this.formatMessage("WARN", Colors.FgYellow, ...args));
    }

    public error(...args: any[]) {
        console.error(this.formatMessage("ERROR", Colors.FgRed, ...args));
    }
}

export const logger = new Logger();
