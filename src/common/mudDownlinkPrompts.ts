/**
 * MUD 原始下行文本匹配（保留 ANSI / 裸 CSI），供 Terminal 与菜单提示等复用。
 */

/** [1;31m 后接 ask lao；兼容 CSI 前有 ESC */
export const ASK_LAO_HERE_DOWMLINK_PATTERN = /(?:\x1b)?\[1;31mask lao/i;

/** 菜单「老对长」点击后发往服务器的命令 */
export const ASK_LAO_HERE_COMMAND = 'ask lao about here';

export function matchAskLaoHereDownlink(raw: string): boolean {
    return ASK_LAO_HERE_DOWMLINK_PATTERN.test(raw);
}

/** [2;37;0m指令格式：washto；兼容 CSI 前有 ESC */
export const WASH_TO_FORMAT_DOWMLINK_PATTERN = /(?:\x1b)?\[2;37;0m指令格式：washto/i;

/** 菜单「确定」（washto 提示）点击后发往服务器的命令 */
export const WASH_TO_CONFIRM_COMMAND = 'washto 20 20 20 20';

export function matchWashToFormatDownlink(raw: string): boolean {
    return WASH_TO_FORMAT_DOWMLINK_PATTERN.test(raw);
}

/** [1;31m要了解的信息；兼容 CSI 前有 ESC */
export const INFO_TOPICS_DOWMLINK_PATTERN = /(?:\x1b)?\[1;31m要了解的信息/;

/** 信息子选项数量（菜单 1～12，4×3） */
export const INFO_TOPICS_COUNT = 12;

/** 数字 n（1…INFO_TOPICS_COUNT）对应发往服务器的命令 */
export function buildInfoTopicChoiceCommand(index: number): string {
    const n = Math.trunc(index);
    return `ask lao about ${n}`;
}

export function matchInfoTopicsDownlink(raw: string): boolean {
    return INFO_TOPICS_DOWMLINK_PATTERN.test(raw);
}

/** [1;33m如果你是位老玩家；兼容 CSI 前有 ESC */
export const VETERAN_PLAYER_CHUCUN_DOWMLINK_PATTERN = /(?:\x1b)?\[1;33m如果你是位老玩家/;

/** 菜单「出村」点击后发往服务器的命令 */
export const ASK_LAO_LEAVE_VILLAGE_COMMAND = 'ask lao about 出村';

export function matchVeteranPlayerLeaveVillageDownlink(raw: string): boolean {
    return VETERAN_PLAYER_CHUCUN_DOWMLINK_PATTERN.test(raw);
}

/** [1;31m1.快意恩仇；兼容 CSI 前有 ESC（「1.」为字面点） */
export const KUAIYI_PVP_PVE_DOWMLINK_PATTERN = /(?:\x1b)?\[1;31m1\.快意恩仇/;

export const KUAIYI_CHOOSE_PVP_COMMAND = 'choose 1';
export const KUAIYI_CHOOSE_PVE_COMMAND = 'choose 2';

export function matchKuaiyiPvpPveDownlink(raw: string): boolean {
    return KUAIYI_PVP_PVE_DOWMLINK_PATTERN.test(raw);
}

/** closeeye 与右括号「）」；兼容半角 )、多空格；大小写不敏感 */
export const CLOSE_EYE_DOWMLINK_PATTERN = /closeeye\s*[）)]/i;

/** 菜单「闭眼」点击后发往服务器的命令 */
export const CLOSE_EYE_COMMAND = 'closeeye';

export function matchCloseEyeDownlink(raw: string): boolean {
    return CLOSE_EYE_DOWMLINK_PATTERN.test(raw);
}

/** [1;36m老村长嘱咐道：；兼容 CSI 前有 ESC */
export const LAO_CUNZHANG_HUABO_MSG_DOWMLINK_PATTERN = /(?:\x1b)?\[1;36m老村长嘱咐道：/;

/** 菜单「找花伯」点击后发往服务器的命令 */
export const ASK_LAO_HUABO_COMMAND = 'ask lao about 花伯';

export function matchLaoCunzhangHuaboMsgDownlink(raw: string): boolean {
    return LAO_CUNZHANG_HUABO_MSG_DOWMLINK_PATTERN.test(raw);
}

/**
 * 顶头匹配：缓冲区开头或换行后的行首；可选 ANSI 后接「这个角色已经存在」+ 全角/半角逗号。
 * （分两段避免「^」零宽后无法跳过行首的 \\r\\n）
 */
const CHARACTER_EXISTS_AT_BUFFER_START =
    '^(?:\\x1b\\[[0-9;]*m)*这个角色已经存在[，,]';
const CHARACTER_EXISTS_AFTER_NEWLINE =
    '(?:\\r\\n|\\r|\\n)(?:\\x1b\\[[0-9;]*m)*这个角色已经存在[，,]';
export const CHARACTER_EXISTS_PASSWORD_DOWMLINK_PATTERN = new RegExp(
    `${CHARACTER_EXISTS_AT_BUFFER_START}|${CHARACTER_EXISTS_AFTER_NEWLINE}`
);

export function matchCharacterExistsPasswordDownlink(raw: string): boolean {
    return CHARACTER_EXISTS_PASSWORD_DOWMLINK_PATTERN.test(raw);
}

/**
 * 分页未完（按回车翻页）。
 * 兼容 \\x1b[37m、[2;37m 等；== 与「未完」之间允许任意空白（含无空格）。
 */
export const PAGE_MORE_UNFINISHED_DOWMLINK_PATTERN = /(?:\x1b)?\[[0-9;]*37m==\s*未完/;

/** 只取缓冲末尾一段再取最后几行匹配，避免整段尾部里旧的提示行一直为真、按钮不隐藏 */
export const PAGE_MORE_MATCH_TAIL_CHARS = 2048;
/** 略放大，避免分页提示行刚好在「最后第 5 行」时匹配不到 */
export const PAGE_MORE_MATCH_LAST_LINES = 6;

function matchPageLinePromptInTail(pattern: RegExp, raw: string): boolean {
    if (!raw) return false;
    const slice =
        raw.length > PAGE_MORE_MATCH_TAIL_CHARS ? raw.slice(-PAGE_MORE_MATCH_TAIL_CHARS) : raw;
    const lines = slice.split(/\r?\n/);
    const lastFew = lines.slice(-PAGE_MORE_MATCH_LAST_LINES).join('\n');
    return pattern.test(lastFew);
}

export function matchPageMoreUnfinishedDownlink(raw: string): boolean {
    return matchPageLinePromptInTail(PAGE_MORE_UNFINISHED_DOWMLINK_PATTERN, raw);
}

/** 重新连线完毕（常见前缀为 CSI \\[K 清行；兼容前有 ESC） */
export const RECONNECT_DONE_DOWMLINK_PATTERN = /(?:\x1b)?\[K重新连线完毕[。]?/;

export function matchReconnectDoneDownlink(raw: string): boolean {
    return RECONNECT_DONE_DOWMLINK_PATTERN.test(raw);
}
