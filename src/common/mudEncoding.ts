import iconv from 'iconv-lite';
import { Buffer } from 'buffer';

/** 与 MUD 交互固定走 GB18030（iconv 库名；与 GBK 常用字节兼容） */
export type MudCharset = 'gb18030' | 'utf8';

export function normalizeMudCharset(_raw?: string): MudCharset {
    return 'gb18030';
}

export async function decodeMudPayload(
    data: string | ArrayBuffer | Blob,
    charset: MudCharset
): Promise<string> {
    if (typeof data === 'string') return data;
    const ab = data instanceof Blob ? await data.arrayBuffer() : data;
    const u8 = new Uint8Array(ab);
    if (charset === 'utf8') {
        return new TextDecoder('utf-8', { fatal: false }).decode(u8);
    }
    return iconv.decode(Buffer.from(u8), 'gb18030');
}

/** vsmud-control 里 `charset` 字段 → 与上行一致的 MudCharset */
export function mudCharsetFromControlField(c: unknown): MudCharset {
    if (c === 'utf8' || c === 'utf-8') return 'utf8';
    return 'gb18030';
}

/**
 * nt7_node 对 `mudText` 传 Base64（本段 TCP 原始字节）；用本帧 `charset` 解码为终端字符串。
 */
export async function decodeMudTextFromBase64(b64: string, charset: MudCharset): Promise<string> {
    const t = b64.replace(/\s/g, '');
    if (!t) return '';
    const bin = atob(t);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i) & 0xff;
    return decodeMudPayload(u8.buffer, charset);
}

export function encodeMudLine(text: string, charset: MudCharset): Uint8Array {
    if (charset === 'utf8') {
        return new TextEncoder().encode(text);
    }
    return new Uint8Array(iconv.encode(text, 'gb18030'));
}
