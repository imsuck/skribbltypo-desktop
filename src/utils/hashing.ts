import { createHash } from "crypto";

function stableStringify(obj: unknown): string {
    if (obj === null || typeof obj !== "object") {
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(",")}]`;
    }

    const keys = Object.keys(obj as object).sort();

    return `{${keys
        .map((k) => `"${k}":${stableStringify((obj as any)[k])}`)
        .join(",")}}`;
}

export function hashObject(obj: unknown): string {
    const str = stableStringify(obj);

    return createHash("sha256").update(str).digest("hex");
}
