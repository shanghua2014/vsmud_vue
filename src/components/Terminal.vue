<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container"></div>
        <el-input v-model="inputBox" @keydown.enter="handleInput" placeholder="命令" ref="inputRef" class="terminal-input" />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElInput } from 'element-plus'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

import 'xterm/css/xterm.css'

// Props
const props = defineProps<{
    terminalDatas: string
}>()

declare global {
    interface Window {
        customParent: {
            postMessage: (message: any) => void
        }
    }
}

// 使用 ref 获取 DOM 元素
const terminalContainer = ref<HTMLDivElement | null>(null)
const inputBox = ref('')
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)
const terminal = ref<Terminal | null>(null)

onMounted(() => {
    // 初始化 xterm
    terminal.value = new Terminal({
        cursorBlink: false, // 禁用光标闪烁
        fontSize: 14,
        theme: {
            background: '#1e1e1e',
            foreground: '#ffffff'
        },
        scrollback: 300 // 限制最大行数为 300 行
    })
    const fitAddon = new FitAddon()
    terminal.value.loadAddon(fitAddon)

    if (terminalContainer.value) {
        terminal.value.open(terminalContainer.value)
        fitAddon.fit() // 调整终端尺寸以适应容器
        terminal.value.write(`${props.terminalDatas}\r\n`)
    }

    // 聚焦到 el-input
    inputRef.value?.focus()

    // 监听窗口大小变化，动态调整终端尺寸
    window.addEventListener('resize', () => {
        fitAddon.fit()
        if (terminal.value) {
            terminal.value.scrollToBottom() // 确保调整尺寸后光标在最底部
        }
    })

    window.addEventListener('message', (event) => {
        if (location.protocol === 'http:') return
        const message = event.data
        console.log('vue,我收到了消息', message)
        switch (message.type) {
            case 'mud':
                terminal.value && terminal.value.write(message.data)
                break
        }
    })
})

// 处理用户输入的命令
const handleCommand = (command: string, terminal: any) => {
    console.log('handleCommand方法')
    if (command === '') {
        terminal.value.write(`${command}\r\n`)
    } else if (command === 'clear') {
        terminal.value.clear() // 清空终端
    } else if (command === 'help') {
        terminal.value.write('Available commands: clear, help\r\n')
    } else {
        terminal.value.write(`${command}\r\n`)
        if (location.protocol === 'http:') return
        // 发送消息给 vscode 扩展
        window.customParent.postMessage({ type: 'command', content: command })
    }
    terminal.value.scrollToBottom() // 确保光标在最底部
}

// 处理输入框的输入
const handleInput = () => {
    if (inputBox.value && terminal.value) {
        const command = inputBox.value
        handleCommand(command, terminal)
        inputBox.value = '' // 清空输入框
    }
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
    }

    .terminal-input {
        width: 100%; /* 输入框宽度占满 */
        box-sizing: border-box;
    }

    div.xterm {
        div.xterm-rows {
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
