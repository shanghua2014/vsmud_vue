<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container"></div>
        <el-input v-model="inputBox" @keydown.enter="handleInput" placeholder="命令" ref="inputRef" class="terminal-input" />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElInput } from 'element-plus'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

import { Base, xTermLoginc } from '@/global'

declare global {
    interface Window {
        customParent: {
            postMessage: (message: any) => void
        }
    }
}

const logic = new xTermLoginc()
const base = new Base()

// 使用 ref 获取 DOM 元素
const terminalContainer = ref<HTMLDivElement | null>(null)
const inputBox = ref('')
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)
const terminal = ref<Terminal | null>(null)

onMounted(() => {
    terminal.value = new Terminal({
        convertEol: true,
        fontFamily: 'Fira Code, Sarasa Mono SC Nerd, Courier New, monospace',
        fontSize: 14,
        lineHeight: 1.2, // 适当增大行高
        theme: {
            foreground: '#D3D3D3'
        },
        scrollback: 300, // 限制最大行数为 300 行
        // 允许使用提议 API
        allowProposedApi: true,
        allowTransparency: true
    })

    const fitAddon = new FitAddon()
    terminal.value.loadAddon(fitAddon)

    if (terminalContainer.value) {
        terminal.value.open(terminalContainer.value)
        fitAddon.fit() // 调整终端尺寸以适应容器
    }

    // 终端一系列事件监听
    logic.eventListener(terminal, inputRef, fitAddon)

    // 聚焦到 el-input
    inputRef.value?.focus()

    // 监听来自 vscode 扩展的消息
    window.addEventListener('message', (event) => {
        if (location.protocol === 'http:') return
        const message = event.data
        switch (message.type) {
            case 'mud':
                // 处理 mud 消息
                logic.termWrite(terminal, message.datas)
                break
        }
    })
})

// 处理输入框的输入
const handleInput = () => {
    if (inputBox.value && terminal.value) {
        const command = inputBox.value
        handleCommand(command, terminal)
    }
}

// 处理用户输入的命令
const handleCommand = (command: string, terminal: any) => {
    base.postMessage({ type: 'command', content: command })
    terminal.value.write(`[${command}]\r\n`, () => {
        inputBox.value = ''
        terminal.value.scrollToBottom() // 确保光标在最底部
    })
}
</script>

<style lang="scss">
.terminal-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh; /* 占满整个视口高度 */
    width: 100vw; /* 占满整个视口宽度 */
    overflow: hidden;
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
                // 强制设置 letter-spacing 为 normal
                letter-spacing: normal !important;
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
}
</style>
