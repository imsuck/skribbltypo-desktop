export type EngineIOType =
    | 0 // open
    | 1 // close
    | 2 // ping
    | 3 // pong
    | 4 // message
    | 5 // upgrade
    | 6; // noop

export type SocketIOType =
    | 0 // connect
    | 1 // disconnect
    | 2 // event
    | 3 // ack
    | 4 // error
    | 5 // binary event
    | 6; // binary ack

export interface SocketIOPayload {
    event: string | null;
    args: any[];
    raw: string | null;
}

export interface ParsedSocketIOPacket {
    raw: string;

    engineType: EngineIOType | null;
    socketType: SocketIOType | null;

    namespace: string; // default: "/"
    id: number | null; // ack id

    data: SocketIOPayload | null;
    isBinary: boolean;
}

export function parseSocketIO(raw: string): ParsedSocketIOPacket | null {
    if (!raw || typeof raw !== "string") return null;

    let i = 0;
    const engineType = Number(raw[i]);
    if (Number.isNaN(engineType)) {
        return null;
    }
    i++;

    // Non-message packets
    if (engineType !== 4) {
        return {
            raw,
            engineType: engineType as EngineIOType,
            socketType: null,
            namespace: "/",
            id: null,
            data: null,
            isBinary: false,
        };
    }

    const socketType = Number(raw[i]);
    if (Number.isNaN(socketType)) {
        return null;
    }
    i++;

    let isBinary = socketType === 5 || socketType === 6;

    let namespace = "/";
    if (raw[i] === "/") {
        const start = i;
        while (i < raw.length && raw[i] !== ",") {
            i++;
        }
        namespace = raw.slice(start, i);
        if (raw[i] === ",") i++;
    }

    let id: number | null = null;
    let idStart = i;
    while (i < raw.length && raw[i] >= "0" && raw[i] <= "9") {
        i++;
    }
    if (i > idStart) {
        id = Number(raw.slice(idStart, i));
    }

    let data: SocketIOPayload | null = null;
    if (i < raw.length) {
        const payload = raw.slice(i);
        try {
            const decoded = JSON.parse(payload);

            if (Array.isArray(decoded) && typeof decoded[0] === "string") {
                // Normal event
                data = {
                    event: decoded[0],
                    args: decoded.slice(1),
                    raw: null,
                };
            } else {
                // Ack / error / non-standard
                data = {
                    event: null,
                    args: [],
                    raw: decoded,
                };
            }
        } catch {
            data = {
                event: null,
                args: [],
                raw: payload,
            };
        }
    }

    return {
        raw,
        engineType: engineType as EngineIOType,
        socketType: socketType as SocketIOType,
        namespace,
        id,
        data,
        isBinary,
    };
}
