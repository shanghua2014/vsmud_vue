<template>
    <div class="terminal-wrapper">
        <div ref="terminalContainer" class="terminal-container"></div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { Bottom } from '@element-plus/icons-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { Base, xTermLoginc } from '@/utils/util';

const terminalContainer = ref<HTMLDivElement | null>(null);
const terminal = ref<Terminal | null>(null);

onMounted(() => {
    // 创建 xTerm 终端实例
    terminal.value = new Terminal({
        fontFamily: 'Fira Code, Sarasa Mono SC Nerd, Courier New, monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
            foreground: '#D3D3D3'
        },
        scrollback: 500,
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
});
</script>
