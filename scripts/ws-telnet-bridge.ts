/**
 * 浏览器只能连 WebSocket；本机 MUD 多为 Telnet(TCP)。
 * 用法：npm run mud-bridge -- <WS监听端口> <MUD主机> <MUD端口> [charset]
 *
 * 每条 TCP 下行：先发二进制帧，再发 vsmud-control JSON（见 mud-bridge-control.ts）。
 */
import { WebSocketServer } from 'ws';
import net from 'node:net';
import { mkDlProc } from './mud-bridge-control';

const listenPort = Number(process.argv[2] || 6000);
const telnetHost = process.argv[3] || '127.0.0.1';
const telnetPort = Number(process.argv[4] || 23);
const mudCharset =
    process.argv[5] === 'utf8' || process.argv[5] === 'UTF8' ? 'utf8' : 'gb18030';

if (!Number.isFinite(listenPort) || listenPort <= 0) {
    console.error('无效监听端口:', process.argv[2]);
    process.exit(1);
}
if (!Number.isFinite(telnetPort) || telnetPort <= 0) {
    console.error('无效 MUD 端口:', process.argv[4]);
    process.exit(1);
}

const wss = new WebSocketServer({ port: listenPort });

wss.on('connection', (ws) => {
    const sock = net.createConnection({ host: telnetHost, port: telnetPort });
    const downlink = mkDlProc(mudCharset);

    sock.on('data', (buf: Buffer) => {
        if (ws.readyState !== ws.OPEN) return;
        ws.send(buf, { binary: true });
        try {
            const control = downlink.push(buf);
            ws.send(JSON.stringify(control));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[mud-bridge] control JSON:', msg);
        }
    });
    sock.on('error', (e: Error) => {
        try {
            ws.close(1011, String(e.message || e));
        } catch {
            /* ignore */
        }
    });
    sock.on('close', () => {
        try {
            ws.close();
        } catch {
            /* ignore */
        }
    });

    ws.on('message', (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
        if (!sock.writable) return;
        if (isBinary) sock.write(Buffer.from(data as ArrayBuffer));
        else sock.write(String(data));
    });
    ws.on('close', () => sock.end());
    ws.on('error', () => sock.end());
});

wss.on('listening', () => {
    console.log(
        `[mud-bridge] ws://127.0.0.1:${listenPort}/  ->  tcp://${telnetHost}:${telnetPort}  charset=${mudCharset}`
    );
});

wss.on('error', (e: Error) => {
    console.error('[mud-bridge] 启动失败:', e.message);
    process.exit(1);
});
