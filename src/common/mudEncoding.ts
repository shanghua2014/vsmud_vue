const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
const utf8Encoder = new TextEncoder();

export async function decodeMudPayload(data: string | ArrayBuffer | Blob): Promise<string> {
    if (typeof data === 'string') return data;
    const ab = data instanceof Blob ? await data.arrayBuffer() : data;
    return utf8Decoder.decode(new Uint8Array(ab));
}

/**
 * nt7_node 对 `mudText` 传 Base64（本段 TCP 原始字节）；按 UTF-8 解码为终端字符串。
 */
export async function decodeMudTextFromBase64(b64: string): Promise<string> {
    const t = b64.replace(/\s/g, '');
    if (!t) return '';
    const bin = atob(t);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i) & 0xff;
    return utf8Decoder.decode(u8);
}

export function encodeMudLine(text: string): Uint8Array {
    return utf8Encoder.encode(text);
}

/** 静默 OSC，与网关剔除序列一致；直连 WebSocket 跨帧拼接后再剔，避免拆包进 xterm */
const VSMUD_OSC_SEQ = '\x1b]777;vsmud;motd_done\x07';
const VSMUD_OSC_RE = /\x1b\]777;vsmud;motd_done\x07/g;

export type VsmudOscCarryStripper = {
    push(chunk: string): string;
    reset(): void;
};

export function createVsmudOscCarryStripper(): VsmudOscCarryStripper {
    let carry = '';
    return {
        push(chunk: string): string {
            let s = carry + chunk;
            carry = '';
            s = s.replace(VSMUD_OSC_RE, '');
            const sig = VSMUD_OSC_SEQ;
            for (let i = sig.length - 1; i >= 2; i--) {
                const pref = sig.slice(0, i);
                if (s.endsWith(pref)) {
                    carry = pref;
                    s = s.slice(0, -i);
                    break;
                }
            }
            return s;
        },
        reset() {
            carry = '';
        }
    };
}
