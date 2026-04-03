<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container" @click="handlefocus"></div>
        <el-input
            v-model="inputBox"
            @keydown.enter="onEnterDown"
            @keydown="handleKeyDown"
            :placeholder="inputPlaceholder"
            ref="inputRef"
            class="terminal-input"
        />
        <div v-if="showDownBtn || showAuxTaskFabUi" class="terminal-right-fab-stack">
            <el-button
                v-if="auxTaskFabBridge && showAuxTaskFabUi"
                size="small"
                type="primary"
                plain
                class="down-button"
                :title="auxTaskFabBridge.cmd"
                @click="sendAuxTaskFabClick"
            >
                辅助任务-{{ auxTaskFabBridge.n }}
            </el-button>
            <el-button
                v-if="showDownBtn"
                size="small"
                type="primary"
                plain
                class="down-button"
                title="置底(alt+z)"
                @click="scrollToBottom"
            >
                <el-icon class="mud-yn-actions__btn-icon"><Bottom /></el-icon>
                置底
            </el-button>
            <div v-else-if="showAuxTaskFabUi" class="down-button-placeholder" aria-hidden="true"></div>
        </div>
        <div class="quick-actions" v-if="quickActions.length">
            <el-button
                v-for="action in quickActions"
                :key="action.id"
                size="small"
                type="primary"
                plain
                :title="action.tip"
                @click="runQuickAction(action)"
            >
                {{ action.label }}
            </el-button>
        </div>
        <div v-if="showExitDirPanel" class="mud-dir-panel" role="presentation">
            <div class="dir-panel-capsule" role="group" aria-label="移动方向">
                <div class="dir-grid-5x5">
                    <template v-for="(cell, i) in DIR_GRID_5X5" :key="i">
                        <div v-if="cell === null" class="dir-cell dir-cell--empty" aria-hidden="true" />
                        <button
                            v-else-if="cell.kind === 'look'"
                            type="button"
                            class="dir-btn dir-btn--look"
                            :title="lookBtnLabel === 'Look' ? 'look' : lookBtnLabel"
                            @click="sendLook"
                        >
                            {{ lookBtnLabel }}
                        </button>
                        <button
                            v-else-if="cell.kind === 'move' && isExitButtonVisible(cell.cmd)"
                            type="button"
                            class="dir-btn"
                            @click="sendDir(cell.cmd)"
                        >
                            {{ cell.label }}
                        </button>
                        <div v-else class="dir-cell dir-cell--empty" aria-hidden="true" />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted, computed, type Ref } from 'vue';
import { ElInput, ElMessage, ElButton } from 'element-plus';
import { Bottom } from '@element-plus/icons-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { mudBase, xTermLoginc } from '@/common/common';
import { Utils } from '../../utils/utils';
import { resetMudExitDirs, isExitButtonVisible, mudExitKeys } from '@/common/mudExitDirs';
import { useConfigStore } from '@/stores/store';
import type { MudVue, BrPr, BrEx, BrRt, BrAuxTaskFab } from '@/common/common';

const props = withDefaults(
    defineProps<{
        /** 设置里可关；为 false 时不显示方向区（即便有出口数据） */
        dirPanelOn?: boolean;
    }>(),
    { dirPanelOn: true }
);

// 创建 xTerm 终端逻辑处理实例
const logic = new xTermLoginc();
// 创建基础服务实例
const base = mudBase;

// 使用 ref 获取终端容器 DOM 元素
const terminalContainer = ref<HTMLDivElement | null>(null);
// 终端实例引用
const terminal = ref<Terminal | null>(null);
// 输入框内容
const inputBox = ref('');
// 输入框组件引用
const inputRef = ref<InstanceType<typeof ElInput> | null>(null);
const inputPlaceholder = ref('命令');
// 控制向下按钮是否显示，替换为简短变量名
const showDownBtn = ref(false);
/** 桥接 `auxTaskFab`：匹配 `N、输入指令 … help start …` 时显示「辅助任务-N」 */
const auxTaskFabBridge = ref<BrAuxTaskFab | null>(null);
/** 与 `roomTitle.curRoom` 同步；用于辅助任务按钮房间过滤 */
const curRoomBridge = ref<string | null>(null);
/** 会话中是否存在建号标记；存在时隐藏辅助任务按钮 */
const hasCreateUserSession = ref(false);
/** 点过 1-4 后，忽略后续重复 createUser 桥接，避免刚删又被写回 */
const suppressCreateUserBridge = ref(false);
/** 辅助任务按钮：点击后暂隐，直到下一次桥接重新匹配 */
const auxTaskFabHiddenAfterClick = ref(false);
const auxTaskFabSignal = ref(false);
const auxTaskFabKey = ref('');

const AUX_TASK_HIDE_ROOM = '泥潭注册室';
const syncCreateUserSession = () => {
    hasCreateUserSession.value = Utils.sessionItem('createUser') != null;
};

/** 有桥接辅助任务快照、当前房间不是注册室且未处于建号标记时才显示 */
const showAuxTaskFabUi = computed(() => {
    if (!auxTaskFabBridge.value) return false;
    if (auxTaskFabHiddenAfterClick.value) return false;
    if (hasCreateUserSession.value) return false;
    return curRoomBridge.value !== AUX_TASK_HIDE_ROOM;
});

/** 与设置「方向区」一致；不依赖出口是否已解析或非空（无出口时仍显示罗盘格与中央 Look） */
const showExitDirPanel = computed(() => props.dirPanelOn);

/** 5×5 方向格：四角为空；与图示一致（上行：东北-上方-西北 等） */
type DirCell = null | { kind: 'look' } | { kind: 'move'; label: string; cmd: string };

const DIR_GRID_5X5: DirCell[] = [
    null,
    { kind: 'move', label: '东北', cmd: 'ne' },
    { kind: 'move', label: '上方', cmd: 'u' },
    { kind: 'move', label: '西北', cmd: 'nw' },
    null,

    null,
    { kind: 'move', label: '北上', cmd: 'nu' },
    { kind: 'move', label: '北方', cmd: 'n' },
    { kind: 'move', label: '北下', cmd: 'nd' },
    null,

    { kind: 'move', label: '进入', cmd: 'enter' },
    { kind: 'move', label: '西方', cmd: 'w' },
    { kind: 'look' },
    { kind: 'move', label: '东方', cmd: 'e' },
    { kind: 'move', label: '出去', cmd: 'out' },

    null,
    { kind: 'move', label: '南上', cmd: 'su' },
    { kind: 'move', label: '南方', cmd: 's' },
    { kind: 'move', label: '南下', cmd: 'sd' },
    null,

    null,
    { kind: 'move', label: '东南', cmd: 'se' },
    { kind: 'move', label: '下方', cmd: 'd' },
    { kind: 'move', label: '西南', cmd: 'sw' },
    null,
];

const sendDir = (cmd: string) => {
    base.sendMessage(cmd);
};

/** 方向盘中央文案：仅由桥接层 vsmud-control JSON 的 roomTitle.curRoom 更新；直连无桥时保持 Look */
const lookBtnLabel = ref('Look');

const sendLook = () => {
    base.sendMessage('look');
    base.sendMessage('look');
};

// 定义 emit 事件，添加新事件 notifyParent
const emits = defineEmits([
    'showDownward',
    'menuCommand',
    'sendCommandToChannel',
    'yn',
    'mf',
    'em',
    'chSel',
    'alh',
    'wash',
    'baiShi',
    'baiWuBo',
    'zhaoCz',
    'zhunCc',
    'cfLv',
    'ky',
    'd14',
    'cEye',
    'lHb',
    'cxPwd',
    'pgM',
    'xsP',
    'mzP',
    'qmP',
    'psP',
    'pnP',
    'psBoth',
    'pn2',
    'mudSess',
    /** 文档菜单退出流程结束（清屏后父组件可返回站点列表） */
    'quitListComplete'
]);

const cfgStore = useConfigStore();

/** 文档菜单「退出」：已发 quit，等待「放弃账号」提示以静默发 y，或超时后仍结束流程 */
const quitListPending = ref(false);
let quitListTimer: ReturnType<typeof setTimeout> | null = null;
/** 发 quit 后未匹配到放弃账号提示则超时清屏（毫秒） */
const QUIT_LIST_TIMEOUT_MS = 1000;

/** 连接建立 / 断开时收起所有菜单提示；`includeEmail: false` 用于菜单快捷发送后（保留邮箱提示状态） */
function emitPrFalse(options: { includeEmail?: boolean } = {}) {
    const includeEmail = options.includeEmail !== false;
    emits('yn', false);
    emits('mf', false);
    if (includeEmail) emits('em', false);
    emits('chSel', false);
    emits('alh', false);
    emits('wash', false);
    emits('baiShi', false);
    emits('baiWuBo', false);
    emits('zhaoCz', false);
    emits('zhunCc', false);
    emits('cfLv', false);
    emits('ky', false);
    emits('d14', false);
    emits('cEye', false);
    emits('lHb', false);
    emits('cxPwd', false);
    emits('pgM', false);
    emits('xsP', false);
    emits('mzP', false);
    emits('qmP', false);
    emits('psP', false);
    emits('pnP', false);
    emits('psBoth', false);
    emits('pn2', false);
}

type QuickAction = {
    id: string;
    label: string;
    command?: string;
    type?: 'command' | 'focus';
    /** 悬停提示（如 mygift 条件数值） */
    tip?: string;
};
const quickActions = ref<QuickAction[]>([]);
/** 本会话内已自动发过站点卡片账号/密码，避免重复上行 */
const autoAccountSent = ref(false);
const autoPasswordSent = ref(false);
const serverRawBuffer = ref('');
/**
 * 点「结束」或输入 q 后置位：立即隐藏。清零条件（恢复匹配）：缓冲尾部不再含「未完」，或本包下行里出现新的分页提示行；
 * 不能用「任意非空 raw」清零，否则首包下行就会把标志清掉，按钮立刻被匹配再次打开。
 */
const pageMoreHidden = ref(false);
/** 本会话内已对「重新连线完毕」自动发过 look，避免缓冲区内重复命中 */
const reconnectLookSent = ref(false);
const lastBridgePr = ref<BrPr | null>(null);
let removeScrollListener: () => void;
let onConnected: (() => void) | null = null;
let onError: ((msg: string) => void) | null = null;
let onData: ((data: MudVue) => void) | null = null;
let onDisconnected: (() => void) | null = null;

// 组件挂载后执行初始化操作
onMounted(() => {
    syncCreateUserSession();
    // 创建 xTerm 终端实例
    terminal.value = new Terminal({
        fontFamily: 'Fira Code, Sarasa Mono SC Nerd, Courier New, monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
            foreground: '#008B00',
            cursor: '#EEE8CD'
        },
        scrollback: 300,
        allowProposedApi: true
    });

    // 创建终端尺寸适配插件实例
    const fitAddon = new FitAddon();
    // 加载终端尺寸适配插件
    terminal.value.loadAddon(fitAddon);

    // 若终端容器元素存在，打开终端并调整尺寸
    if (terminalContainer.value) {
        terminal.value.open(terminalContainer.value);
        fitAddon.fit();
    }

    /** Ctrl+C / Cmd+C：有选区时复制到剪贴板，不向 MUD 发送 \\x03；无选区时保持默认（可发中断） */
    terminal.value.attachCustomKeyEventHandler((event: KeyboardEvent) => {
        const isCopy =
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            (event.key === 'c' || event.key === 'C');
        if (!isCopy) return true;
        const text = terminal.value?.getSelection() ?? '';
        if (!text.length) return true;
        event.preventDefault();
        void navigator.clipboard.writeText(text).then(
            () => {
                ElMessage({ message: '已复制到剪贴板', type: 'success', plain: true });
            },
            (err) => {
                console.error('[vsmud] 复制失败:', err);
            }
        );
        inputRef.value?.focus?.();
        return false;
    });

    // 为终端添加一系列事件监听器
    logic.eventListener(terminal, inputRef, fitAddon, ElMessage);

    // 聚焦到输入框
    handlefocus();

    // 调用封装的滚动监听方法
    removeScrollListener = logic.setupScrollListener(terminalContainer, showDownBtn, emits);

    onConnected = () => {
        ElMessage.success('MUD 连接成功');
        resetMudExitDirs();
        serverRawBuffer.value = '';
        lookBtnLabel.value = 'Look';
        pageMoreHidden.value = false;
        quickActions.value = [];
        emitPrFalse();
        autoAccountSent.value = false;
        autoPasswordSent.value = false;
        reconnectLookSent.value = false;
        lastBridgePr.value = null;
        auxTaskFabBridge.value = null;
        curRoomBridge.value = null;
        emits('mudSess');
    };
    onError = (msg: string) => {
        ElMessage.error(msg);
    };

    const maybeRcLook = (p: BrPr) => {
        if (p.rcD && !reconnectLookSent.value) {
            reconnectLookSent.value = true;
            base.sendMessage('look');
            base.sendMessage('look');
            if (terminal.value) {
                sendCommand('look', terminal, 'client');
                sendCommand('look', terminal, 'client');
            }
        }
    };

    /** 仍处于登录/注册/建号流程时不应因 MOTD 后自动 look 灌缓冲，也不依赖本包 decoded 含提示行 */
    const inLoginOrCharCreate = (p: BrPr) =>
        Boolean(
            p.em ||
            p.enNmL ||
            p.qNew ||
            p.qDet ||
            p.yn ||
            p.mf ||
            p.chSel ||
            p.lgPwdL ||
            p.cxPwd ||
            p.xsP ||
            p.mzP ||
            p.qmP ||
            p.psP ||
            p.pnP
        );

    const updQaFromPr = (p: BrPr) => {
        const qn = p.qNew ?? false;
        const qd = p.qDet ?? false;
        if (p.yn || p.mf) {
            quickActions.value = [];
            return;
        }
        const out: QuickAction[] = [];
        if (p.myGiftTask) {
            out.push({
                id: 'mygift-cur',
                label: `任务：${p.myGiftTask.title}`,
                command: 'mygift',
                tip: `条件数值（需达到）：${p.myGiftTask.need}`
            });
        }
        if (qn) out.push({ id: 'send-new', label: '发送 new', command: 'new' });
        if (qd) out.push({ id: 'send-y-detect', label: '发送 y', command: 'y' });
        const seen = new Set<string>();
        quickActions.value = out.filter((a) => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
        });
    };

    const applyBrCtl = (p: BrPr, ex?: BrEx | null, rt?: BrRt | null) => {
        if (quitListPending.value && p.quitAbd) {
            clearQuitListTimer();
            base.sendMessage('y');
            finishQuitToList();
            return;
        }

        lastBridgePr.value = p;
        const nextAuxTaskFab = p.auxTaskFab ?? null;
        const hasAuxTaskFab = Boolean(nextAuxTaskFab);
        const nextAuxTaskFabKey = nextAuxTaskFab
            ? `${nextAuxTaskFab.n}|${nextAuxTaskFab.cmd}`
            : '';
        if (
            hasAuxTaskFab &&
            (!auxTaskFabSignal.value || nextAuxTaskFabKey !== auxTaskFabKey.value)
        ) {
            auxTaskFabHiddenAfterClick.value = false;
        }
        auxTaskFabSignal.value = hasAuxTaskFab;
        auxTaskFabKey.value = nextAuxTaskFabKey;
        auxTaskFabBridge.value = nextAuxTaskFab;

        if (p.createUser === 1 && !suppressCreateUserBridge.value) {
            Utils.sessionItem('createUser', '1');
            syncCreateUserSession();
        }
        if (p.createUser !== 1) {
            suppressCreateUserBridge.value = false;
        }

        emits('yn', p.yn);
        emits('mf', p.mf);
        emits('em', p.em);
        if (p.chSel) {
            inputPlaceholder.value = '命令';
        }
        emits('chSel', p.chSel);
        emits('alh', p.alh);
        emits('wash', p.wash);
        emits('baiShi', Boolean(p.baiShi));
        emits('baiWuBo', Boolean(p.baiWuBo));
        emits('zhaoCz', Boolean(p.zhaoCz));
        emits('zhunCc', Boolean(p.zhunCc));
        emits('cfLv', Boolean(p.cfLv));
        emits('ky', p.ky);
        emits('d14', Boolean(p.d14));
        emits('cEye', p.cEye);
        emits('lHb', p.lHb);
        emits('cxPwd', p.cxPwd);
        emits('pgM', p.pgM && !pageMoreHidden.value);
        emits('xsP', Boolean(p.xsP));
        emits('mzP', Boolean(p.mzP));
        emits('qmP', Boolean(p.qmP));
        emits('psP', Boolean(p.psP));
        emits('pnP', Boolean(p.pnP));
        emits('psBoth', Boolean(p.psBoth));
        emits('pn2', Boolean(p.pn2));
        if (ex && Object.prototype.hasOwnProperty.call(ex, 'sk')) {
            const sk = ex.sk;
            if (sk !== null) {
                mudExitKeys.value = sk;
            }
        }
        if (rt && Object.prototype.hasOwnProperty.call(rt, 'curRoom')) {
            lookBtnLabel.value = rt.curRoom ?? 'Look';
            curRoomBridge.value = rt.curRoom ?? null;
        }
        updQaFromPr(p);

        if (p.reloadPage) {
            window.location.reload();
            return;
        }

        /** 分页「结束」后隐藏；仅依据桥接快照的 pgM */
        if (pageMoreHidden.value && !p.pgM) {
            pageMoreHidden.value = false;
        }

        /** 站点卡片账号/密码自动上行：仅用桥接 prompts，不在前端扫缓冲 */
        const accountTrim = cfgStore.cfg?.account?.trim();
        const pwdTrim = cfgStore.cfg?.password?.trim();
        const skipCredAuto = p.yn || p.mf;
        if (!skipCredAuto && terminal.value) {
            if (pwdTrim && !autoPasswordSent.value) {
                const pwdMatch = (p.lgPwdL ?? false) || p.cxPwd;
                if (pwdMatch) {
                    autoPasswordSent.value = true;
                    base.sendMessage(pwdTrim);
                    sendCommand(pwdTrim, terminal, 'client');
                }
            }
            if (accountTrim && !autoAccountSent.value) {
                if (p.enNmL) {
                    autoAccountSent.value = true;
                    base.sendMessage(accountTrim);
                    sendCommand(accountTrim, terminal, 'client');
                }
            }
        }
    };

    onData = (data: MudVue) => {
        if (data.type === 'bridge-control') {
            /** 正文由 common 对 vsmud-control 先 emit 的 `mud` 帧写入，与直连 binary 路径一致 */
            maybeRcLook(data.prompts);
            applyBrCtl(data.prompts, data.exits, data.roomTitle);
            return;
        }
        /** 纯展示：菜单与方向区仅由前一条 WebSocket 文本帧 `vsmud-control` 更新（须走 mud-bridge） */
        if (data.type !== 'mud') return;
        if (terminal.value) {
            logic.termWrite(terminal, data);
        }
    };
    onDisconnected = () => {
        if (quitListPending.value) {
            quitListPending.value = false;
            clearQuitListTimer();
        }
        ElMessage.info('MUD 连接已断开');
        resetMudExitDirs();
        pageMoreHidden.value = false;
        lookBtnLabel.value = 'Look';
        quickActions.value = [];
        auxTaskFabBridge.value = null;
        curRoomBridge.value = null;
        emitPrFalse();
    };

    base.on('telnet-connected', onConnected);
    base.on('telnet-error', onError);
    base.on('to-vue', onData);
    base.on('telnet-disconnected', onDisconnected);
});

/** 按英文分号拆成多条命令，trim 并去掉空段（如 "e;e;e" → ["e","e","e"]） */
function splitSemicolonCommands(input: string): string[] {
    return input
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

/** 分号串联：每批最多条数；批次之间额外间隔（毫秒） */
const SEMICOLON_BATCH_MAX = 5;
const SEMICOLON_BATCH_GAP_MS = 1000;
/** 同一批内相邻两条命令间隔（毫秒） */
const SEMICOLON_COMMAND_GAP_MS = 500;

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        out.push(items.slice(i, i + chunkSize));
    }
    return out;
}

function delayMs(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const scrollToBottom = () => {
    if (terminal.value) {
        terminal.value.scrollToBottom();
        showDownBtn.value = false;
        emits('showDownward', false);
    }
};

/** `sendCommand` 第三参：兼容原 `'client'` 字符串，或显式是否回显 */
type SendCommandThird = 'client' | { type?: 'client'; showInTerminal?: boolean };

function parseSendCommandThird(third: SendCommandThird | undefined): {
    type: 'client' | undefined;
    showInTerminal: boolean;
} {
    if (third === undefined) return { type: undefined, showInTerminal: false };
    if (third === 'client') return { type: 'client', showInTerminal: false };
    return {
        type: third.type,
        showInTerminal: third.showInTerminal ?? false
    };
}

/**
 * 将命令发往频道/可选回显到终端。
 * - `showInTerminal` 默认 false：不在 xterm 打印该行（菜单/自动上行等）；
 *   输入框直发请传 `{ showInTerminal: true }`。
 * - `type === 'client'` 时仍向频道 emit，样式与原先一致。
 */
const sendCommand = (command: string, termRef: Ref<Terminal | null>, third?: SendCommandThird) => {
    const { type, showInTerminal } = parseSendCommandThird(third);

    if (type === 'client') {
        const parts = command.split('\\');
        emits('sendCommandToChannel', parts.at(-1) ?? command);
    }

    const afterWrite = () => {
        const el = inputRef.value?.$el?.querySelector?.('input') as HTMLInputElement | undefined;
        el?.select();
        scrollToBottom();
    };

    /** 纯回车上行不在前端回显（避免刷屏 [↵]） */
    if (command === '') {
        afterWrite();
        return;
    }

    if (!showInTerminal) {
        afterWrite();
        return;
    }

    const t = termRef.value;
    if (!t) return;

    const displayCmd = command;
    let cmd = `${base.colors.green}[ ${displayCmd} ]${base.colors.reset}\r\n`;
    if (type === 'client') {
        // 按钮/菜单上行：仅加粗前景色，不用 Base.blue（含 44m 蓝底）
        cmd = `\x1b[1;34m${displayCmd}\x1b[0m\r\n`;
    }

    t.write(`${cmd}\r\n`, afterWrite);
};

/**
 * Enter：IME 拼音/注音等组合未结束时也会触发 keydown，若此时提交会表现为「按两次才生效」或误发空行。
 */
const onEnterDown = (ev: Event | KeyboardEvent) => {
    if (!(ev instanceof KeyboardEvent)) return;
    if (ev.key !== 'Enter') return;
    if (ev.isComposing || ev.keyCode === 229) return;
    void handleInput();
};

/**
 * 处理输入框的输入，将非空命令添加到历史记录并发送命令。
 * 支持用 ";" 连接多条命令：每批最多 {@link SEMICOLON_BATCH_MAX} 条；
 * 批内相邻两条间隔 {@link SEMICOLON_COMMAND_GAP_MS}ms；下一批开始前再间隔 {@link SEMICOLON_BATCH_GAP_MS}ms。
 */
const handleInput = async () => {
    if (!terminal.value) return;
    const raw = inputBox.value;
    // 空或仅空白：发送纯回车（与 Base.sendMessage('') 一致，上行 \\r\\n）
    if (raw.trim() === '') {
        logic.addCommandToHistory('');
        inputBox.value = '';
        emits('pgM', false);
        base.sendMessage('');
        sendCommand('', terminal);
        return;
    }

    const parts = splitSemicolonCommands(raw);
    if (parts.length === 0) return;

    if (parts.some((p) => p.trim().toLowerCase() === 'q')) {
        pageMoreHidden.value = true;
    }
    emits('pgM', false);
    logic.addCommandToHistory(raw);
    inputBox.value = '';

    const batches = chunkArray(parts, SEMICOLON_BATCH_MAX);
    for (let b = 0; b < batches.length; b++) {
        if (b > 0) await delayMs(SEMICOLON_BATCH_GAP_MS);
        const batch = batches[b];
        for (let i = 0; i < batch.length; i++) {
            if (i > 0) await delayMs(SEMICOLON_COMMAND_GAP_MS);
            base.sendMessage(batch[i]);
            sendCommand(batch[i], terminal, { showInTerminal: true });
        }
    }
};

/**
 * 处理键盘事件，支持 Alt + 上箭头回滚命令和 Alt + 下箭头翻到下一条命令。
 * @param event - 键盘事件对象
 */
const handleKeyDown = (event: Event | KeyboardEvent) => {
    if (!(event instanceof KeyboardEvent)) return;
    const keyboardEvent = event;
    if (keyboardEvent.key === 'ArrowUp') {
        // 调用封装方法回滚到上一条命令
        const previousCommand = logic.getPreviousCommand();
        if (previousCommand !== null) {
            inputBox.value = previousCommand;
        }
    } else if (keyboardEvent.key === 'ArrowDown') {
        // 调用封装方法翻到下一条命令
        const nextCommand = logic.getNextCommand();
        inputBox.value = nextCommand;
    }
};

/**
 * 点击终端区域时让输入框获得焦点。
 */
const handlefocus = () => {
    inputRef.value?.focus();
};

const runQuickAction = (action: QuickAction | string | undefined) => {
    if (!action) return;
    if (typeof action !== 'string') {
        if (action.type === 'focus') {
            handlefocus();
            return;
        }
        action = action.command;
    }
    if (!action?.trim()) return;
    if (!terminal.value) return;
    base.sendMessage(action);
    sendCommand(action, terminal, 'client');
    // 点击后清空，等待下一次服务端提示刷新
    quickActions.value = [];
};

/** 桥接下发的辅助任务命令（如 `help start`） */
const sendAuxTaskFabClick = () => {
    const cmd = auxTaskFabBridge.value?.cmd?.trim();
    if (!cmd) return;
    suppressCreateUserBridge.value = true;
    Utils.sessionItem('createUser', null);
    syncCreateUserSession();
    auxTaskFabHiddenAfterClick.value = true;
    runQuickAction(cmd);
};

/** 菜单区 y/n 按钮调用：发送并收起菜单按钮 */
const sendMq = (command: string) => {
    runQuickAction(command);
    emitPrFalse({ includeEmail: false });
};

const sendXs = (ch: string) => {
    runQuickAction(ch);
    emits('xsP', false);
};

const sendMz = (ch: string) => {
    runQuickAction(ch);
    emits('mzP', false);
};

const sendQm = (fullName: string) => {
    runQuickAction(fullName);
    emits('qmP', false);
};

const sendPs = (pwd: string, finalize?: boolean) => {
    runQuickAction(pwd);
    if (finalize) emits('psP', false);
};

const sendPn = (pwd: string, finalize?: boolean) => {
    runQuickAction(pwd);
    if (finalize) emits('pnP', false);
};

const sendPgEnter = () => {
    if (!terminal.value) return;
    emits('pgM', false);
    base.sendMessage('');
    sendCommand('', terminal, 'client');
};

const sendPgEnd = () => {
    if (!terminal.value) return;
    pageMoreHidden.value = true;
    emits('pgM', false);
    base.sendMessage('q');
    sendCommand('q', terminal, 'client');
};

const sendRegEm = (email: string) => {
    const t = email.trim();
    if (!t) return;
    if (!terminal.value) return;
    base.sendMessage('l');
    sendCommand('l', terminal, 'client');
    base.sendMessage(`reg ${t}`);
    sendCommand(`reg ${t}`, terminal, 'client');
    quickActions.value = [];
    emits('em', false);
};

const sendChSel = (command: string) => {
    runQuickAction(command);
    inputBox.value = '';
    emits('chSel', false);
};

const sendAlhChoice = (command: string) => {
    runQuickAction(command);
    emits('alh', false);
};

const sendWashChoice = (command: string) => {
    runQuickAction(command);
    emits('wash', false);
};

/** `BAISHI_CMD` / `BAIWUBO_CMD`：`;` 串联多句，按序各发一行 */
const sendSemicolonChainChoice = (command: string, emitDone: () => void) => {
    if (!terminal.value) return;
    const parts = splitSemicolonCommands(command);
    if (!parts.length) return;
    for (const part of parts) {
        base.sendMessage(part);
        sendCommand(part, terminal, 'client');
    }
    quickActions.value = [];
    emitDone();
};

const sendBaiShiChoice = (command: string) => {
    sendSemicolonChainChoice(command, () => emits('baiShi', false));
};

const sendBaiWuBoChoice = (command: string) => {
    sendSemicolonChainChoice(command, () => emits('baiWuBo', false));
};

/** 不 emit zhaoCz/zhunCc false：发送后桥接下帧仍常为 true，若本地置 false 会误判 rematch，按钮应仅靠父级 hiddenAfterClick 隐藏 */
const sendZhaoCzChoice = (command: string) => {
    sendSemicolonChainChoice(command, () => {});
};

const sendZhunCcChoice = (command: string) => {
    sendSemicolonChainChoice(command, () => {});
};

const sendCfLvChoice = (command: string) => {
    runQuickAction(command);
    emits('cfLv', false);
};

const sendKyChoice = (command: string) => {
    runQuickAction(command);
    inputBox.value = '';
    emits('ky', false);
};

/** `[1;36m1. 直接`：菜单发 1～4，并在其后追加 `mygift`（分号串联，与拜师等一致） */
const sendDirect14 = (digit: string) => {
    const d = digit.trim();
    if (!/^[1-4]$/.test(d)) return;
    suppressCreateUserBridge.value = true;
    Utils.sessionItem('createUser', null);
    syncCreateUserSession();
    sendSemicolonChainChoice(`${d};mygift`, () => {
        inputBox.value = '';
        emits('d14', false);
    });
};

const sendCeChoice = (command: string) => {
    runQuickAction(command);
    emits('cEye', false);
};

const sendHbChoice = (command: string) => {
    runQuickAction(command);
    emits('lHb', false);
};

/** 断开当前 MUD WebSocket（返回站点列表前调用） */
const mudDisconnect = () => {
    base.disconnect();
};

function clearQuitListTimer() {
    if (quitListTimer) {
        clearTimeout(quitListTimer);
        quitListTimer = null;
    }
}

/** 文档菜单退出流程收尾：清屏并发 quitListComplete（父组件整页刷新） */
function finishQuitToList() {
    if (!quitListPending.value) return;
    quitListPending.value = false;
    clearQuitListTimer();
    terminal.value?.clear();
    serverRawBuffer.value = '';
    inputBox.value = '';
    emits('quitListComplete');
}

/** 文档菜单「退出」：先发 quit，匹配到放弃账号提示则静默发 y，否则超时后仍清屏 */
function startQuitAndReturnList() {
    if (quitListPending.value) return;
    quitListPending.value = true;
    base.sendMessage('quit');
    clearQuitListTimer();
    quitListTimer = setTimeout(() => finishQuitToList(), QUIT_LIST_TIMEOUT_MS);
}

/** 清空 xterm 屏幕与本地下行缓冲 */
const clearTerminal = () => {
    terminal.value?.clear();
    serverRawBuffer.value = '';
    inputBox.value = '';
};

/** 仅本地回显一行（不发往服务器），如「找花伯」冷却提示 */
const printLocalLine = (text: string) => {
    const t = terminal.value;
    if (!t) return;
    const safe = text.replace(/\x1b/g, '');
    t.write(`\x1b[33m${safe}\x1b[0m\r\n`, () => {
        scrollToBottom();
    });
};

defineExpose({
    scrollToBottom,
    startQuitAndReturnList,
    sendMq,
    sendXs,
    sendMz,
    sendQm,
    sendPs,
    sendPn,
    sendRegEm,
    sendChSel,
    sendAlhChoice,
    sendWashChoice,
    sendBaiShiChoice,
    sendBaiWuBoChoice,
    sendZhaoCzChoice,
    sendZhunCcChoice,
    sendCfLvChoice,
    sendKyChoice,
    sendDirect14,
    sendCeChoice,
    sendHbChoice,
    sendPgEnter,
    sendPgEnd,
    mudDisconnect,
    clearTerminal,
    printLocalLine
});

// 组件卸载时移除监听器
onUnmounted(() => {
    clearQuitListTimer();
    quitListPending.value = false;
    removeScrollListener();
    if (onConnected) base.off('telnet-connected', onConnected);
    if (onError) base.off('telnet-error', onError);
    if (onData) base.off('to-vue', onData);
    if (onDisconnected) base.off('telnet-disconnected', onDisconnected);
    base.disconnect();
});
</script>

<style lang="scss">
.terminal-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    position: relative;
    .terminal-container {
        flex: 1;
        width: 100%;
        // 确保没有额外的 margin 和 padding
        margin: 0;
        padding: 0;
    }

    .terminal-input {
        width: 100%;
        box-sizing: border-box;
        position: relative;
        z-index: 3;
        background: #141414;
    }
    /*
     * 与 .down-button 同列（右侧贴边），叠在菜单栏 .mud-yn-actions（bottom:64px）之上。
     * 菜单栏高度按约一行快捷钮估算，若多行叠档可略调 --mud-menu-stack。
     */
    .quick-actions {
        --mud-menu-stack: 48px;
        position: absolute;
        right: 4px;
        bottom: calc(64px + var(--mud-menu-stack) + 6px);
        z-index: 55;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
        max-width: min(56vw, 480px);
        padding: 4px 8px;
        background: rgba(20, 20, 20, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
        pointer-events: auto;
    }

    div.xterm {
        div.xterm-rows {
            > div {
                margin: 0 5px;
                box-sizing: border-box;
            }
            span {
                letter-spacing: normal !important;
                white-space: pre-wrap !important;
                font-weight: 400;
            }
            span.xterm-cursor.xterm-cursor-outline,
            span.xterm-cursor.xterm-cursor-block {
                opacity: 0;
            }
        }
        .xterm-viewport {
            overflow-y: hidden;
        }
    }

    /*
     * 置底 +（可选）「辅助任务」：贴终端容器右缘；辅助在上、置底在下，文字均横向。
     * 文档入口 `.mud-doc-menu` 仍在更低位（bottom:31px）。
     */
    .terminal-right-fab-stack {
        --fab-slot-h: 24px;
        --fab-slot-w: 72px;
        position: absolute;
        right: 0;
        bottom: 64px;
        /* 低于 Menu 的 .mud-yn-actions(z-index:50)，避免遮挡 y/n 按钮点击 */
        z-index: 45;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
        margin: 0;
        padding: 0;
    }

    .down-button {
        position: relative;
        right: auto;
        bottom: auto;
        height: var(--fab-slot-h);
        min-height: var(--fab-slot-h);
        min-width: var(--fab-slot-w);
    }
    .down-button .mud-yn-actions__btn-icon {
        margin-right: 4px;
        vertical-align: middle;
    }
    /* 置底按钮隐藏时占位：让辅助任务按钮固定在“置底按钮上方”层位 */
    .down-button-placeholder {
        width: var(--fab-slot-w);
        height: var(--fab-slot-h);
        min-height: var(--fab-slot-h);
        pointer-events: none;
        visibility: hidden;
    }

    /* 方向区：叠在终端右侧，距容器底约 1/3 高度 */
    .mud-dir-panel {
        position: absolute;
        right: 3px;
        bottom: 33.333%;
        z-index: 10;
        width: min(300px, 58vw);
        pointer-events: auto;
    }

    /*
     * 竖向「胶囊」轮廓：大圆角 + 轻微渐变，避免多边形裁切带来的生硬感
     */
    .dir-panel-capsule {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 3px 5px 5px;
        border-radius: 10px;
        background: linear-gradient(165deg, rgba(42, 48, 58, 0.4) 0%, rgba(22, 24, 32, 0.4) 55%, rgba(16, 18, 26, 0.4) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow:
            0 8px 28px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(0, 0, 0, 0.35) inset,
            0 1px 0 rgba(255, 255, 255, 0.09) inset;
        backdrop-filter: blur(12px);
    }

    .dir-grid-5x5 {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        grid-template-rows: repeat(5, auto);
        gap: 4px;
        width: 100%;
    }

    .dir-cell--empty {
        min-height: 26px;
    }

    .dir-btn--look {
        font-weight: 600;
        letter-spacing: 0.02em;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dir-btn {
        height: 26px;
        min-width: 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.75);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 2px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
        white-space: nowrap;

        &:hover {
            background: rgba(64, 158, 255, 0.2);
            border-color: rgba(64, 158, 255, 0.45);
            color: #fff;
            box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
        }

        &:active {
            background: rgba(64, 158, 255, 0.35);
            border-color: rgba(64, 158, 255, 0.7);
        }
    }

    /* 房间名按钮：仅字色偏青；背景、边框与其它方向键相同（含 hover/active） */
    .dir-btn.dir-btn--look {
        color: #7dd3fc;

        &:hover {
            color: #a5f3fc;
        }

        &:active {
            color: #cffafe;
        }
    }
}
</style>
