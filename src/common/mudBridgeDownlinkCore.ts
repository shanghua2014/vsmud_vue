/**
 * MUD 下行匹配与桥接提示快照（与 scripts/mud-bridge-control 共用同一套逻辑）。Terminal 直连 WebSocket 时也用本模块计算。
 */
import type { BrPr } from './common';

// ---------------------------------------------------------------------------
// 与 mudDownlinkPrompts 历史导出名一致的模式与命令常量（短名）
// ---------------------------------------------------------------------------

/** [1;31m 后接 ask lao；兼容 CSI 前有 ESC */
export const ALH_PAT = /(?:\x1b)?\[1;31mask lao/i;

/** 菜单「老对长」点击后发往服务器的命令 */
export const ALH_CMD = 'ask lao about here';

/** [2;37;0m指令格式：washto；兼容 CSI 前有 ESC */
export const WASH_PAT = /(?:\x1b)?\[2;37;0m指令格式：washto/i;

/** 菜单「确定」（washto 提示）点击后发往服务器的命令 */
export const WASH_CMD = 'washto 20 20 20 20';

/** [1;31m要了解的信息；兼容 CSI 前有 ESC */
export const INF_PAT = /(?:\x1b)?\[1;31m要了解的信息/;

/** 信息子选项数量（菜单 1～12，4×3） */
export const INF_N = 12;

/** [1;33m如果你是位老玩家；兼容 CSI 前有 ESC */
export const VET_PAT = /(?:\x1b)?\[1;33m如果你是位老玩家/;

/** 菜单「出村」点击后发往服务器的命令 */
export const LV_CMD = 'ask lao about 出村';

/** [1;31m1.快意恩仇；兼容 CSI 前有 ESC（「1.」为字面点） */
export const KY_PAT = /(?:\x1b)?\[1;31m1\.快意恩仇/;

export const KY_PVP_CMD = 'choose 1';
export const KY_PVE_CMD = 'choose 2';

/** closeeye 与右括号「）」；兼容半角 )、多空格；大小写不敏感 */
export const CE_PAT = /closeeye\s*[）)]/i;

/** 菜单「闭眼」点击后发往服务器的命令 */
export const CE_CMD = 'closeeye';

/** [1;36m老村长嘱咐道：；兼容 CSI 前有 ESC */
export const HB_PAT = /(?:\x1b)?\[1;36m老村长嘱咐道：/;

/** 菜单「找花伯」点击后发往服务器的命令 */
export const HB_CMD = 'walk 村口';

const CX_BUF0 = '^(?:\\x1b\\[[0-9;]*m)*这个角色已经存在[，,]';
const CX_NL = '(?:\\r\\n|\\r|\\n)(?:\\x1b\\[[0-9;]*m)*这个角色已经存在[，,]';

/** 顶头匹配：缓冲区开头或换行后的行首；可选 ANSI 后接「这个角色已经存在」+ 全角/半角逗号。 */
export const CX_PAT = new RegExp(`${CX_BUF0}|${CX_NL}`);

/** 分页未完（按回车翻页）。 */
export const PG_UNF_PAT = /(?:\x1b)?\[[0-9;]*37m==\s*未完/;

export const PG_TAIL = 2048;
export const PG_LINES = 6;

/** 重新连线完毕 */
export const RC_PAT = /(?:\x1b)?\[K重新连线完毕[。]?/;

/** 登录行：请输入密码 / password */
export const LG_PWD_PAT = /(请输入密码)|(\bpassword\b)/i;

/** 英文名提示行 */
export const EN_NM_PAT = /((你|您)的英文名)|(\bname\b)/i;

/** 终端快捷条：发送 new */
export const Q_NEW_PAT = /(人物请输入new。)|(\bnew\b)/i;

/** 终端快捷条：客户端检测确认 */
export const Q_DET_PAT = /(即将开始检测你的客户端)|(detect)/i;

// ---------------------------------------------------------------------------
// 桥接层 card 提示
// ---------------------------------------------------------------------------

const XS_PAT = /(?:\x1b)?\[1;32m姓氏/;
const MZ_PAT = /(?:\x1b)?\[1;33m名字/;
const QM_PAT = /(?:\x1b)?\[2;37;0m请输入您的全名\(/;

const PS_PAT = /(?:\x1b)?\[2;37;0m(?:请设定您的管|请再输入一次您的管)/;
const PS_1 = /(?:\x1b)?\[2;37;0m请设定您的管/;
const PS_2 = /(?:\x1b)?\[2;37;0m请再输入一次您的管/;

const PN_PAT =
    /(?:\x1b)?\[[0-9;]*m(?:请输入你的普|请再输入一次您的(?:密|密码))/;
const PN_1 = /(?:\x1b)?\[[0-9;]*m请输入你的普/;
const PN_2 = /(?:\x1b)?\[[0-9;]*m请再输入一次您的(?:密|密码)/;

const CARD_ORD = [
    { re: QM_PAT, key: 'qmP' as const },
    { re: MZ_PAT, key: 'mzP' as const },
    { re: XS_PAT, key: 'xsP' as const },
    { re: PS_PAT, key: 'psP' as const },
    { re: PN_PAT, key: 'pnP' as const }
] as const;

type CardKey = (typeof CARD_ORD)[number]['key'];
type CardFlags = Record<CardKey, boolean>;

const CARD_NONE: CardFlags = {
    xsP: false,
    mzP: false,
    qmP: false,
    psP: false,
    pnP: false
};

function lastIdx(re: RegExp, s: string): number {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
    const rg = new RegExp(re.source, flags);
    let last = -1;
    for (const m of s.matchAll(rg)) {
        if (m.index !== undefined) last = m.index;
    }
    return last;
}

function resolveCard(bufFull: string): CardFlags {
    const scored = CARD_ORD.map((d) => ({
        key: d.key,
        i: lastIdx(d.re, bufFull)
    }));
    const max = Math.max(-1, ...scored.map((x) => x.i));
    if (max < 0) return { ...CARD_NONE };
    const win = scored.find((x) => x.i === max)!;
    return { ...CARD_NONE, [win.key]: true };
}

function pn2Ready(bufFull: string): boolean {
    const i1 = lastIdx(PN_1, bufFull);
    const i2 = lastIdx(PN_2, bufFull);
    if (i2 < 0) return false;
    return i1 < 0 || i2 > i1;
}

export function ynOk(chunk: string): boolean {
    const ansi = '(?:\\x1b\\[[0-9;]*m)*';
    const ynWithAnsi = new RegExp(
        `[(（]${ansi}y${ansi}\\/${ansi}n${ansi}[)）]|${ansi}y${ansi}\\/${ansi}n`,
        'i'
    );
    return ynWithAnsi.test(chunk);
}

export function mfOk(chunk: string): boolean {
    const ansi = '(?:\\x1b\\[[0-9;]*m)*';
    const mfWithAnsi = new RegExp(
        `(?:男性|女性)[^\\r\\n]*?\\(${ansi}m${ansi}\\)[^\\r\\n]*?(?:或|/|、|,|，)[^\\r\\n]*?\\(${ansi}f${ansi}\\)|\\(${ansi}m${ansi}\\)[^\\r\\n]*?\\(${ansi}f${ansi}\\)|${ansi}m${ansi}\\/${ansi}f`,
        'i'
    );
    return mfWithAnsi.test(chunk);
}

export function emOk(buf: string): boolean {
    return /\[1;36mregister/i.test(buf);
}

export function chSelOk(buf: string): boolean {
    return /(?:\x1b)?\[2;37;0m您可以选择\(choose/i.test(buf);
}

function pgTailOk(raw: string): boolean {
    if (!raw) return false;
    const slice = raw.length > PG_TAIL ? raw.slice(-PG_TAIL) : raw;
    const lines = slice.split(/\r?\n/);
    const lastFew = lines.slice(-PG_LINES).join('\n');
    return PG_UNF_PAT.test(lastFew);
}

/** 数字 n（1…INF_N）对应发往服务器的命令 */
export function infTopicCmd(index: number): string {
    const n = Math.trunc(index);
    return `ask lao about ${n}`;
}

export function mAlh(raw: string): boolean {
    return ALH_PAT.test(raw);
}

export function mWash(raw: string): boolean {
    return WASH_PAT.test(raw);
}

export function mInf(raw: string): boolean {
    return INF_PAT.test(raw);
}

export function mVet(raw: string): boolean {
    return VET_PAT.test(raw);
}

export function mKy(raw: string): boolean {
    return KY_PAT.test(raw);
}

export function mCe(raw: string): boolean {
    return CE_PAT.test(raw);
}

export function mHb(raw: string): boolean {
    return HB_PAT.test(raw);
}

export function mCx(raw: string): boolean {
    return CX_PAT.test(raw);
}

export function mPg(raw: string): boolean {
    return pgTailOk(raw);
}

export function mRc(raw: string): boolean {
    return RC_PAT.test(raw);
}

export function snapBr(decodedChunk: string, bufFull: string): BrPr {
    const yn = ynOk(decodedChunk);
    const mf = mfOk(decodedChunk);
    const card = resolveCard(bufFull);
    const psBoth = PS_1.test(bufFull) && PS_2.test(bufFull);
    const pn2 = pn2Ready(bufFull);

    const lgPwdL = LG_PWD_PAT.test(decodedChunk);
    const enNmL = EN_NM_PAT.test(decodedChunk);
    const qNew = !yn && !mf && Q_NEW_PAT.test(decodedChunk);
    const qDet = !yn && !mf && Q_DET_PAT.test(decodedChunk);

    return {
        yn,
        mf,
        em: emOk(bufFull),
        chSel: chSelOk(bufFull),
        alh: ALH_PAT.test(bufFull),
        wash: WASH_PAT.test(bufFull),
        infT: INF_PAT.test(bufFull),
        lvV: VET_PAT.test(bufFull),
        ky: KY_PAT.test(bufFull),
        cEye: CE_PAT.test(bufFull),
        lHb: HB_PAT.test(bufFull),
        cxPwd: mCx(bufFull),
        pgM: pgTailOk(bufFull),
        rcD: mRc(bufFull),
        xsP: card.xsP,
        mzP: card.mzP,
        qmP: card.qmP,
        psP: card.psP,
        pnP: card.pnP,
        psBoth,
        pn2,
        lgPwdL,
        enNmL,
        qNew,
        qDet
    };
}
