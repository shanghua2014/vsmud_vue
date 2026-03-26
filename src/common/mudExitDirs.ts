import { ref } from 'vue';

/** 与 nt7 cmds/std/look.c look_room 中 exits 文案一致；解析失败则不改上次结果 */
const EXIT_TAIL_CHARS = 12000;

function stripAnsi(s: string): string {
    return s.replace(/\x1b\[[0-9;]*m/g, '');
}

/** 与房间 exits 键、go.c default_dirs 一致（小写） */
const KNOWN_EXIT_KEYS = new Set([
    'north',
    'south',
    'east',
    'west',
    'northup',
    'southup',
    'eastup',
    'westup',
    'northdown',
    'southdown',
    'eastdown',
    'westdown',
    'northeast',
    'northwest',
    'southeast',
    'southwest',
    'up',
    'down',
    'enter',
    'out'
]);

const MARK_NONE = '这里没有任何明显的出路';
const MARK_SINGLE = '这里唯一的出口是';
const MARK_MULTI = '这里明显的出口是';

function parseMultiExitInner(innerRaw: string): string[] {
    let inner = innerRaw.trim().replace(/\s+/g, ' ');
    const parts = inner.split(/\s+和\s+/);
    const out: string[] = [];
    if (parts.length === 1) {
        for (const t of parts[0].split(/、/)) {
            const k = t.trim().toLowerCase();
            if (KNOWN_EXIT_KEYS.has(k)) out.push(k);
        }
    } else {
        for (let i = 0; i < parts.length - 1; i++) {
            for (const t of parts[i].split(/、/)) {
                const k = t.trim().toLowerCase();
                if (KNOWN_EXIT_KEYS.has(k)) out.push(k);
            }
        }
        const last = parts[parts.length - 1].trim().toLowerCase();
        if (KNOWN_EXIT_KEYS.has(last)) out.push(last);
    }
    return out;
}

/**
 * 从缓冲尾部解析**当前房间**出口：若缓冲里有多段描述，以**最后一次出现**的为准（移动后仍保留旧房间文案时常用）。
 * - 最后一段为「没有任何明显的出路」→ []
 * - 最后一段为「唯一的出口」→ 单元素
 * - 最后一段为「明显的出口」→ 多出口
 * - 未命中 → null（不更新 UI）
 */
export function parseExitDirsFromMudBuffer(buf: string): string[] | null {
    if (!buf) return null;
    const text = stripAnsi(buf.length > EXIT_TAIL_CHARS ? buf.slice(-EXIT_TAIL_CHARS) : buf);

    const idxNone = text.lastIndexOf(MARK_NONE);
    const idxSingle = text.lastIndexOf(MARK_SINGLE);
    const idxMulti = text.lastIndexOf(MARK_MULTI);

    let win: 'none' | 'single' | 'multi' | null = null;
    let winIdx = -1;
    if (idxNone >= 0 && idxNone >= winIdx) {
        win = 'none';
        winIdx = idxNone;
    }
    if (idxSingle >= 0 && idxSingle > winIdx) {
        win = 'single';
        winIdx = idxSingle;
    }
    if (idxMulti >= 0 && idxMulti > winIdx) {
        win = 'multi';
        winIdx = idxMulti;
    }

    if (win === null || winIdx < 0) return null;

    if (win === 'none') {
        return [];
    }

    if (win === 'single') {
        const sub = text.slice(idxSingle);
        const m = sub.match(new RegExp(`^${MARK_SINGLE}\\s*([a-z]+)\\s*[。．]`));
        if (!m) return null;
        const k = m[1].toLowerCase();
        return KNOWN_EXIT_KEYS.has(k) ? [k] : [];
    }

    const sub = text.slice(idxMulti);
    const multi = sub.match(new RegExp(`^${MARK_MULTI}\\s*([\\s\\S]+?)\\s*[。．]`));
    if (!multi) return null;
    return parseMultiExitInner(multi[1]);
}

/**
 * null：尚未在下行里解析到出口描述 → 不显示方向按钮；
 * []：已解析且房间无出口；
 * 非空：当前房间出口键（与 look 文案一致）。
 */
export const mudVisibleExitServerKeys = ref<string[] | null>(null);

/** 玩家发起移动后、新房间描述未到前，清空出口状态避免仍显示上一房间 */
export function invalidateMudExitDirs() {
    mudVisibleExitServerKeys.value = null;
}

/** 与罗盘/输入框一致：是否为「走路」类上行（用于移动后失效出口缓存） */
export function isUserMoveCommandInput(cmd: string): boolean {
    const t = cmd.trim().toLowerCase();
    if (!t) return false;
    if (KNOWN_EXIT_KEYS.has(t)) return true;
    const abbrev = new Set([
        'n',
        's',
        'e',
        'w',
        'ne',
        'nw',
        'se',
        'sw',
        'nu',
        'eu',
        'su',
        'wu',
        'nd',
        'ed',
        'sd',
        'wd'
    ]);
    if (abbrev.has(t)) return true;
    return false;
}

/** 是否展示整块方向面板（有出口且已解析） */
export function shouldShowExitDirPanel(): boolean {
    const v = mudVisibleExitServerKeys.value;
    return v !== null && v.length > 0;
}

export function resetMudExitDirs() {
    invalidateMudExitDirs();
}

export function applyMudExitDirsFromBuffer(buf: string) {
    const parsed = parseExitDirsFromMudBuffer(buf);
    if (parsed === null) return;
    mudVisibleExitServerKeys.value = parsed;
}

/** 按钮 cmd（与 Channel 发送串一致）→ 对应服务端出口键（任一命中即可显示） */
const BUTTON_CMD_TO_SERVER_KEYS: Record<string, string[]> = {
    n: ['north'],
    s: ['south'],
    e: ['east'],
    w: ['west'],
    ne: ['northeast'],
    nw: ['northwest'],
    se: ['southeast'],
    sw: ['southwest'],
    u: ['up'],
    d: ['down'],
    enter: ['enter'],
    out: ['out'],
    nu: ['northup'],
    eu: ['eastup'],
    su: ['southup'],
    wu: ['westup'],
    nd: ['northdown'],
    ed: ['eastdown'],
    sd: ['southdown'],
    wd: ['westdown']
};

export function isExitButtonVisible(cmd: string): boolean {
    const vis = mudVisibleExitServerKeys.value;
    if (vis === null || vis.length === 0) return false;
    const keys = BUTTON_CMD_TO_SERVER_KEYS[cmd];
    if (!keys?.length) return false;
    return keys.some((k) => vis.includes(k));
}
