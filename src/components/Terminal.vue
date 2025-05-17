<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container" @click="handlefocus"></div>
        <el-input v-model="inputBox" @keydown.enter="handleInput" @keydown="handleKeyDown" placeholder="命令" ref="inputRef" class="terminal-input" />
        <el-button v-if="showDownBtn" @click="scrollToBottom" class="down-button" title="置底(alt+z)">
            <Bottom style="width: 1em; height: 1em" />
        </el-button>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { ElInput, ElMessage, ElButton } from 'element-plus';
import { Bottom } from '@element-plus/icons-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { Base, xTermLoginc } from '@/utils/util';

// 声明全局 window 对象的自定义属性
declare global {
    interface Window {
        customParent: {
            postMessage: (message: any) => void;
        };
    }
}

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
// 控制向下按钮是否显示，替换为简短变量名
const showDownBtn = ref(false);

// 定义 emit 事件，添加新事件 notifyParent
const emits = defineEmits(['showDownward', 'menuCommand']);

let removeScrollListener: () => void;

// 组件挂载后执行初始化操作
onMounted(() => {
    // 创建 xTerm 终端实例
    terminal.value = new Terminal({
        fontFamily: 'Fira Code, Sarasa Mono SC Nerd, Courier New, monospace',
        fontSize: 14,
        lineHeight: 1.2, // 适当增大行高
        theme: {
            foreground: '#D3D3D3'
        },
        scrollback: 300, // 限制最大行数为 300 行
        allowProposedApi: true
    });

    // 向终端写入欢迎信息
    for (let i = 0; i < 100; i++) {
        // terminal.value.write(`\r\n`);
        terminal.value.write(`[ 欢迎使用 xTerm 终端-${i} ]\r\n`);
    }

    // 创建终端尺寸适配插件实例
    const fitAddon = new FitAddon();
    // 加载终端尺寸适配插件
    terminal.value.loadAddon(fitAddon);

    // 若终端容器元素存在，打开终端并调整尺寸
    if (terminalContainer.value) {
        terminal.value.open(terminalContainer.value);
        fitAddon.fit(); // 调整终端尺寸以适应容器
    }

    // 为终端添加一系列事件监听器
    logic.eventListener(terminal, inputRef, fitAddon, ElMessage);

    // 聚焦到输入框
    handlefocus();

    // 监听来自 vscode 扩展的消息
    window.addEventListener('message', (event) => {
        // 若协议为 http 则不处理消息
        if (location.protocol === 'http:') return;
        const message = event.data;
        console.log('Vue消息:', message);
        switch (message.type) {
            case 'mud':
                // 处理 mud 消息
                logic.termWrite(terminal, message.datas);
                break;
            case 'cmd':
                // 处理 mud 消息
                base.postMessage({ type: 'command', content: message.datas });
                terminal.value && terminal.value.write('[ ' + message.datas + ' ] \r\n');
                break;
        }
    });

    // 调用封装的滚动监听方法
    removeScrollListener = logic.setupScrollListener(terminalContainer, showDownBtn, emits);
});

/**
 * 点击终端区域时让输入框获得焦点。
 */
const handlefocus = () => {
    inputRef.value?.focus();
};

/**
 * 处理输入框的输入，将非空命令添加到历史记录并发送命令。
 */
const handleInput = () => {
    if (terminal.value) {
        const command = inputBox.value;
        // 判断命令是否不为空，不为空则添加到历史记录
        if (command.trim() !== '') {
            // 调用封装方法添加命令到历史记录
            logic.addCommandToHistory(command);
        }
        // 处理用户输入的命令
        sendCommand(command, terminal);
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
 * 处理用户输入的命令，将命令发送到基础服务并在终端显示。
 * @param command - 用户输入的命令
 * @param terminal - 终端实例
 */
const sendCommand = (command: string, terminal: any) => {
    // 定义不同颜色的 ANSI 转义序列，这里使用绿色
    const greenColor = '\x1b[0;40m\x1b[1;32m';
    const yellowColor = '\x1b[0;40m\x1b[1;33m';
    const resetColor = '\x1b[0m';
    terminal.value.write(`${greenColor}[ ${command} ]${resetColor}\r\n`, () => {
        // 全选输入框中的内容
        if (inputRef.value) {
            const inputElement = inputRef.value.$el.querySelector('input') as HTMLInputElement;
            if (inputElement) {
                inputElement.select();
            }
        }
        scrollToBottom(); // 确保光标在最底部
    });

    // 定义可替换的关键字数组，使用 as const 声明为只读元组
    const keywords = ['show', 'set'] as const;
    // 定义关键字对应的处理函数对象
    const keywordHandlers = {
        show: (terminal: any, cmd: string) => {
            terminal.value.write(`${yellowColor}${cmd}${resetColor}\r\n`);
        },
        set: (terminal: any, cmd: string) => {
            console.log(cmd);
            emits('menuCommand', { command: cmd });
        }
    };
    let isMatched = false;

    // 使用 for 循环遍历，明确 keyword 的类型
    for (const keyword of keywords) {
        // 使用 RegExp 构造函数创建动态正则表达式
        const showRegex = new RegExp(`^#${keyword}\\s?(.*)*`);
        const match = showRegex.exec(command);
        if (match) {
            isMatched = true;
            // 测试触发，不发送服务器请求
            const cmd = match[1];
            if (keywordHandlers[keyword]) {
                // 唤起前端界面，用match['input']
                // 后端命令用cmd
                keywordHandlers[keyword](terminal, cmd == undefined ? match['input'] : cmd);
            }
        }
    }

    if (!isMatched) {
        // 向基础服务发送命令
        base.postMessage({ type: 'command', content: command });
        // 在终端显示命令并清空输入框，滚动到终端底部
    }
};

/**
 * 滚动到终端底部。
 */
const scrollToBottom = () => {
    if (terminal.value) {
        terminal.value.scrollToBottom();
        console.log('滚动到底部');
        // 使用新变量名
        showDownBtn.value = false;
    }
};

// 组件卸载时移除监听器
onUnmounted(() => {
    removeScrollListener();
});
</script>

<style lang="scss">
.terminal-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%; /* 占满整个视口宽度 */
    height: 100vh; /* 占满整个视口高度 */
    overflow: hidden;
    position: relative;
    .terminal-container {
        flex: 1; /* 让终端容器占据剩余空间 */
        width: 100%; /* 宽度占满 */
        // 确保没有额外的 margin 和 padding
        margin: 0;
        padding: 0;
    }

    .terminal-input {
        width: 100%; /* 输入框宽度占满 */
        box-sizing: border-box;
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
            overflow-y: hidden; /* 允许垂直滚动 */
        }
    }

    .down-button {
        position: absolute;
        right: 0;
        bottom: 34px;
        z-index: 10;
    }
}
</style>
