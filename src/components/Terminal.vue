<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container" @click="handlefocus"></div>
        <div class="quick-actions" v-if="quickActions.length">
            <el-button
                v-for="action in quickActions"
                :key="action.id"
                size="small"
                type="primary"
                plain
                @click="runQuickAction(action)"
            >
                {{ action.label }}
            </el-button>
        </div>
        <el-input v-model="inputBox" @keydown.enter="handleInput" @keydown="handleKeyDown" :placeholder="inputPlaceholder" ref="inputRef" class="terminal-input" />
        <el-button v-if="showDownBtn" @click="scrollToBottom" class="down-button" title="置底(alt+z)">
            <Bottom style="width: 31px; height: 1rem" />
        </el-button>
        <div v-if="showExitDirPanel" class="mud-dir-panel" role="presentation">
            <div class="dir-panel-capsule" role="group" aria-label="移动方向">
                <div class="dir-grid-5x5">
                    <template v-for="(cell, i) in DIR_GRID_5X5" :key="i">
                        <div v-if="cell === null" class="dir-cell dir-cell--empty" aria-hidden="true" />
                        <button
                            v-else-if="cell.kind === 'look'"
                            type="button"
                            class="dir-btn dir-btn--look"
                            @click="sendLook"
                        >
                            Look
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
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { ElInput, ElMessage, ElButton } from 'element-plus';
import { Bottom } from '@element-plus/icons-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { Base, xTermLoginc } from '@/common/common';
import { applyMudDownlinkForRoomRecord, resetMudRoomRecord } from '@/common/mudRoomRecord';
import {
    applyMudExitDirsFromBuffer,
    resetMudExitDirs,
    invalidateMudExitDirs,
    isUserMoveCommandInput,
    isExitButtonVisible,
    mudVisibleExitServerKeys
} from '@/common/mudExitDirs';
import {
    matchAskLaoHereDownlink,
    matchCloseEyeDownlink,
    matchLaoCunzhangHuaboMsgDownlink,
    matchCharacterExistsPasswordDownlink,
    matchPageMoreUnfinishedDownlink,
    matchInfoTopicsDownlink,
    matchKuaiyiPvpPveDownlink,
    matchReconnectDoneDownlink,
    matchVeteranPlayerLeaveVillageDownlink,
    matchWashToFormatDownlink
} from '@/common/mudDownlinkPrompts';
import { useConfigStore } from '@/stores/store';

// 创建 xTerm 终端逻辑处理实例
const logic = new xTermLoginc();
// 创建基础服务实例
const base = new Base();

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

const showExitDirPanel = computed(() => {
    const v = mudVisibleExitServerKeys.value;
    return v !== null && v.length > 0;
});

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
    invalidateMudExitDirs();
    base.sendMessage(cmd);
};

const sendLook = () => {
    base.sendMessage('look');
};

// 定义 emit 事件，添加新事件 notifyParent
const emits = defineEmits([
    'showDownward',
    'menuCommand',
    'sendCommandToChannel',
    'ynPrompt',
    'mfPrompt',
    'emailPrompt',
    'chooseCharacterPrompt',
    'askLaoHerePrompt',
    'washToPrompt',
    'infoTopicsPrompt',
    'leaveVillagePrompt',
    'kuaiyiPvpPvePrompt',
    'closeEyePrompt',
    'laoHuaboPrompt',
    'characterExistsPasswordPrompt',
    /** 下行 [37m== 未完 时菜单栏显示「下一页」「结束」（同状态） */
    'pageMorePrompt',
    'mudSessionStart'
]);

type QuickAction = { id: string; label: string; command?: string; type?: 'command' | 'focus' };
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

let removeScrollListener: () => void;
let onConnected: (() => void) | null = null;
let onError: ((msg: string) => void) | null = null;
let onData: ((data: { type: string; content: string }) => void) | null = null;
let onDisconnected: (() => void) | null = null;

// 组件挂载后执行初始化操作
onMounted(() => {
    // 创建 xTerm 终端实例
    terminal.value = new Terminal({
        fontFamily: 'Fira Code, Sarasa Mono SC Nerd, Courier New, monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
            foreground: '#D3D3D3'
        },
        scrollback: 300,
        allowProposedApi: true
    });

    // 向终端写入欢迎信息
    // for (let i = 0; i < 100; i++) {
    //     terminal.value.write(`[ 欢迎使用 xTerm 终端-${i} ]\r\n`);
    // }

    // 创建终端尺寸适配插件实例
    const fitAddon = new FitAddon();
    // 加载终端尺寸适配插件
    terminal.value.loadAddon(fitAddon);

    // 若终端容器元素存在，打开终端并调整尺寸
    if (terminalContainer.value) {
        terminal.value.open(terminalContainer.value);
        fitAddon.fit();
    }

    // 为终端添加一系列事件监听器
    logic.eventListener(terminal, inputRef, fitAddon, ElMessage);

    // 聚焦到输入框
    handlefocus();

    // 调用封装的滚动监听方法
    removeScrollListener = logic.setupScrollListener(terminalContainer, showDownBtn, emits);

    onConnected = () => {
        ElMessage.success('MUD 连接成功');
        resetMudRoomRecord();
        resetMudExitDirs();
        serverRawBuffer.value = '';
        pageMoreHidden.value = false;
        emits('ynPrompt', false);
        emits('mfPrompt', false);
        emits('emailPrompt', false);
        emits('chooseCharacterPrompt', false);
        emits('askLaoHerePrompt', false);
        emits('washToPrompt', false);
        emits('infoTopicsPrompt', false);
        emits('leaveVillagePrompt', false);
        emits('kuaiyiPvpPvePrompt', false);
        emits('closeEyePrompt', false);
        emits('laoHuaboPrompt', false);
        emits('characterExistsPasswordPrompt', false);
        emits('pageMorePrompt', false);
        autoAccountSent.value = false;
        autoPasswordSent.value = false;
        reconnectLookSent.value = false;
        emits('mudSessionStart');
    };
    onError = (msg: string) => {
        ElMessage.error(msg);
    };
    onData = (data: { type: string; content: string }) => {
        if (terminal.value) {
            logic.termWrite(terminal, data);
        }
        const raw = data?.content ?? '';
        applyMudDownlinkForRoomRecord(raw);
        serverRawBuffer.value = `${serverRawBuffer.value}${raw}`.slice(-4096);
        applyMudExitDirsFromBuffer(serverRawBuffer.value);

        if (!reconnectLookSent.value && matchReconnectDoneDownlink(serverRawBuffer.value)) {
            reconnectLookSent.value = true;
            base.sendMessage('look');
            if (terminal.value) {
                sendCommand('look', terminal, 'client');
            }
        }

        const configStoreAuto = useConfigStore();
        const accountTrim = configStoreAuto.configInfo?.account?.trim();
        const pwdTrim = configStoreAuto.configInfo?.password?.trim();
        const skipCredAuto = hasYnPrompt(raw) || hasMfPrompt(raw);
        if (!skipCredAuto && terminal.value) {
            if (pwdTrim && !autoPasswordSent.value) {
                const pwdMatch =
                    /(请输入密码)|(\bpassword\b)/i.test(raw) ||
                    matchCharacterExistsPasswordDownlink(serverRawBuffer.value);
                if (pwdMatch) {
                    autoPasswordSent.value = true;
                    base.sendMessage(pwdTrim);
                    sendCommand(pwdTrim, terminal, 'client');
                }
            }
            if (accountTrim && !autoAccountSent.value) {
                if (/((你|您)的英文名)|(\bname\b)/i.test(raw)) {
                    autoAccountSent.value = true;
                    base.sendMessage(accountTrim);
                    sendCommand(accountTrim, terminal, 'client');
                }
            }
        }

        quickActions.value = computeQuickActions(raw);
        // 每条下行用当前缓冲尾部最后几行重匹配；匹配不到则隐藏
        const buf = serverRawBuffer.value;
        const pageMoreMatched = matchPageMoreUnfinishedDownlink(buf);
        const pageMorePromptInThisChunk =
            raw.length > 0 && matchPageMoreUnfinishedDownlink(raw);
        if (pageMoreHidden.value) {
            if (!pageMoreMatched || pageMorePromptInThisChunk) {
                pageMoreHidden.value = false;
            }
        }
        if (pageMoreHidden.value) {
            emits('pageMorePrompt', false);
        } else {
            emits('pageMorePrompt', pageMoreMatched);
        }
        emits('ynPrompt', hasYnPrompt(raw));
        emits('mfPrompt', hasMfPrompt(raw));
        if (hasEmailPrompt(serverRawBuffer.value)) {
            emits('emailPrompt', true);
        }
        if (hasChooseCharacterPrompt(serverRawBuffer.value)) {
            inputPlaceholder.value = '命令';
            emits('chooseCharacterPrompt', true);
        }
        if (matchAskLaoHereDownlink(serverRawBuffer.value)) {
            emits('askLaoHerePrompt', true);
        }
        if (matchWashToFormatDownlink(serverRawBuffer.value)) {
            emits('washToPrompt', true);
        }
        if (matchInfoTopicsDownlink(serverRawBuffer.value)) {
            emits('infoTopicsPrompt', true);
        }
        if (matchVeteranPlayerLeaveVillageDownlink(serverRawBuffer.value)) {
            emits('leaveVillagePrompt', true);
        }
        if (matchKuaiyiPvpPveDownlink(serverRawBuffer.value)) {
            emits('kuaiyiPvpPvePrompt', true);
        }
        if (matchCloseEyeDownlink(serverRawBuffer.value)) {
            emits('closeEyePrompt', true);
        }
        if (matchLaoCunzhangHuaboMsgDownlink(serverRawBuffer.value)) {
            emits('laoHuaboPrompt', true);
        }
        if (matchCharacterExistsPasswordDownlink(serverRawBuffer.value)) {
            emits('characterExistsPasswordPrompt', true);
        }
    };
    onDisconnected = () => {
        ElMessage.info('MUD 连接已断开');
        resetMudRoomRecord();
        resetMudExitDirs();
        pageMoreHidden.value = false;
        emits('ynPrompt', false);
        emits('mfPrompt', false);
        emits('emailPrompt', false);
        emits('chooseCharacterPrompt', false);
        emits('askLaoHerePrompt', false);
        emits('washToPrompt', false);
        emits('infoTopicsPrompt', false);
        emits('leaveVillagePrompt', false);
        emits('kuaiyiPvpPvePrompt', false);
        emits('closeEyePrompt', false);
        emits('laoHuaboPrompt', false);
        emits('characterExistsPasswordPrompt', false);
        emits('pageMorePrompt', false);
    };

    base.on('telnet-connected', onConnected);
    base.on('telnet-error', onError);
    base.on('to-vue', onData);
    base.on('telnet-disconnected', onDisconnected);
});

/** 在原始下行文本上检测（保留 ANSI 转义序列） */
function hasYnPrompt(raw: string): boolean {
    const ansi = '(?:\\x1b\\[[0-9;]*m)*';
    const ynWithAnsi = new RegExp(
        `[(（]${ansi}y${ansi}\\/${ansi}n${ansi}[)）]|${ansi}y${ansi}\\/${ansi}n`,
        'i'
    );
    return ynWithAnsi.test(raw);
}

function hasMfPrompt(raw: string): boolean {
    const ansi = '(?:\\x1b\\[[0-9;]*m)*';
    const mfWithAnsi = new RegExp(
        `(?:男性|女性)[^\\r\\n]*?\\(${ansi}m${ansi}\\)[^\\r\\n]*?(?:或|/|、|,|，)[^\\r\\n]*?\\(${ansi}f${ansi}\\)|\\(${ansi}m${ansi}\\)[^\\r\\n]*?\\(${ansi}f${ansi}\\)|${ansi}m${ansi}\\/${ansi}f`,
        'i'
    );
    return mfWithAnsi.test(raw);
}

function hasEmailPrompt(raw: string): boolean {
    // 基于服务端原始下行数据匹配，允许 ANSI 序列夹在中文之间
    return new RegExp(/\[1;36mregister/i).test(raw);
}

/** 原始下行中含 [2;37;0m您可以选择(choose，兼容前有 ESC */
function hasChooseCharacterPrompt(raw: string): boolean {
    return /(?:\x1b)?\[2;37;0m您可以选择\(choose/i.test(raw);
}

const computeQuickActions = (latestChunk: string): QuickAction[] => {
    const raw = `${latestChunk ?? ''}`;
    const actions: QuickAction[] = [];

    // 菜单区按钮处理：不在终端快捷条重复显示
    if (hasYnPrompt(raw) || hasMfPrompt(raw)) {
        return actions;
    }

    if (/(人物请输入new。)|(\bnew\b)/i.test(raw)) {
        actions.push({ id: 'send-new', label: '发送 new', command: 'new' });
    }

    // 客户端检测确认
    if (/(即将开始检测你的客户端)|(detect)/i.test(raw)) {
        actions.push({ id: 'send-y-detect', label: '发送 y', command: 'y' });
    }

    // 去重（同 id）
    const seen = new Set<string>();
    return actions.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
    });
};

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
        emits('pageMorePrompt', false);
        base.sendMessage('');
        sendCommand('', terminal);
        return;
    }

    const parts = splitSemicolonCommands(raw);
    if (parts.length === 0) return;

    if (parts.some((p) => isUserMoveCommandInput(p))) {
        invalidateMudExitDirs();
    }

    if (parts.some((p) => p.trim().toLowerCase() === 'q')) {
        pageMoreHidden.value = true;
    }
    emits('pageMorePrompt', false);
    logic.addCommandToHistory(raw);
    inputBox.value = '';

    const batches = chunkArray(parts, SEMICOLON_BATCH_MAX);
    for (let b = 0; b < batches.length; b++) {
        if (b > 0) await delayMs(SEMICOLON_BATCH_GAP_MS);
        const batch = batches[b];
        for (let i = 0; i < batch.length; i++) {
            if (i > 0) await delayMs(SEMICOLON_COMMAND_GAP_MS);
            base.sendMessage(batch[i]);
            sendCommand(batch[i], terminal);
        }
    }
};

/**
 * 处理用户输入的命令，将命令发送到基础服务并在终端显示。
 * @param command - 用户输入的命令
 * @param terminal - 终端实例
 */
const sendCommand = (command: string, terminal: any, type?: any) => {
    if (type === 'client') {
        let sp: Array<string> | string = command.split('\\');
        sp = sp[sp.length - 1];
        emits('sendCommandToChannel', sp);
    }

    const afterWrite = () => {
        if (inputRef.value) {
            const inputElement = inputRef.value.$el.querySelector('input') as HTMLInputElement;
            if (inputElement) {
                inputElement.select();
            }
        }
        scrollToBottom();
    };

    /** 纯回车上行不在前端回显（避免刷屏 [↵]） */
    if (command === '') {
        afterWrite();
        return;
    }

    const displayCmd = command;
    let cmd = `${base.colors.green}[ ${displayCmd} ]${base.colors.reset}\r\n`;
    if (type === 'client') {
        cmd = `${base.colors.blue}${displayCmd}${base.colors.reset}\r\n`;
    }

    terminal.value.write(`${cmd}\r\n`, afterWrite);

    // 定义可替换的关键字数组，使用 as const 声明为只读元组
    const keywords = ['show', 'set'] as const;
    // 定义关键字对应的处理函数对象
    const keywordHandlers = {
        // show: (terminal: any, cmd: string) => {
        //     terminal.value.write(`${yellowColor}${cmd}${resetColor}\r\n`);
        // },
        set: (terminal: any, cmd: string) => {
            emits('menuCommand', { command: cmd });
        }
    };
    let isMatched = false;

    // 使用 for 循环遍历，明确 keyword 的类型
    // for (const keyword of keywords) {
    //     // 使用 RegExp 构造函数创建动态正则表达式
    //     const showRegex = new RegExp(`^#${keyword}\\s?(.*)*`);
    //     const match = showRegex.exec(command);
    //     if (match) {
    //         isMatched = true;
    //         // 测试触发，不发送服务器请求
    //         const cmd = match[1];
    //         if (keywordHandlers[keyword]) {
    //             // 唤起前端界面，用match['input']
    //             // 后端命令用cmd
    //             keywordHandlers[keyword](terminal, cmd == undefined ? match['input'] : cmd);
    //         }
    //     }
    // }

    if (!isMatched) {
        // 向基础服务发送命令
        // base.postMessage({ type: 'command', content: command });
    }
};

/**
 * 处理键盘事件，支持 Alt + 上箭头回滚命令和 Alt + 下箭头翻到下一条命令。
 * @param event - 键盘事件对象
 */
const handleKeyDown = (event: Event) => {
    // 类型断言为 KeyboardEvent
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.altKey && keyboardEvent.key === 'ArrowUp') {
        // 调用封装方法回滚到上一条命令
        const previousCommand = logic.getPreviousCommand();
        if (previousCommand !== null) {
            inputBox.value = previousCommand;
        }
    } else if (keyboardEvent.altKey && keyboardEvent.key === 'ArrowDown') {
        // 调用封装方法翻到下一条命令
        const nextCommand = logic.getNextCommand();
        inputBox.value = nextCommand;
    }
};

/**
 * 滚动到终端底部。
 */
const scrollToBottom = () => {
    if (terminal.value) {
        terminal.value.scrollToBottom();
        // 使用新变量名
        showDownBtn.value = false;
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

/** 菜单区 y/n 按钮调用：发送并收起菜单按钮 */
const sendMudQuick = (command: string) => {
    runQuickAction(command);
    emits('ynPrompt', false);
    emits('mfPrompt', false);
    emits('chooseCharacterPrompt', false);
    emits('askLaoHerePrompt', false);
    emits('washToPrompt', false);
    emits('infoTopicsPrompt', false);
    emits('leaveVillagePrompt', false);
    emits('kuaiyiPvpPvePrompt', false);
    emits('closeEyePrompt', false);
    emits('laoHuaboPrompt', false);
    emits('characterExistsPasswordPrompt', false);
    emits('pageMorePrompt', false);
};

const sendNextPageEnter = () => {
    if (!terminal.value) return;
    emits('pageMorePrompt', false);
    base.sendMessage('');
    sendCommand('', terminal, 'client');
};

/** 菜单「结束」：发 q 并收起「下一页」「结束」 */
const sendPageEndQuit = () => {
    if (!terminal.value) return;
    pageMoreHidden.value = true;
    emits('pageMorePrompt', false);
    base.sendMessage('q');
    sendCommand('q', terminal, 'client');
};

const focusEmailInput = () => {
    inputPlaceholder.value = '输入邮箱（格式：reg xxx@xxx.com）';
    handlefocus();
};

const sendCharacterChoice = (command: string) => {
    runQuickAction(command);
    inputBox.value = '';
    emits('chooseCharacterPrompt', false);
};

const sendAskLaoHereChoice = (command: string) => {
    runQuickAction(command);
    emits('askLaoHerePrompt', false);
};

const sendWashToChoice = (command: string) => {
    runQuickAction(command);
    emits('washToPrompt', false);
};

/** 仅发命令，不收起菜单区「信息」提示（可连续点多个数字）；同步写入底部命令栏 */
const sendInfoTopicChoice = (command: string) => {
    runQuickAction(command);
    inputBox.value = command;
    handlefocus();
};

const sendLeaveVillageChoice = (command: string) => {
    runQuickAction(command);
    emits('leaveVillagePrompt', false);
};

const sendKuaiyiPvpPveChoice = (command: string) => {
    runQuickAction(command);
    inputBox.value = '';
    emits('kuaiyiPvpPvePrompt', false);
};

const sendCloseEyeChoice = (command: string) => {
    runQuickAction(command);
    emits('closeEyePrompt', false);
};

const sendLaoHuaboChoice = (command: string) => {
    runQuickAction(command);
    emits('laoHuaboPrompt', false);
};

defineExpose({
    sendMudQuick,
    focusEmailInput,
    sendCharacterChoice,
    sendAskLaoHereChoice,
    sendWashToChoice,
    sendInfoTopicChoice,
    sendLeaveVillageChoice,
    sendKuaiyiPvpPveChoice,
    sendCloseEyeChoice,
    sendLaoHuaboChoice,
    sendNextPageEnter,
    sendPageEndQuit
});

// 组件卸载时移除监听器
onUnmounted(() => {
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
    .quick-actions {
        display: flex;
        gap: 6px;
        padding: 6px 6px;
        background: #0f0f0f;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        z-index: 3;
        flex-wrap: wrap;
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

    .down-button {
        position: absolute;
        right: 1px;
        bottom: 29px;
        z-index: 1;
        padding: 8px 14px;
        background: #1f1f1f;
        border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
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
        background: linear-gradient(165deg, rgba(42, 48, 58, 0.94) 0%, rgba(22, 24, 32, 0.97) 55%, rgba(16, 18, 26, 0.98) 100%);
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
}
</style>
