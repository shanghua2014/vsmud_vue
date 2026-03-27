/**
 * 与 src/common/mudBridgeDownlinkCore.ts 共用提示快照；出口见 mud-exit-dirs-parse.ts，房间名见 mud-room-title-parse.ts。
 */
import iconv from 'iconv-lite';
import type { BrPr } from '../src/common/common';
import { snapBr } from '../src/common/mudBridgeDownlinkCore';
import { parseExitDirsFromMudBuffer } from './mud-exit-dirs-parse';
import { parseCurrentRoomNameFromMudBuffer } from './mud-room-title-parse';

type MudCharset = 'gb18030' | 'utf8';

const BUF_MAX = 12000;

function decChunk(buf: Buffer, charset: MudCharset): string {
    if (charset === 'utf8') return buf.toString('utf8');
    return iconv.decode(buf, 'gb18030');
}

export interface BrCtlPayload {
    v: 1;
    channel: 'vsmud-control';
    charset: MudCharset;
    exits: { sk: string[] | null };
    roomTitle: { nm: string | null };
    prompts: BrPr;
}

export function mkDlProc(charset: MudCharset = 'gb18030') {
    let rawBuf = '';
    return {
        push(buf: Buffer): BrCtlPayload {
            const decoded = decChunk(buf, charset);
            rawBuf = (rawBuf + decoded).slice(-BUF_MAX);
            const bufFull = rawBuf;

            return {
                v: 1,
                channel: 'vsmud-control',
                charset,
                exits: { sk: parseExitDirsFromMudBuffer(bufFull) },
                roomTitle: { nm: parseCurrentRoomNameFromMudBuffer(bufFull) },
                prompts: snapBr(decoded, bufFull)
            };
        },
        reset(): void {
            rawBuf = '';
        }
    };
}
