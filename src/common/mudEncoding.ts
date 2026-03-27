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

export function encodeMudLine(text: string, charset: MudCharset): Uint8Array {
    if (charset === 'utf8') {
        return new TextEncoder().encode(text);
    }
    return new Uint8Array(iconv.encode(text, 'gb18030'));
}
