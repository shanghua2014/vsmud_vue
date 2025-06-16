<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container" @click="handlefocus"></div>
        <el-input v-model="inputBox" @keydown.enter="handleInput" @keydown="handleKeyDown" placeholder="命令" ref="inputRef" class="terminal-input" />
        <el-button v-if="showDownBtn" @click="scrollToBottom" class="down-button" title="置底(alt+z)">
            <Bottom style="width: 31px; height: 1rem" />
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

import { Base, xTermLoginc } from '@/common/common';

// 声明全局 window 对象的自定义属性
declare global {
    interface Window {
        electronAPI: {
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, listener: (...args: any[]) => void) => void;
            off: (channel: string, listener: (...args: any[]) => void) => void;
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
const emits = defineEmits(['showDownward', 'menuCommand', 'sendCommandToChannel']);

let removeScrollListener: () => void;

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

    // 监听连接成功事件
    window.electronAPI.on('telnet-connected', () => {
        ElMessage.success('Telnet 连接成功！');
    });

    // 监听连接错误事件
    window.electronAPI.on('telnet-error', (errorMsg: string) => {
        ElMessage.error(`Telnet 错误：${errorMsg}`);
    });

    // 监听 Telnet 数据（显示到终端）
    window.electronAPI.on('to-vue', (data: any) => {
        if (terminal.value) {
            logic.termWrite(terminal, data);
        }
    });

    // 监听连接断开事件
    window.electronAPI.on('telnet-disconnected', () => {
        ElMessage.info('Telnet 连接已断开');
    });
});

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
        // 发送命令到 Telnet 服务器
        window.electronAPI.send('telnet-send', command);
        // window.electronAPI.send('sysCmdEvent', command);
        inputBox.value = '';
    }
};

/**
 * 处理用户输入的命令，将命令发送到基础服务并在终端显示。
 * @param command - 用户输入的命令
 * @param terminal - 终端实例
 */
const sendCommand = (command: string, terminal: any, type?: any) => {
    // 加载脚本文件
    let cmd = `${base.colors.green}[ ${command} ]${base.colors.reset}\r\n`;
    if (type === 'client') {
        cmd = `${base.colors.blue}${command}${base.colors.reset}\r\n`;
        let sp: Array<string> | string = command.split('\\');
        sp = sp[sp.length - 1];
        // 触发事件并传递 command 变量
        emits('sendCommandToChannel', sp);
        window.electronAPI.send('VueToElectron', sp);
    }

    // 显示内容到终端
    terminal.value.write(`${cmd}\r\n`, () => {
        // 全选输入框中的内容
        if (inputRef.value) {
            const inputElement = inputRef.value.$el.querySelector('input') as HTMLInputElement;
            if (inputElement) {
                inputElement.select();
            }
        }

        // 确保光标在最底部
        scrollToBottom();

        // if (command === 'telnet') {
        //     console.log('连接mud.pkuxkx.net');
        //     connectTelnet('mud.pkuxkx.net', 8081);
        // }
    });

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

// 连接 Telnet 服务器
const connectTelnet = (host: string, port: number) => {
    window.electronAPI.send('telnet-connect', { host, port });
};

// 断开 Telnet 连接
const disconnectTelnet = () => {
    window.electronAPI.send('telnet-disconnect');
};

// 组件卸载时移除监听器
onUnmounted(() => {
    removeScrollListener();
    // 组件卸载时断开 Telnet 连接
    disconnectTelnet();
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
}
</style>
