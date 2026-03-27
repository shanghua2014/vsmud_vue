import { ref } from 'vue';
import { parseExitDirsFromMudBuffer } from '../../scripts/mud-exit-dirs-parse';

export { parseExitDirsFromMudBuffer };

/** 与房间 exits 键、go.c default_dirs 一致（小写）；供 isUserMoveCommandInput 等使用 */
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

/**
 * null：尚未在下行里解析到出口描述 → 不显示方向按钮；
 * []：已解析且房间无出口；
 * 非空：当前房间出口键（与 look 文案一致）。
 */
export const mudExitKeys = ref<string[] | null>(null);

/** 会话重置等场景清空出口；移动后不再抢先清空，避免方向区 v-if 闪动，新下行/桥接会覆盖 */
export function invalidateMudExitDirs() {
    mudExitKeys.value = null;
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
    const v = mudExitKeys.value;
    return v !== null && v.length > 0;
}

export function resetMudExitDirs() {
    invalidateMudExitDirs();
}

export function applyMudExitDirsFromBuffer(buf: string) {
    const parsed = parseExitDirsFromMudBuffer(buf);
    if (parsed === null) return;
    mudExitKeys.value = parsed;
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
    const vis = mudExitKeys.value;
    if (vis === null || vis.length === 0) return false;
    const keys = BUTTON_CMD_TO_SERVER_KEYS[cmd];
    if (!keys?.length) return false;
    return keys.some((k) => vis.includes(k));
}
