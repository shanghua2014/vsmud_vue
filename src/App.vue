<template>
    <Terminal v-if="false" :terminalDatas="terminalData" />
    <AddHost v-if="false" />
    <Mudlist v-if="true" />
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue'
import Mudlist from './components/Mudlist.vue'
import AddHost from './components/AddHost.vue'
import { onMounted, ref, onUnmounted } from 'vue'

const terminalData = ref('')

// 接收来自vscode扩展的消息
onMounted(() => {
    window.addEventListener('message', (event) => {})
})

// 组件卸载时断开观察器
onUnmounted(() => {
    window.removeEventListener('message', () => {})
})
</script>
