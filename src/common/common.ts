import {
    createVsmudOscCarryStripper,
    decodeMudPayload,
    decodeMudTextFromBase64,
    encodeMudLine
} from './mudEncoding';

export interface Message {
    type: string;
    content: any; // ??????????
}

const sitesKey = 'vsmud_sites';

/** 终端方向区是否显示（与 App 设置抽屉同步） */
const dirPanKey = 'vsmud_dir_panel_on';

export function loadDirPan(): boolean {
    try {
        const raw = localStorage.getItem(dirPanKey);
        if (raw === null) return true;
        if (raw === '1' || raw === 'true') return true;
        if (raw === '0' || raw === 'false') return false;
        const p = JSON.parse(raw) as unknown;
        return typeof p === 'boolean' ? p : true;
    } catch {
        return true;
    }
}

export function saveDirPan(on: boolean): void {
    try {
        localStorage.setItem(dirPanKey, on ? '1' : '0');
    } catch {
        /* ignore quota / private mode */
    }
}

export interface SiteCard {
    title: string;
    ip: string;
    port: string;
    account: string;
    /** 登录用普通密码 */
    password: string;
    /** 管理密码（与「普通密码」区分，仅存站点卡片） */
    managePassword: string;
    name: string;
    /** 登录用 Email，站点卡片必填 */
    email: string;
    /** WebSocket ????? "/" */
    wsPath?: string;
    isEditing?: boolean;
}

export function loadSites(): SiteCard[] {
    try {
        const raw = localStorage.getItem(sitesKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((s: Partial<SiteCard>) => ({
            ...s,
            managePassword: s.managePassword ?? '',
            email: s.email ?? ''
        })) as SiteCard[];
    } catch {
        return [];
    }
}

function saveSites(sites: SiteCard[]) {
    localStorage.setItem(sitesKey, JSON.stringify(sites));
}

/**
 * 桥接「姓氏」提示时：3 字角色名取第 1 字，4 字取前 2 字，各为按钮发送内容。
 */
export function nameToSurnameBtns(name: string | undefined | null): string[] {
    const t = (name ?? '').trim();
    if (!t) return [];
    const chars = [...t];
    if (chars.length === 2) return [chars[0]!];
    if (chars.length === 3) return [chars[0]!];
    if (chars.length === 4) return [chars[0]!, chars[1]!];
    return [];
}

/**
 * 桥接「名字」提示：均为 1 个按钮。
 * 2 字名：末 1 字；3 / 4 字名：末 2 字拼成一条（点选一次发出两字）。
 */
export function nameToMingZiBtns(name: string | undefined | null): string[] {
    const t = (name ?? '').trim();
    const chars = [...t];
    if (chars.length < 2) return [];
    if (chars.length === 2) return [chars[1]!];
    if (chars.length === 3) return [`${chars[1]}${chars[2]}`];
    if (chars.length === 4) return [`${chars[2]}${chars[3]}`];
    return [];
}

/** 桥接「请输入您的全名」：一个按钮，文案为卡片角色名全文 */
export function nameToFullNameBtns(name: string | undefined | null): string[] {
    const t = (name ?? '').trim();
    if (!t) return [];
    return [t];
}

function siteId(s: Pick<SiteCard, 'account' | 'ip' | 'port'>): string {
    const acc = s.account?.trim();
    if (acc) return acc;
    return `${s.ip?.trim() ?? ''}:${s.port?.trim() ?? ''}`;
}

/** 桥接层下发的当前 mygift 辅助任务（与 nt7_node BrMyGiftTask 一致） */
export interface BrMyGiftTask {
    need: number;
    title: string;
}

/** 桥接层 mud-bridge-control 下发的提示快照（与 scripts 内字段名一致） */
export interface BrPr {
    yn: boolean;
    mf: boolean;
    em: boolean;
    chSel: boolean;
    alh: boolean;
    wash: boolean;
    baiShi: boolean;
    /** 拜武伯：与拜师同类 rematch */
    baiWuBo: boolean;
    /** `[2;37;0m武伯决定收你…`：找村长，rematch */
    zhaoCz: boolean;
    /** 「老村长点头」或「你完成了老村长交给你的」：准备出村，rematch */
    zhunCc: boolean;
    /** `[1;31mask hua` 等：确认出村 */
    cfLv: boolean;
    ky: boolean;
    /** `[1;36m1. 直接`：菜单 1～4 */
    d14: boolean;
    cEye: boolean;
    lHb: boolean;
    cxPwd: boolean;
    pgM: boolean;
    /** quit 流程：下行匹配「放弃账号」确认行（仅桥接 snapBr 计算） */
    quitAbd?: boolean;
    rcD: boolean;
    xsP: boolean;
    mzP: boolean;
    qmP: boolean;
    psP?: boolean;
    pnP?: boolean;
    psBoth?: boolean;
    pn2?: boolean;
    lgPwdL?: boolean;
    enNmL?: boolean;
    qNew?: boolean;
    qDet?: boolean;
    /** 网关下行本段匹配 NT 启动完毕：Terminal 整页刷新 */
    reloadPage?: boolean;
    /** mygift：条件数值 + 达成条件（网关从 MUD 缓冲解析） */
    myGiftTask?: BrMyGiftTask;
}

/** 桥接管理密码：单按钮；未填写时仍给占位文案，避免菜单区 `length>0` 条件导致按钮永远不出现 */
export function pwdSuperBtns(managePassword: string | undefined | null): string[] {
    const t = (managePassword ?? '').trim();
    if (!t) return ['管理密码'];
    return [t];
}

/** 桥接普通密码：单按钮；未填时占位，与 pwdSuperBtns 一致 */
export function pwdNormBtns(password: string | undefined | null): string[] {
    const t = (password ?? '').trim();
    if (!t) return ['普通密码'];
    return [t];
}

/** 桥接层解析的出口 */
export interface BrEx {
    /** null：未命中；[]：无出口；非空：当前房间出口键 */
    sk: string[] | null;
}

/** 桥接层解析的状态行房间名 */
export interface BrRt {
    /** null：未命中；非空：Look 按钮文案 */
    nm: string | null;
}

export type MudVue =
    | { type: 'mud'; content: string }
    | {
          type: 'bridge-control';
          prompts: BrPr;
          exits?: BrEx;
          roomTitle?: BrRt;
          /** 网关：Base64 原始段 + mudTextEnc；旧版可无编码（明文） */
          mudText?: string;
          mudTextEnc?: 'base64';
      };

type MudEventName = 'telnet-connected' | 'telnet-error' | 'to-vue' | 'telnet-disconnected';
type MudEventPayload = {
    'telnet-connected': undefined;
    'telnet-error': string;
    'to-vue': MudVue;
    'telnet-disconnected': undefined;
};

let ws: WebSocket | null = null;
const evMap: Record<MudEventName, Set<(payload: any) => void>> = {
    'telnet-connected': new Set(),
    'telnet-error': new Set(),
    'to-vue': new Set(),
    'telnet-disconnected': new Set()
};

function emitEv<K extends MudEventName>(event: K, payload: MudEventPayload[K]) {
    evMap[event].forEach((listener) => listener(payload));
}

/** ip ?? ws:// / wss:// ???????? host:port ? path */
function mkWsUrl(ip: string, port: string | number, path = '/'): string {
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
            const id = siteId(c);
            if (!id || id === ':') return;
            saveSites(loadSites().filter((s) => siteId(s) !== id));
            return;
        }
        if (msg.type === 'save') {
            const c = msg.content as SiteCard;
            if (!c?.ip?.trim() || !c?.port?.trim()) return;
            const id = siteId(c);
            const sites = loadSites();
            const idx = sites.findIndex((s) => siteId(s) === id);
            const next: SiteCard = {
                title: c.title,
                ip: c.ip,
                port: c.port,
                account: c.account ?? '',
                password: c.password ?? '',
                managePassword: c.managePassword ?? '',
                name: c.name,
                email: c.email ?? '',
                wsPath: c.wsPath,
                isEditing: false
            };
            if (idx >= 0) sites[idx] = { ...sites[idx], ...next };
            else sites.push(next);
            saveSites(sites);
        }
    }

    public on<K extends MudEventName>(event: K, listener: (payload: MudEventPayload[K]) => void) {
        evMap[event].add(listener as (payload: any) => void);
    }

    public off<K extends MudEventName>(event: K, listener: (payload: MudEventPayload[K]) => void) {
        evMap[event].delete(listener as (payload: any) => void);
    }

    public connect(msg: Message) {
        const site = msg?.content as SiteCard | undefined;
        const host = site?.ip?.trim();
        const port = site?.port?.trim();
        const wsPath = site?.wsPath?.trim() || '/';
        const fullWsUrl = Boolean(host && /^wss?:\/\//i.test(host));
        if (!fullWsUrl && (!host || !port)) {
            emitEv('telnet-error', '请填写站点地址与端口');
            return;
        }
        if (ws && ws.readyState <= WebSocket.OPEN) {
            ws.close();
        }
        const gatewayRaw = import.meta.env.VITE_MUD_GATEWAY?.trim();
        const useGateway = Boolean(gatewayRaw) && !fullWsUrl;
        const wsUrl = useGateway
            ? gatewayRaw!
            : fullWsUrl
              ? host!
              : mkWsUrl(host!, port!, wsPath);
        let opened = false;
        const vsmudOscStrip = createVsmudOscCarryStripper();
        let socket: WebSocket;
        try {
            socket = new WebSocket(wsUrl);
            socket.binaryType = 'arraybuffer';
            ws = socket;
        } catch (err) {
            emitEv('telnet-error', `创建 WebSocket 失败：${String(err)}`);
            return;
        }
        socket.onopen = () => {
            if (useGateway) {
                socket.send(
                    JSON.stringify({
                        v: 1,
                        channel: 'vsmud-session',
                        connect: {
                            ip: host,
                            port,
                            wsPath
                        }
                    })
                );
            } else {
                opened = true;
                emitEv('telnet-connected', undefined);
            }
        };
        socket.onerror = () => {
            console.warn('[vsmud] WebSocket error:', wsUrl);
        };
        socket.onclose = (ev) => {
            if (ws === socket) ws = null;
            if (opened) {
                emitEv('telnet-disconnected', undefined);
                return;
            }
            const hint =
                ev.code === 1006
                    ? useGateway
                        ? ' 网关模式请确认已启动 nt7_node（npm start），且 VITE_MUD_GATEWAY 可访问。'
                        : ' 直连模式请确认游戏侧已开启可被浏览器访问的 WebSocket/Telnet 桥接。'
                    : '';
            emitEv(
                'telnet-error',
                `无法连接 WebSocket：${wsUrl}（code=${ev.code}${ev.reason ? ` ${ev.reason}` : ''}）${hint}`
            );
        };
        socket.onmessage = async (event) => {
            const payload = event.data;
            if (typeof payload === 'string') {
                try {
                    const parsed = JSON.parse(payload) as {
                        v?: number;
                        channel?: string;
                        ready?: boolean;
                        error?: string;
                        prompts?: BrPr;
                        exits?: BrEx;
                        roomTitle?: BrRt;
                        mudText?: string;
                        mudTextEnc?: 'base64';
                    };
                    if (parsed?.v === 1 && parsed?.channel === 'vsmud-session') {
                        if (parsed.ready === true) {
                            if (!opened) {
                                opened = true;
                                emitEv('telnet-connected', undefined);
                            }
                            return;
                        }
                        if (typeof parsed.error === 'string') {
                            emitEv('telnet-error', parsed.error);
                            socket.close();
                            return;
                        }
                    }
                    if (
                        parsed?.v === 1 &&
                        parsed?.channel === 'vsmud-control' &&
                        parsed.prompts &&
                        typeof parsed.prompts === 'object'
                    ) {
                        const mt = typeof parsed.mudText === 'string' ? parsed.mudText : '';
                        let display = '';
                        if (mt.length > 0) {
                            if (parsed.mudTextEnc === 'base64') {
                                try {
                                    display = await decodeMudTextFromBase64(mt);
                                } catch (e) {
                                    console.warn('[vsmud] mudText Base64 解码失败', e);
                                }
                            } else {
                                display = mt;
                            }
                            if (display.length > 0) {
                                emitEv('to-vue', { type: 'mud', content: display });
                            }
                        }
                        emitEv('to-vue', {
                            type: 'bridge-control',
                            prompts: parsed.prompts as BrPr,
                            ...(typeof parsed.mudText === 'string'
                                ? { mudText: parsed.mudText, mudTextEnc: parsed.mudTextEnc }
                                : {}),
                            ...(parsed.exits && typeof parsed.exits === 'object'
                                ? { exits: parsed.exits as BrEx }
                                : {}),
                            ...(parsed.roomTitle && typeof parsed.roomTitle === 'object'
                                ? { roomTitle: parsed.roomTitle as BrRt }
                                : {})
                        });
                    }
                } catch {
                    /** 非 JSON 文本帧：直连桥若用 UTF-8 文本转发 Telnet，须当正文显示 */
                    const text = vsmudOscStrip.push(payload);
                    if (text.length > 0) emitEv('to-vue', { type: 'mud', content: text });
                }
                return;
            }
            try {
                let content = await decodeMudPayload(payload as ArrayBuffer | Blob);
                content = vsmudOscStrip.push(content);
                if (content.length > 0) emitEv('to-vue', { type: 'mud', content });
            } catch (e) {
                console.warn('[vsmud] decode MUD binary failed:', e);
            }
        };
    }

    public disconnect() {
        if (!ws) return;
        ws.close();
        ws = null;
    }

    public sendMessage(cmd: string) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(encodeMudLine(`${cmd}\r\n`));
    }
}

/**
 * 全应用唯一：站点列表持久化与 WebSocket 会话必须共用此实例，
 * 否则 MudList 里 connect、Terminal 里 on('to-vue') 会落在不同对象上，表现为「已连接但终端无输出」。
 */
export const mudBase = new Base();

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
                    emits('showDownward', showDownBtn.value);
                };
                viewEle.addEventListener('scroll', scrollListener);
                scrollListener();
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

    // ??????
    public eventListener(terminal: any, inputRef: any, fitAddon: any, ElMessage: any) {
        // ??????????
        terminal.value.onData(() => {
            this.resetLetterSpacing();
        });

        // ?? Alt+Z ????
        this.setupAltZListener(terminal);

        /** Windows：按键后恢复视口滚动位置，减轻 xterm 与外层布局的滚动跳动 */
        if (navigator.userAgent.indexOf('Windows') !== -1) {
            terminal.value.onKey(() => {
                let currentScrollTop = 0;
                if (this.viewportElement) {
                    currentScrollTop = this.viewportElement.scrollTop;
                }
                setTimeout(() => {
                    if (this.viewportElement) {
                        this.viewportElement.scrollTop = currentScrollTop;
                    }
                }, 50);
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

