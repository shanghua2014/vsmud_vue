/**
 * 浏览器只能连 WebSocket；本机 MUD 多为 Telnet(TCP)。
 * 用法（另开一个终端）：
 *   npm run mud-bridge -- <WS监听端口> <MUD主机> <MUD端口>
 * 例：npm run mud-bridge -- 17000 127.0.0.1 6000
 * 前端站点填：服务器 127.0.0.1，端口 6000（与第一个参数一致）
 */
import { WebSocketServer } from 'ws';
import net from 'node:net';

const listenPort = Number(process.argv[2] || 6000);
const telnetHost = process.argv[3] || '127.0.0.1';
const telnetPort = Number(process.argv[4] || 23);

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

    sock.on('data', (buf) => {
        if (ws.readyState === ws.OPEN) ws.send(buf);
    });
    sock.on('error', (e) => {
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

    ws.on('message', (data, isBinary) => {
        if (!sock.writable) return;
        if (isBinary) sock.write(Buffer.from(data));
        else sock.write(String(data));
    });
    ws.on('close', () => sock.end());
    ws.on('error', () => sock.end());
});

wss.on('listening', () => {
    console.log(
        `[mud-bridge] ws://127.0.0.1:${listenPort}/  ->  tcp://${telnetHost}:${telnetPort}`
    );
});

wss.on('error', (e) => {
    console.error('[mud-bridge] 启动失败:', e.message);
    process.exit(1);
});
