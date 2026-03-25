import { decodeMudPayload, encodeMudLine, normalizeMudCharset, type MudCharset } from './mudEncoding';

export interface Message {
    type: string;
    content: any; // ??????????
}

const SITES_STORAGE_KEY = 'vsmud_sites';

export interface SiteCard {
    title: string;
    ip: string;
    port: string;
    account: string;
    password: string;
    name: string;
    /** WebSocket ????? "/" */
    wsPath?: string;
    /** ?????????? MUD ?? gb18030?GBK ?????? utf8 */
    charset?: MudCharset;
    isEditing?: boolean;
}

export function loadSitesFromStorage(): SiteCard[] {
    try {
        const raw = localStorage.getItem(SITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveSitesToStorage(sites: SiteCard[]) {
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
}

function siteStableId(s: Pick<SiteCard, 'account' | 'ip' | 'port'>): string {
    const acc = s.account?.trim();
    if (acc) return acc;
    return `${s.ip?.trim() ?? ''}:${s.port?.trim() ?? ''}`;
}

type MudEventName = 'telnet-connected' | 'telnet-error' | 'to-vue' | 'telnet-disconnected';
type MudEventPayload = {
    'telnet-connected': undefined;
    'telnet-error': string;
    'to-vue': { type: string; content: string };
    'telnet-disconnected': undefined;
};

let mudSocket: WebSocket | null = null;
let activeMudCharset: MudCharset = 'gb18030';
const mudEventMap: Record<MudEventName, Set<(payload: any) => void>> = {
    'telnet-connected': new Set(),
    'telnet-error': new Set(),
    'to-vue': new Set(),
    'telnet-disconnected': new Set()
};

function emitMudEvent<K extends MudEventName>(event: K, payload: MudEventPayload[K]) {
    mudEventMap[event].forEach((listener) => listener(payload));
}

/** ip ?? ws:// / wss:// ???????? host:port ? path */
function toWsUrl(ip: string, port: string | number, path = '/'): string {
    const target = `${ip}`.trim();
    const p = path.startsWith('/') ? path : `/${path}`;
    if (/^wss?:\/\//i.test(target)) {
        try {
            const u = new URL(target);
            if (p !== '/' && p !== u.pathname) u.pathname = p;
            return u.toString();
        } catch {
            return target;
        }
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${target}:${port}${p === '' ? '/' : p}`;
}

// ????
export class Base {
    /**
     * ????????ANSI ????
     */
    public colors = {
        blue: '\x1b[0;40m\x1b[1;44m',
        green: '\x1b[0;40m\x1b[1;32m',
        yellow: '\x1b[0;40m\x1b[1;33m',
        reset: '\x1b[0m'
    };
    /** ????????localStorage?? Electron ?? config ????*/
    public sendSiteList(msg: Message) {
        if (msg.type === 'del') {
            const c = msg.content as SiteCard;
            const id = siteStableId(c);
            if (!id || id === ':') return;
            saveSitesToStorage(loadSitesFromStorage().filter((s) => siteStableId(s) !== id));
            return;
        }
        if (msg.type === 'save') {
            const c = msg.content as SiteCard;
            if (!c?.ip?.trim() || !c?.port?.trim()) return;
            const id = siteStableId(c);
            const sites = loadSitesFromStorage();
            const idx = sites.findIndex((s) => siteStableId(s) === id);
            const next: SiteCard = {
                title: c.title,
                ip: c.ip,
                port: c.port,
                account: c.account ?? '',
                password: c.password ?? '',
                name: c.name,
                wsPath: c.wsPath,
                charset: c.charset,
                isEditing: false
            };
            if (idx >= 0) sites[idx] = { ...sites[idx], ...next };
            else sites.push(next);
            saveSitesToStorage(sites);
        }
    }

    public on<K extends MudEventName>(event: K, listener: (payload: MudEventPayload[K]) => void) {
        mudEventMap[event].add(listener as (payload: any) => void);
    }

    public off<K extends MudEventName>(event: K, listener: (payload: MudEventPayload[K]) => void) {
        mudEventMap[event].delete(listener as (payload: any) => void);
    }

    public connect(msg: Message) {
        const site = msg?.content as SiteCard | undefined;
        const host = site?.ip?.trim();
        const port = site?.port?.trim();
        const wsPath = site?.wsPath?.trim() || '/';
        const fullWsUrl = Boolean(host && /^wss?:\/\//i.test(host));
        if (!fullWsUrl && (!host || !port)) {
            emitMudEvent('telnet-error', '????????????');
            return;
        }
        activeMudCharset = normalizeMudCharset(site?.charset);
        if (mudSocket && mudSocket.readyState <= WebSocket.OPEN) {
            mudSocket.close();
        }
        const wsUrl = fullWsUrl ? host! : toWsUrl(host!, port!, wsPath);
        let opened = false;
        let socket: WebSocket;
        try {
            socket = new WebSocket(wsUrl);
            socket.binaryType = 'arraybuffer';
            mudSocket = socket;
        } catch (err) {
            emitMudEvent('telnet-error', `?? WebSocket ??: ${String(err)}`);
            return;
        }
        socket.onopen = () => {
            opened = true;
            emitMudEvent('telnet-connected', undefined);
        };
        socket.onerror = () => {
            console.warn('[vsmud] WebSocket error:', wsUrl);
        };
        socket.onclose = (ev) => {
            if (mudSocket === socket) mudSocket = null;
            if (opened) {
                emitMudEvent('telnet-disconnected', undefined);
                return;
            }
            const hint =
                ev.code === 1006
                    ? '??????????? WebSocket ?????? Telnet/TCP???? npm run mud-bridge ????'
                    : '';
            emitMudEvent(
                'telnet-error',
                `???? WebSocket: ${wsUrl}  code=${ev.code}${ev.reason ? ` ${ev.reason}` : ''}${hint}`
            );
        };
        socket.onmessage = async (event) => {
            const content = await decodeMudPayload(
                event.data as string | ArrayBuffer | Blob,
                activeMudCharset
            );
            emitMudEvent('to-vue', { type: 'mud', content });
        };
    }

    public disconnect() {
        if (!mudSocket) return;
        mudSocket.close();
        mudSocket = null;
    }

    public sendMessage(cmd: string) {
        if (!mudSocket || mudSocket.readyState !== WebSocket.OPEN) return;
        mudSocket.send(encodeMudLine(`${cmd}\r\n`, activeMudCharset));
    }
}

// xTerm ????
export class xTermLoginc {
    private base: Base;
    private cmdHistory: string[] = [];
    private historyIndex: number = -1;
    private scrollTop: number = 0;
    private viewportElement: HTMLElement | null;
    constructor() {
        this.base = new Base();
        this.viewportElement = null;
        this.scrollTop = 0;
    }

    public termWrite(terminal: any, data: any) {
        let { content, type } = data;
        // ?? # ??
        if (type === 'client') {
            console.log('??????', content);
            return;
        }

        if (type == 'tri-cmd') {
            content = `${this.base.colors.yellow} ${content} ${this.base.colors.reset}\r\n`;
        }

        terminal.value.write(`${content}`);
        console.log('terminal data:', content);
    }

    // ??????
    private resetLetterSpacing() {
        const spans = document.querySelectorAll('.xterm-rows span');
        spans.forEach((span) => {
            const htmlSpan = span as HTMLElement;
            htmlSpan.style.letterSpacing = 'normal';
        });
    }

    // ??????????showDownward ??
    public setupScrollListener(terminalContainer: any, showDownBtn: any, emits: any) {
        let scrollListener: () => void;
        if (terminalContainer.value) {
            this.viewportElement = terminalContainer.value.querySelector('.xterm-viewport');
            const viewEle = this.viewportElement;
            if (viewEle) {
                scrollListener = () => {
                    const scrollTop = viewEle.scrollTop;
                    // ??????
                    this.scrollTop = scrollTop;
                    const scrollHeight = viewEle.scrollHeight;
                    const clientHeight = viewEle.clientHeight;
                    // ??????????
                    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
                    showDownBtn.value = distanceToBottom > 10;
                    // ???? emit ??
                    emits('showDownward', showDownBtn.value);
                };
                viewEle.addEventListener('scroll', scrollListener);
                return () => {
                    if (viewEle && scrollListener) {
                        viewEle.removeEventListener('scroll', scrollListener);
                    }
                };
            }
        }
        return () => {};
    }

    // ?? Alt+Z ????
    private setupAltZListener(terminal: any) {
        const keyDownListener = (event: KeyboardEvent) => {
            if (event.altKey && event.key.toLowerCase() === 'z') {
                if (terminal.value) {
                    console.log('??? Alt+Z ???');
                    terminal.value.scrollToBottom();
                }
            }
        };
        window.addEventListener('keydown', keyDownListener);
        return () => {
            window.removeEventListener('keydown', keyDownListener);
        };
    }

    // ????
    private copyText(terminal: any, inputRef: any, ElMessage: any) {
        navigator.clipboard
            .writeText(terminal.value.getSelection())
            .then(() => {
                ElMessage({
                    message: '????',
                    type: 'success',
                    plain: true
                });
                inputRef.value?.focus();
            })
            .catch((err) => {
                console.error('????:', err);
            });
    }

    // ??????
    public eventListener(terminal: any, inputRef: any, fitAddon: any, ElMessage: any) {
        // ??????????
        terminal.value.onData(() => {
            this.resetLetterSpacing();
        });

        // ?? Alt+Z ????
        this.setupAltZListener(terminal);

        // ??????
        let i = 0;
        if (navigator.userAgent.indexOf('Windows') != -1) {
            terminal.value.onKey((event: KeyboardEvent) => {
                let currentScrollTop = 0;
                // ????????
                if (this.viewportElement) {
                    currentScrollTop = this.viewportElement.scrollTop;
                }
                switch (event.key) {
                    case '\u0003':
                        // ???Ctrl+C ????
                        if (terminal.value && i === 0) {
                            setTimeout(() => {
                                i = 0;
                            }, 1000);
                            i++;
                            this.copyText(terminal, inputRef, ElMessage);
                        }
                        break;
                }

                // ?? 1 ????????????
                setTimeout(() => {
                    if (this.viewportElement) {
                        this.viewportElement.scrollTop = currentScrollTop;
                    }
                }, 50);
            });
        } else {
            window.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.metaKey && event.key.toLowerCase() === 'c') {
                    // ???cmd+C ????
                    if (terminal.value && i === 0) {
                        setTimeout(() => {
                            i = 0;
                        }, 1000);
                        i++;
                        this.copyText(terminal, inputRef, ElMessage);
                    }
                }
            });
        }

        // ??????????????????
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });
    }

    // ??????????
    public addCommandToHistory(command: string) {
        this.cmdHistory.push(command);
        // ???????????????100 ?????????
        if (this.cmdHistory.length > 100) {
            this.cmdHistory.shift();
        }
        this.historyIndex = this.cmdHistory.length;
    }

    // ?????????
    public getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.cmdHistory[this.historyIndex];
        }
        return null;
    }

    // ????????
    public getNextCommand() {
        if (this.historyIndex < this.cmdHistory.length - 1) {
            this.historyIndex++;
            return this.cmdHistory[this.historyIndex];
        }
        // ??????????????
        this.historyIndex = this.cmdHistory.length;
        return '';
    }
}

